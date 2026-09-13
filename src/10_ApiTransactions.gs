/** API and transaction synchronization. */
function setRiseupPatV5(pat) {
  if (!pat || typeof pat !== 'string') throw new Error('PAT חסר.');
  pat = pat.trim();
  if (!pat.startsWith('riseup_pat_')) throw new Error('PAT אינו בפורמט RiseUp תקין.');
  PropertiesService.getScriptProperties().setProperty('RISEUP_PAT', pat);
  getSpreadsheet_().toast('PAT נשמר ב-Script Properties', 'רואה חשבון', 5);
}

function clearRiseupPatV5() {
  PropertiesService.getScriptProperties().deleteProperty('RISEUP_PAT');
}

function getRiseupPat_() {
  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');
  if (!pat) throw new Error('RISEUP_PAT אינו מוגדר.');
  if (!pat.startsWith('riseup_pat_')) throw new Error('RISEUP_PAT אינו בפורמט תקין.');
  return pat;
}

function riseupGet_(path, pat) {
  const url = V5.API_BASE + path;
  let delay = V5.INITIAL_RETRY_MS;
  let lastError = null;
  for (let attempt = 1; attempt <= V5.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, buildRiseupRequest_(pat));
      return parseRiseupResponse_(response, path);
    } catch (err) {
      lastError = err;
      if (attempt >= V5.MAX_RETRIES || !isRetryableRiseupError_(err)) break;
      Utilities.sleep(delay);
      delay *= 2;
    }
  }
  throw (lastError || new Error('RiseUp API request failed.'));
}

function riseupGetMany_(paths, pat) {
  const output = [];
  for (let start = 0; start < paths.length; start += V5.API_BATCH_SIZE) {
    const batch = paths.slice(start, start + V5.API_BATCH_SIZE);
    const requests = batch.map(function(path) {
      const request = buildRiseupRequest_(pat);
      request.url = V5.API_BASE + path;
      return request;
    });
    const responses = UrlFetchApp.fetchAll(requests);
    responses.forEach(function(response, index) {
      const path = batch[index];
      try {
        output.push(parseRiseupResponse_(response, path));
      } catch (err) {
        if (isRetryableRiseupError_(err)) output.push(riseupGet_(path, pat));
        else throw err;
      }
    });
  }
  return output;
}

function buildRiseupRequest_(pat) {
  return {
    method: 'get',
    headers: { Authorization: 'Bearer ' + pat, Accept: 'application/json' },
    muteHttpExceptions: true,
    followRedirects: false
  };
}

function parseRiseupResponse_(response, path) {
  const status = response.getResponseCode();
  const text = response.getContentText();
  if (status >= 200 && status < 300) return text ? JSON.parse(text) : {};
  if (status === 401) throw new Error('RISEUP_AUTH_401: ה-PAT פג או בוטל.');
  if (status === 403) throw new Error('RISEUP_AUTH_403: אין הרשאה מתאימה.');
  if (status === 429 || status >= 500) {
    throw new Error('RISEUP_RETRYABLE_' + status + ': ' + path + ' | ' + text.substring(0, 250));
  }
  throw new Error('RISEUP_API_' + status + ': ' + path + ' | ' + text.substring(0, 500));
}

function isRetryableRiseupError_(err) {
  return String(err && err.message ? err.message : err).indexOf('RISEUP_RETRYABLE_') !== -1;
}

function upsertTransactions_(transactions) {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const now = new Date();
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const existingValues = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 20).getValues() : [];
  const index = {};
  existingValues.forEach(function(row, i) {
    const id = String(row[0] || '').trim();
    if (id) index[id] = i;
  });

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let duplicates = 0;
  const appendRows = [];
  const updates = [];
  const incomingSeen = {};
  const largeTransactions = [];

  transactions.forEach(function(tx) {
    const id = getTransactionKey_(tx);
    if (incomingSeen[id]) { duplicates++; return; }
    incomingSeen[id] = true;
    const row = normalizeTransactionRow_(tx, now, id);
    if (Number(row[5]) >= V5.LARGE_TRANSACTION_ALERT) {
      largeTransactions.push({ id: id, businessName: row[3], amount: row[5], direction: row[6], sourceType: row[7] });
    }
    if (Object.prototype.hasOwnProperty.call(index, id)) {
      const oldRow = existingValues[index[id]];
      if (rowsEquivalent_(oldRow, row, 19)) unchanged++;
      else {
        updates.push({ rowNumber: index[id] + 2, values: row });
        updated++;
      }
    } else {
      appendRows.push(row);
      inserted++;
    }
  });

  writeTransactionUpdates_(sheet, updates);
  if (appendRows.length > 0) {
    const appendStartRow = sheet.getLastRow() + 1;
    sheet.getRange(appendStartRow, 1, appendRows.length, 20).setValues(appendRows);
    refreshDuplicateFormulas_(appendStartRow);
  }

  return {
    inserted: inserted,
    updated: updated,
    unchanged: unchanged,
    duplicates: duplicates,
    largeTransactions: largeTransactions
  };
}

function writeTransactionUpdates_(sheet, updates) {
  if (!updates.length) return;
  updates.sort(function(a, b) { return a.rowNumber - b.rowNumber; });
  const groups = [];
  let current = null;
  updates.forEach(function(op) {
    if (!current || op.rowNumber !== current.startRow + current.rows.length) {
      current = { startRow: op.rowNumber, rows: [] };
      groups.push(current);
    }
    current.rows.push(op.values);
  });
  groups.forEach(function(group) {
    sheet.getRange(group.startRow, 1, group.rows.length, 20).setValues(group.rows);
  });
}

function normalizeTransactionRow_(tx, syncedAt, forcedId) {
  const isIncome = tx.isIncome === true;
  const amount = Math.abs(Number(tx.amount || 0));
  const totalInstallments = tx.totalNumberOfInstallments != null
    ? tx.totalNumberOfInstallments
    : (tx.totalNumberOfPayments != null ? tx.totalNumberOfPayments : '');
  return [
    forcedId, isoToDate_(tx.transactionDate), tx.cashflowDate || tx.cashflowMonth || '',
    tx.businessName || '', tx.categoryLabel || '', amount, isIncome ? 'הכנסה' : 'הוצאה',
    tx.sourceType || '', tx.source || '', tx.accountNickname || '', tx.accountNumberHash || '',
    isoToDate_(tx.billingDate), tx.isInstallment === true,
    tx.installmentNumber != null ? tx.installmentNumber : '', totalInstallments,
    tx.isPostponed === true, tx.commitmentId || '', tx.actualType || '', tx.categoryType || '', syncedAt
  ];
}

function getTransactionKey_(tx) {
  if (tx.transactionId) return String(tx.transactionId);
  const raw = [
    tx.transactionDate || '', tx.businessName || '', Math.abs(Number(tx.amount || 0)).toFixed(2),
    tx.isIncome ? 'I' : 'E', tx.sourceType || '', tx.source || '', tx.accountNumberHash || '', tx.billingDate || ''
  ].join('|');
  return 'fp_' + sha256_(raw).substring(0, 32);
}

function rowsEquivalent_(oldRow, newRow, compareColumns) {
  for (let i = 0; i < compareColumns; i++) {
    if (normalizeCompareValue_(oldRow[i]) !== normalizeCompareValue_(newRow[i])) return false;
  }
  return true;
}

function normalizeCompareValue_(value) {
  if (value instanceof Date) return String(value.getTime());
  if (typeof value === 'number') return String(Math.round(value * 10000) / 10000);
  if (value === null || value === undefined) return '';
  return String(value);
}

function refreshDuplicateFormulas_(startRow) {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const lastRow = sheet.getLastRow();
  const firstRow = Math.max(Number(startRow || 2), 2);
  if (lastRow < firstRow) return;
  const rows = lastRow - firstRow + 1;
  sheet.getRange(firstRow, 21, rows, 1).setFormulaR1C1('=COUNTIF(C1,RC1)');
  sheet.getRange(firstRow, 22, rows, 1).setFormulaR1C1('=IF(RC[-1]=1,"ייחודי","⚠️ כפילות")');
}

function checkDuplicatesV5() {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('אין עסקאות לבדיקה.'); return; }
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const count = {};
  ids.forEach(function(id) {
    id = String(id || '').trim();
    if (!id) return;
    count[id] = (count[id] || 0) + 1;
  });
  const duplicates = Object.keys(count).filter(function(id) { return count[id] > 1; });
  SpreadsheetApp.getUi().alert('בדיקת כפילויות', duplicates.length === 0 ? '✅ לא נמצאו כפילויות.' : '⚠️ נמצאו ' + duplicates.length + ' מזהים כפולים.', SpreadsheetApp.getUi().ButtonSet.OK);
  return duplicates;
}
