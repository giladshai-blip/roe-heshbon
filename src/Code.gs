/**
 * ============================================================
 * רואה חשבון - מערכת פיננסית
 * RiseUp Sync V5.4
 * ============================================================
 *
 * שינויים עיקריים לעומת V5.2:
 * - תיקון יתרת עו"ש: תנועות checkingAccount נספרות רק אחרי העוגן ועד סוף היום הנוכחי.
 * - יישור גרסה ל-V5.4.
 * - הדשבורד מנוהל בקובץ Dashboard.gs ונבנה באמצעות installCleanDashboardV54().
 * - setup אינו מוחק/בונה דשבורד אוטומטית.
 * - יישור RTL מוגבל לטווחים בשימוש ולא לכל רשת הגיליון.
 * - נשמרת תאימות לפונקציות V5 הקיימות ולטריגר syncRiseUpV5.
 *
 * אין לשמור PAT בקוד או בגיליון. PAT נשמר ב-Script Properties בלבד.
 * ============================================================
 */

const V5 = {
  VERSION: 'V5.4',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  API_BASE: 'https://input.riseup.co.il',
  SAFETY_MONTHS: 2,
  LARGE_TRANSACTION_ALERT: 2000,
  MAX_RETRIES: 4,
  INITIAL_RETRY_MS: 1000,
  SHEETS: {
    DASHBOARD: 1977013179,
    PLANNED_CASHFLOW: 1547466109,
    TRANSACTIONS: 1742321487,
    ANNUAL_CASHFLOW: 1072133063,
    BUDGET: 384115864,
    CASHFLOW: 1556837313,
    CREDIT_CARDS: 815890344,
    LOANS: 914307094,
    SAVINGS: 252819601,
    GOALS: 79691250,
    RULES: 778256791,
    CONFIG: 1840391247,
    SYNC_LOG: 1397640406,
    REFERENCE_DATA: 951439932,
    ASSETS: 830329847,
    VERIFICATION: 1292157954,
    FIXED_COMMITMENTS: 245410665,
    PAYMENTS_TRACKING: 129902509,
    HISTORY_12M: 1968192006,
    FINANCIAL_SOURCES: 259364329,
    OFFICIAL_DATA: 844330871,
    OFFICIAL_FUNDS: 721693875,
    OFFICIAL_API_CONFIG: 1237513642,
    FIVE_YEAR_PLAN: 1202266497
  },
  TRANSACTION_HEADERS: [
    'transactionId','transactionDate','cashflowMonth','businessName','categoryLabel','amount','direction','sourceType','source','accountNickname','accountNumberHash','billingDate','isInstallment','installmentNumber','totalInstallments','isPostponed','commitmentId','actualType','categoryType','lastSyncedAt'
  ],
  BUDGET_HEADERS: [
    'budgetDate','envelopeId','type','originalAmount','balancedAmount','balanceDate','lastUpdatedAt','cashflowHash','rawData'
  ]
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💼 רואה חשבון')
    .addItem('🔄 סנכרון RiseUp עכשיו', 'runV5Now')
    .addItem('📚 סנכרון 12 חודשים', 'syncRiseUpHistory12MonthsV5')
    .addSeparator()
    .addItem('🏦 עדכון יתרת עו״ש מאומתת', 'promptVerifiedBankBalanceV5')
    .addItem('🧮 רענון תחזיות וחישובים', 'refreshForecastsV5')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('🎛 לוח מחוונים')
        .addItem('📊 מעבר ללוח מחוונים', 'openDashboardV5')
        .addItem('🎯 התקנת / רענון דשבורד נקי', 'installCleanDashboardV54')
        .addItem('🗑 ניקוי הדשבורד', 'clearCleanDashboardV54')
    )
    .addSeparator()
    .addItem('🩺 בדיקת מערכת', 'healthCheckV5')
    .addItem('🔍 בדיקת כפילויות', 'checkDuplicatesV5')
    .addItem('✅ סריקת סטטוסי אימות', 'scanVerificationStatusV5')
    .addItem('ℹ️ סטטוס מערכת', 'showSystemStatusV5')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('⚙️ הגדרות מערכת')
        .addItem('🛠 התקנת / שדרוג V5.4', 'setupV54')
        .addItem('⏰ התקנת סנכרון שעתי', 'installHourlyTriggerV5')
        .addItem('🗑 מחיקת טריגר V5', 'deleteV5Triggers')
    )
    .addToUi();
}

function onInstall() {
  onOpen();
}

function setupV54() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error('המערכת כרגע בשימוש. נסה שוב בעוד מספר שניות.');
  }

  try {
    validateRequiredSheets_();
    setupTransactionHeaders_();
    setupBudgetHeaders_();
    setupSyncLogHeaders_();

    setConfigParam_('גרסת מערכת', V5.VERSION, '', 'RiseUp Sync V5.4');
    setConfigParam_('מקור עסקאות', 'get_transactions', '', 'RiseUp External API');
    setConfigParam_('מפתח upsert', 'transactionId + fingerprint fallback', '', 'transactionId מפתח ראשי');
    setConfigParam_('חלון סנכרון עסקאות', V5.SAFETY_MONTHS, 'חודשים', 'חודש נוכחי + חודש קודם');
    setConfigParam_('מצב מנוע תחזיות', 'AUTO', '', 'כל נתון חדש מחייב בדיקת השפעה על התחזיות');

    ensureAutomaticBankBalanceFormula_();
    formatSystemSheetsRTL_();
    refreshDuplicateFormulas_();

    SpreadsheetApp.flush();

    const health = healthCheckV5_();

    logSync_({
      action: 'V5.4 Setup',
      status: health.ok ? 'SUCCESS' : 'WARNING',
      records: 0,
      message: 'התקנת RiseUp Sync ' + V5.VERSION,
      syncState: 'SETUP',
      health: health.summary
    });

    getSpreadsheet_().toast(
      'V5.4 הותקן. הדשבורד נשאר ללא שינוי עד להרצת installCleanDashboardV54',
      'רואה חשבון',
      8
    );

    return health;
  } finally {
    lock.releaseLock();
  }
}

// תאימות לגרסאות קודמות.
function setupV5() {
  return setupV54();
}

function setRiseupPatV5(pat) {
  if (!pat || typeof pat !== 'string') {
    throw new Error('PAT חסר.');
  }

  pat = pat.trim();

  if (!pat.startsWith('riseup_pat_')) {
    throw new Error('PAT אינו בפורמט RiseUp תקין.');
  }

  PropertiesService.getScriptProperties().setProperty('RISEUP_PAT', pat);
  getSpreadsheet_().toast('PAT נשמר ב-Script Properties', 'רואה חשבון', 5);
}

function clearRiseupPatV5() {
  PropertiesService.getScriptProperties().deleteProperty('RISEUP_PAT');
}

function getRiseupPat_() {
  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');

  if (!pat) {
    throw new Error('RISEUP_PAT אינו מוגדר.');
  }

  if (!pat.startsWith('riseup_pat_')) {
    throw new Error('RISEUP_PAT אינו בפורמט תקין.');
  }

  return pat;
}

function syncRiseUpV5() {
  const startedAt = new Date();
  const startMs = Date.now();
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(10000)) {
    logSync_({
      action: 'RiseUp Sync V5',
      status: 'SKIPPED',
      records: 0,
      message: 'סנכרון אחר כבר פעיל',
      syncState: 'LOCKED'
    });
    return null;
  }

  const metrics = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    duplicates: 0,
    months: [],
    largeTransactions: [],
    budgetUpdated: false,
    tokenRef: '',
    riseupLastUpdatedAt: '',
    balanceBefore: '',
    balanceAfter: '',
    errors: []
  };

  try {
    validateRequiredSheets_();

    const pat = getRiseupPat_();
    metrics.balanceBefore = getAutomaticBankBalance_();
    metrics.months = getSyncMonths_();

    let allTransactions = [];

    metrics.months.forEach(function(month) {
      const response = riseupGet_(
        '/api/external/transactions?cashflowMonth=' + encodeURIComponent(month),
        pat
      );

      if (response && response._meta && response._meta.tokenRef) {
        metrics.tokenRef = response._meta.tokenRef;
      }

      const transactions = response && Array.isArray(response.transactions)
        ? response.transactions
        : [];

      allTransactions = allTransactions.concat(transactions);
    });

    const txResult = upsertTransactions_(allTransactions);

    metrics.inserted = txResult.inserted;
    metrics.updated = txResult.updated;
    metrics.unchanged = txResult.unchanged;
    metrics.duplicates = txResult.duplicates;
    metrics.largeTransactions = txResult.largeTransactions;

    const currentMonth = formatMonth_(new Date());

    const budgetResponse = riseupGet_(
      '/api/external/budget/' + encodeURIComponent(currentMonth),
      pat
    );

    if (budgetResponse && budgetResponse._meta && budgetResponse._meta.tokenRef) {
      metrics.tokenRef = budgetResponse._meta.tokenRef;
    }

    if (budgetResponse && budgetResponse.lastUpdatedAt) {
      metrics.riseupLastUpdatedAt = new Date(budgetResponse.lastUpdatedAt);
    }

    metrics.budgetUpdated = syncBudget_(currentMonth, budgetResponse);

    setConfigParam_('תאריך רענון אחרון', new Date(), '', 'RiseUp Sync ' + V5.VERSION);
    setConfigParam_(
      'מצב hash',
      metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED',
      '',
      'Budget hash'
    );

    ensureAutomaticBankBalanceFormula_();
    refreshDuplicateFormulas_();
    SpreadsheetApp.flush();

    metrics.balanceAfter = getAutomaticBankBalance_();

    const health = healthCheckV5_();

    logSync_({
      time: startedAt,
      action: 'RiseUp Sync V5',
      status: health.ok ? 'SUCCESS' : 'WARNING',
      records: allTransactions.length,
      message:
        'חודשים: ' + metrics.months.join(', ') +
        ' | חדשות: ' + metrics.inserted +
        ' | עודכנו: ' + metrics.updated +
        ' | ללא שינוי: ' + metrics.unchanged +
        ' | כפילויות API: ' + metrics.duplicates,
      tokenRef: metrics.tokenRef,
      riseupLastUpdatedAt: metrics.riseupLastUpdatedAt,
      syncState: metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED',
      durationMs: Date.now() - startMs,
      inserted: metrics.inserted,
      updated: metrics.updated,
      duplicates: metrics.duplicates,
      balanceBefore: metrics.balanceBefore,
      balanceAfter: metrics.balanceAfter,
      health: health.summary
    });

    showSyncToast_(metrics, health);

    return {
      success: health.ok,
      metrics: metrics,
      health: health
    };
  } catch (err) {
    metrics.errors.push(String(err && err.message ? err.message : err));

    logSync_({
      time: startedAt,
      action: 'RiseUp Sync V5',
      status: 'ERROR',
      records: 0,
      message: metrics.errors.join(' | '),
      durationMs: Date.now() - startMs,
      inserted: metrics.inserted,
      updated: metrics.updated,
      duplicates: metrics.duplicates,
      balanceBefore: metrics.balanceBefore,
      balanceAfter: metrics.balanceAfter,
      health: 'ERROR'
    });

    throw err;
  } finally {
    lock.releaseLock();
  }
}

function runV5Now() {
  const ui = SpreadsheetApp.getUi();

  try {
    const result = syncRiseUpV5();
    if (!result) return;

    ui.alert(
      'הסנכרון הסתיים',
      'חדשות: ' + result.metrics.inserted +
      '\nעודכנו: ' + result.metrics.updated +
      '\nיתרת עו״ש: ' + formatMoney_(result.metrics.balanceAfter) +
      '\n\n' + result.health.summary,
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert('שגיאת סנכרון', String(e.message || e), ui.ButtonSet.OK);
    throw e;
  }
}

function syncRiseUpHistory12MonthsV5() {
  const ui = SpreadsheetApp.getUi();

  const answer = ui.alert(
    'סנכרון 12 חודשים',
    'הפעולה תמשוך את 12 החודשים האחרונים ותבצע upsert ללא כפילות.\n\nלהמשיך?',
    ui.ButtonSet.YES_NO
  );

  if (answer !== ui.Button.YES) return;

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    ui.alert('סנכרון אחר כבר פעיל.');
    return;
  }

  const startedAt = new Date();

  try {
    const pat = getRiseupPat_();
    let allTransactions = [];
    const monthStats = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const month = formatMonth_(d);

      const response = riseupGet_(
        '/api/external/transactions?cashflowMonth=' + encodeURIComponent(month),
        pat
      );

      const transactions = response && Array.isArray(response.transactions)
        ? response.transactions
        : [];

      allTransactions = allTransactions.concat(transactions);
      monthStats.push(month + ': ' + transactions.length);
    }

    const result = upsertTransactions_(allTransactions);

    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();

    logSync_({
      time: startedAt,
      action: 'RiseUp History 12M V5',
      status: 'SUCCESS',
      records: allTransactions.length,
      message: monthStats.join(' | '),
      syncState: 'HISTORY_BACKFILL',
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.duplicates,
      balanceAfter: getAutomaticBankBalance_(),
      health: healthCheckV5_().summary
    });

    ui.alert(
      'הסנכרון ההיסטורי הסתיים',
      'סה״כ התקבלו: ' + allTransactions.length +
      '\nחדשות: ' + result.inserted +
      '\nעודכנו: ' + result.updated +
      '\nללא שינוי: ' + result.unchanged,
      ui.ButtonSet.OK
    );
  } finally {
    lock.releaseLock();
  }
}

function riseupGet_(path, pat) {
  const url = V5.API_BASE + path;
  let delay = V5.INITIAL_RETRY_MS;
  let lastError = null;

  for (let attempt = 1; attempt <= V5.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: 'get',
        headers: {
          Authorization: 'Bearer ' + pat,
          Accept: 'application/json'
        },
        muteHttpExceptions: true,
        followRedirects: false
      });

      const status = response.getResponseCode();
      const text = response.getContentText();

      if (status >= 200 && status < 300) {
        return text ? JSON.parse(text) : {};
      }

      if (status === 401) {
        throw new Error('RiseUp החזיר 401. ה-PAT פג או בוטל.');
      }

      if (status === 403) {
        throw new Error('RiseUp החזיר 403. אין הרשאה מתאימה.');
      }

      if (status === 429 || status >= 500) {
        lastError = new Error('RiseUp API ' + status + ': ' + text.substring(0, 250));

        if (attempt < V5.MAX_RETRIES) {
          Utilities.sleep(delay);
          delay *= 2;
          continue;
        }
      }

      throw new Error('RiseUp API ' + status + ': ' + text.substring(0, 500));
    } catch (err) {
      lastError = err;

      if (attempt >= V5.MAX_RETRIES) break;

      Utilities.sleep(delay);
      delay *= 2;
    }
  }

  throw lastError || new Error('RiseUp API request failed.');
}

function upsertTransactions_(transactions) {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const now = new Date();
  const lastRow = Math.max(sheet.getLastRow(), 1);

  let existingValues = [];

  if (lastRow >= 2) {
    existingValues = sheet.getRange(2, 1, lastRow - 1, 20).getValues();
  }

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

    if (incomingSeen[id]) {
      duplicates++;
      return;
    }

    incomingSeen[id] = true;

    const row = normalizeTransactionRow_(tx, now, id);

    if (Number(row[5]) >= V5.LARGE_TRANSACTION_ALERT) {
      largeTransactions.push({
        id: id,
        businessName: row[3],
        amount: row[5],
        direction: row[6],
        sourceType: row[7]
      });
    }

    if (Object.prototype.hasOwnProperty.call(index, id)) {
      const oldRow = existingValues[index[id]];

      if (rowsEquivalent_(oldRow, row, 19)) {
        unchanged++;
      } else {
        updates.push({
          rowNumber: index[id] + 2,
          values: row
        });
        updated++;
      }
    } else {
      appendRows.push(row);
      inserted++;
    }
  });

  updates.forEach(function(op) {
    sheet.getRange(op.rowNumber, 1, 1, 20).setValues([op.values]);
  });

  if (appendRows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, appendRows.length, 20).setValues(appendRows);
  }

  refreshDuplicateFormulas_();

  return {
    inserted: inserted,
    updated: updated,
    unchanged: unchanged,
    duplicates: duplicates,
    largeTransactions: largeTransactions
  };
}

function normalizeTransactionRow_(tx, syncedAt, forcedId) {
  const isIncome = tx.isIncome === true;
  const amount = Math.abs(Number(tx.amount || 0));

  const totalInstallments = tx.totalNumberOfInstallments != null
    ? tx.totalNumberOfInstallments
    : tx.totalNumberOfPayments != null
      ? tx.totalNumberOfPayments
      : '';

  return [
    forcedId,
    isoToDate_(tx.transactionDate),
    tx.cashflowDate || tx.cashflowMonth || '',
    tx.businessName || '',
    tx.categoryLabel || '',
    amount,
    isIncome ? 'הכנסה' : 'הוצאה',
    tx.sourceType || '',
    tx.source || '',
    tx.accountNickname || '',
    tx.accountNumberHash || '',
    isoToDate_(tx.billingDate),
    tx.isInstallment === true,
    tx.installmentNumber != null ? tx.installmentNumber : '',
    totalInstallments,
    tx.isPostponed === true,
    tx.commitmentId || '',
    tx.actualType || '',
    tx.categoryType || '',
    syncedAt
  ];
}

function getTransactionKey_(tx) {
  if (tx.transactionId) {
    return String(tx.transactionId);
  }

  const raw = [
    tx.transactionDate || '',
    tx.businessName || '',
    Math.abs(Number(tx.amount || 0)).toFixed(2),
    tx.isIncome ? 'I' : 'E',
    tx.sourceType || '',
    tx.source || '',
    tx.accountNumberHash || '',
    tx.billingDate || ''
  ].join('|');

  return 'fp_' + sha256_(raw).substring(0, 32);
}

function rowsEquivalent_(oldRow, newRow, compareColumns) {
  for (let i = 0; i < compareColumns; i++) {
    if (normalizeCompareValue_(oldRow[i]) !== normalizeCompareValue_(newRow[i])) {
      return false;
    }
  }
  return true;
}

function normalizeCompareValue_(value) {
  if (value instanceof Date) return String(value.getTime());

  if (typeof value === 'number') {
    return String(Math.round(value * 10000) / 10000);
  }

  if (value === null || value === undefined) return '';

  return String(value);
}

function refreshDuplicateFormulas_() {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  sheet.getRange(2, 21, lastRow - 1, 1).setFormulaR1C1('=COUNTIF(C1,RC1)');
  sheet.getRange(2, 22, lastRow - 1, 1).setFormulaR1C1('=IF(RC[-1]=1,"ייחודי","⚠️ כפילות")');
}

function checkDuplicatesV5() {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('אין עסקאות לבדיקה.');
    return;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const count = {};

  ids.forEach(function(id) {
    id = String(id || '').trim();
    if (!id) return;
    count[id] = (count[id] || 0) + 1;
  });

  const duplicates = Object.keys(count).filter(function(id) {
    return count[id] > 1;
  });

  SpreadsheetApp.getUi().alert(
    'בדיקת כפילויות',
    duplicates.length === 0
      ? '✅ לא נמצאו כפילויות.'
      : '⚠️ נמצאו ' + duplicates.length + ' מזהים כפולים.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function syncBudget_(month, response) {
  if (!response) return false;

  const hash = sha256_(stableStringify_(response));
  const oldHash = String(getConfigValue_('cashflowHash אחרון') || '');

  if (oldHash === hash) return false;

  const sheet = getSheetById_(V5.SHEETS.BUDGET);
  const lastUpdatedAt = response.lastUpdatedAt
    ? new Date(response.lastUpdatedAt)
    : new Date();

  const envelopes = Array.isArray(response.envelopes) ? response.envelopes : [];

  const newRows = envelopes.map(function(env) {
    return [
      response.budgetDate || month,
      env.id || '',
      env.type || '',
      Number(env.originalAmount || 0),
      Number(env.balancedAmount || 0),
      isoToDate_(env.balanceDate),
      lastUpdatedAt,
      hash,
      JSON.stringify(env)
    ];
  });

  const existingLastRow = sheet.getLastRow();
  let preservedRows = [];

  if (existingLastRow >= 2) {
    const existing = sheet.getRange(2, 1, existingLastRow - 1, 9).getValues();

    preservedRows = existing.filter(function(row) {
      return String(row[0] || '') !== String(response.budgetDate || month);
    });
  }

  const finalRows = preservedRows.concat(newRows);

  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
  }

  if (finalRows.length > 0) {
    sheet.getRange(2, 1, finalRows.length, 9).setValues(finalRows);
  }

  setConfigParam_('cashflowHash אחרון', hash, '', 'SHA-256 של Budget האחרון');

  return true;
}

function promptVerifiedBankBalanceV5() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt(
    '🏦 עדכון יתרת עו״ש מאומתת',
    'הכנס את יתרת העו״ש כפי שמופיעה בבנק.\nלדוגמה: -2396.69',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() !== ui.Button.OK) return;

  const cleaned = result.getResponseText()
    .replace(/,/g, '')
    .replace(/₪/g, '')
    .trim();

  const balance = Number(cleaned);

  if (isNaN(balance)) {
    ui.alert('הסכום אינו תקין.');
    return;
  }

  const source = ui.prompt(
    'מקור האימות',
    'לדוגמה: אפליקציית לאומי',
    ui.ButtonSet.OK_CANCEL
  );

  if (source.getSelectedButton() !== ui.Button.OK) return;

  const data = setVerifiedBankBalanceV5(
    balance,
    new Date(),
    source.getResponseText() || 'אימות ידני'
  );

  ui.alert(
    'יתרת העו״ש עודכנה',
    'יתרה מאומתת: ' + formatMoney_(balance) +
    '\nפער פיוס: ' +
    (data.reconciliationGap === ''
      ? 'לא ניתן לחשב'
      : formatMoney_(data.reconciliationGap)),
    ui.ButtonSet.OK
  );
}

function setVerifiedBankBalanceV5(balance, observedAt, sourceNote) {
  if (balance === '' || balance === null || isNaN(Number(balance))) {
    throw new Error('יתרה לא תקינה.');
  }

  if (!(observedAt instanceof Date)) {
    observedAt = observedAt ? new Date(observedAt) : new Date();
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const calculatedBefore = getAutomaticBankBalance_();

    setConfigParam_(
      'יתרת עו״ש נוכחית ידנית',
      Number(balance),
      '₪',
      'מאומת: ' + sourceNote
    );

    setConfigParam_(
      'תאריך ושעת יתרת עו״ש',
      observedAt,
      'תאריך/שעה',
      'מועד עוגן יתרה'
    );

    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();

    const calculatedAfter = getAutomaticBankBalance_();

    const reconciliationGap = calculatedBefore === '' || calculatedBefore === null
      ? ''
      : Number(balance) - Number(calculatedBefore);

    logSync_({
      action: 'Bank Reconciliation',
      status: 'SUCCESS',
      records: 0,
      message: 'עודכנה יתרת עו"ש מאומתת',
      syncState: 'RECONCILED',
      balanceBefore: calculatedBefore,
      balanceAfter: calculatedAfter,
      health: 'יתרה אומתה'
    });

    return {
      verifiedBalance: Number(balance),
      calculatedBefore: calculatedBefore,
      reconciliationGap: reconciliationGap,
      calculatedAfter: calculatedAfter
    };
  } finally {
    lock.releaseLock();
  }
}

function ensureAutomaticBankBalanceFormula_() {
  const sheet = getSheetById_(V5.SHEETS.CONFIG);

  const anchorRow = findConfigRow_('יתרת עו״ש נוכחית ידנית');
  const anchorTimeRow = findConfigRow_('תאריך ושעת יתרת עו״ש');
  let autoRow = findConfigRow_('יתרת עו״ש מחושבת אוטומטית');

  if (!autoRow) {
    autoRow = sheet.getLastRow() + 1;

    sheet.getRange(autoRow, 1, 1, 4).setValues([[
      'יתרת עו״ש מחושבת אוטומטית',
      '',
      '₪',
      'עוגן מאומת + תנועות checkingAccount חדשות עד סוף היום הנוכחי'
    ]]);
  }

  if (!anchorRow || !anchorTimeRow) {
    throw new Error('חסרים פרטי עוגן יתרת עו"ש.');
  }

  const formula =
    '=IF(OR(B' + anchorRow + '="",B' + anchorTimeRow + '=""),"",B' + anchorRow +
    '+SUMIFS(' +
      "'תנועות'!F:F," +
      "'תנועות'!H:H,\"checkingAccount\"," +
      "'תנועות'!G:G,\"הכנסה\"," +
      "'תנועות'!B:B,\">\"&B" + anchorTimeRow + ',' +
      "'תנועות'!B:B,\"<\"&TODAY()+1" +
    ')' +
    '-SUMIFS(' +
      "'תנועות'!F:F," +
      "'תנועות'!H:H,\"checkingAccount\"," +
      "'תנועות'!G:G,\"הוצאה\"," +
      "'תנועות'!B:B,\">\"&B" + anchorTimeRow + ',' +
      "'תנועות'!B:B,\"<\"&TODAY()+1" +
    '))';

  sheet.getRange(autoRow, 2).setFormula(formula);
}

function getAutomaticBankBalance_() {
  const row = findConfigRow_('יתרת עו״ש מחושבת אוטומטית');
  if (!row) return '';

  return getSheetById_(V5.SHEETS.CONFIG).getRange(row, 2).getValue();
}

function refreshForecastsV5() {
  ensureAutomaticBankBalanceFormula_();
  SpreadsheetApp.flush();
  Utilities.sleep(500);
  SpreadsheetApp.flush();

  setConfigParam_('רענון תחזיות אחרון', new Date(), '', 'רענון ידני');

  const health = healthCheckV5_();

  getSpreadsheet_().toast('התחזיות רועננו', 'רואה חשבון', 5);

  SpreadsheetApp.getUi().alert(
    'רענון תחזיות',
    health.summary,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function scanVerificationStatusV5() {
  const sheet = getSheetById_(V5.SHEETS.VERIFICATION);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('אין נתוני אימות.');
    return [];
  }

  const values = sheet.getRange(
    2,
    1,
    lastRow - 1,
    Math.min(sheet.getLastColumn(), 10)
  ).getDisplayValues();

  const patterns = [
    'דורש רענון',
    'לא מאומת',
    'סותר',
    'פתוח',
    'חסר',
    'חלקי',
    'טרם אומת'
  ];

  const openRows = [];

  values.forEach(function(row, index) {
    const text = row.join(' | ');

    if (patterns.some(function(pattern) {
      return text.indexOf(pattern) !== -1;
    })) {
      openRows.push(index + 2);
    }
  });

  SpreadsheetApp.getUi().alert(
    'סריקת אימות',
    openRows.length === 0
      ? '✅ לא נמצאו פריטים פתוחים.'
      : 'נמצאו ' + openRows.length + ' פריטים הדורשים טיפול או רענון.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return openRows;
}

function healthCheckV5() {
  const result = healthCheckV5_();

  SpreadsheetApp.getUi().alert(
    result.ok ? '🟢 Health Check תקין' : '🟡 Health Check',
    result.summary,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  return result;
}

function healthCheckV5_() {
  const issues = [];

  try {
    validateRequiredSheets_();
  } catch (e) {
    issues.push(String(e.message || e));
  }

  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');

  if (!pat || !pat.startsWith('riseup_pat_')) {
    issues.push('PAT חסר או לא תקין');
  }

  const balance = getAutomaticBankBalance_();

  if (balance === '' || balance === null || isNaN(Number(balance))) {
    issues.push('אין יתרת עו"ש מחושבת תקינה');
  }

  const formulaErrors = findFormulaErrors_();

  if (formulaErrors.length > 0) {
    issues.push('נמצאו ' + formulaErrors.length + ' שגיאות נוסחה');
  }

  const ok = issues.length === 0;

  return {
    ok: ok,
    issues: issues,
    balance: balance,
    formulaErrors: formulaErrors,
    summary: ok
      ? '🟢 המערכת תקינה\n\nיתרת עו״ש מחושבת: ' + formatMoney_(balance)
      : '🟡 נמצאו נקודות לבדיקה:\n\n• ' + issues.join('\n• ')
  };
}

function findFormulaErrors_() {
  const ids = [
    V5.SHEETS.DASHBOARD,
    V5.SHEETS.ANNUAL_CASHFLOW,
    V5.SHEETS.FIVE_YEAR_PLAN,
    V5.SHEETS.CONFIG
  ];

  const errors = [];
  const pattern = /#REF!|#N\/A|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#ERROR!/;

  ids.forEach(function(id) {
    const sheet = getSheetById_(id);
    const rows = Math.min(Math.max(sheet.getLastRow(), 1), 500);
    const cols = Math.min(Math.max(sheet.getLastColumn(), 1), 30);

    const values = sheet.getRange(1, 1, rows, cols).getDisplayValues();

    values.forEach(function(row, r) {
      row.forEach(function(value, c) {
        if (pattern.test(String(value))) {
          errors.push({
            sheet: sheet.getName(),
            cell: columnToLetter_(c + 1) + (r + 1),
            value: value
          });
        }
      });
    });
  });

  return errors;
}

function openDashboardV5() {
  const ss = getSpreadsheet_();
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);

  ss.setActiveSheet(sheet);
  sheet.getRange('A1').activate();
}

function showSystemStatusV5() {
  const health = healthCheckV5_();

  SpreadsheetApp.getUi().alert(
    'סטטוס מערכת',
    'גרסה: ' + V5.VERSION +
    '\nPAT: ' +
      (PropertiesService.getScriptProperties().getProperty('RISEUP_PAT')
        ? '✅ מוגדר'
        : '❌ חסר') +
    '\nיתרת עו"ש: ' + formatMoney_(getAutomaticBankBalance_()) +
    '\n\n' + health.summary,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function setupSyncLogHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.SYNC_LOG);

  const headers = [
    'זמן',
    'פעולה',
    'סטטוס',
    'מספר רשומות',
    'הודעה',
    'cashflowHash',
    'RiseUp lastUpdatedAt',
    'מצב סנכרון',
    'X-Riseup-Token-Ref',
    'משך_ms',
    'חדשות',
    'עודכנו',
    'כפילויות',
    'יתרה לפני',
    'יתרה אחרי',
    'Health Check'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function logSync_(data) {
  const sheet = getSheetById_(V5.SHEETS.SYNC_LOG);

  sheet.appendRow([
    data.time || new Date(),
    data.action || '',
    data.status || '',
    data.records || 0,
    data.message || '',
    getConfigValue_('cashflowHash אחרון') || '',
    data.riseupLastUpdatedAt || '',
    data.syncState || '',
    data.tokenRef || '',
    data.durationMs || '',
    data.inserted || 0,
    data.updated || 0,
    data.duplicates || 0,
    data.balanceBefore === undefined ? '' : data.balanceBefore,
    data.balanceAfter === undefined ? '' : data.balanceAfter,
    data.health || ''
  ]);
}

function findConfigRow_(name) {
  const sheet = getSheetById_(V5.SHEETS.CONFIG);
  const lastRow = sheet.getLastRow();

  if (lastRow < 1) return null;

  const values = sheet.getRange(1, 1, lastRow, 1).getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === name) {
      return i + 1;
    }
  }

  return null;
}

function getConfigValue_(name) {
  const row = findConfigRow_(name);
  if (!row) return null;

  return getSheetById_(V5.SHEETS.CONFIG).getRange(row, 2).getValue();
}

function setConfigParam_(name, value, unit, note) {
  const sheet = getSheetById_(V5.SHEETS.CONFIG);
  let row = findConfigRow_(name);

  if (!row) {
    row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1).setValue(name);
  }

  sheet.getRange(row, 2).setValue(value);

  if (unit !== undefined) {
    sheet.getRange(row, 3).setValue(unit || '');
  }

  if (note !== undefined) {
    sheet.getRange(row, 4).setValue(note || '');
  }
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(V5.SPREADSHEET_ID);
}

function getSheetById_(sheetId) {
  const sheets = getSpreadsheet_().getSheets();

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === sheetId) {
      return sheets[i];
    }
  }

  throw new Error('Sheet ID לא נמצא: ' + sheetId);
}

function validateRequiredSheets_() {
  const required = [
    V5.SHEETS.DASHBOARD,
    V5.SHEETS.TRANSACTIONS,
    V5.SHEETS.BUDGET,
    V5.SHEETS.CONFIG,
    V5.SHEETS.SYNC_LOG,
    V5.SHEETS.VERIFICATION,
    V5.SHEETS.ANNUAL_CASHFLOW,
    V5.SHEETS.FIVE_YEAR_PLAN
  ];

  required.forEach(function(id) {
    getSheetById_(id);
  });
}

function setupTransactionHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);

  sheet.getRange(1, 1, 1, V5.TRANSACTION_HEADERS.length)
    .setValues([V5.TRANSACTION_HEADERS]);

  sheet.getRange(1, 21).setValue('מספר מופעים transactionId');
  sheet.getRange(1, 22).setValue('סטטוס כפילות');
}

function setupBudgetHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.BUDGET);

  sheet.getRange(1, 1, 1, V5.BUDGET_HEADERS.length)
    .setValues([V5.BUDGET_HEADERS]);
}

function formatSystemSheetsRTL_() {
  getSpreadsheet_().getSheets().forEach(function(sheet) {
    try {
      sheet.setRightToLeft(true);

      const rows = Math.max(sheet.getLastRow(), 1);
      const cols = Math.max(sheet.getLastColumn(), 1);

      sheet.getRange(1, 1, rows, cols).setHorizontalAlignment('right');
    } catch (e) {
      console.log('RTL warning: ' + sheet.getName() + ' | ' + e.message);
    }
  });
}

function getSyncMonths_() {
  const months = [];
  const today = new Date();

  for (let i = 0; i < V5.SAFETY_MONTHS; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(formatMonth_(d));
  }

  return months;
}

function formatMonth_(date) {
  return Utilities.formatDate(date, V5.TIMEZONE, 'yyyy-MM');
}

function isoToDate_(value) {
  if (!value) return '';
  if (value instanceof Date) return value;

  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d;
}

function sha256_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );

  return digest.map(function(byte) {
    const v = (byte + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function stableStringify_(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify_).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();

  return '{' + keys.map(function(key) {
    return JSON.stringify(key) + ':' + stableStringify_(obj[key]);
  }).join(',') + '}';
}

function installHourlyTriggerV5() {
  deleteV5Triggers();

  ScriptApp.newTrigger('syncRiseUpV5')
    .timeBased()
    .everyHours(1)
    .create();

  SpreadsheetApp.getUi().alert('✅ טריגר סנכרון שעתי הותקן.');
}

function deleteV5Triggers() {
  let deleted = 0;

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncRiseUpV5') {
      ScriptApp.deleteTrigger(trigger);
      deleted++;
    }
  });

  return deleted;
}

function columnToLetter_(column) {
  let letter = '';

  while (column > 0) {
    const temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }

  return letter;
}

function formatMoney_(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined ||
    isNaN(Number(value))
  ) {
    return 'לא ידוע';
  }

  return Number(value).toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ₪';
}

function showSyncToast_(metrics, health) {
  getSpreadsheet_().toast(
    'חדשות: ' + metrics.inserted +
    ' | עודכנו: ' + metrics.updated +
    ' | יתרה: ' + formatMoney_(metrics.balanceAfter) +
    ' | ' + (health.ok ? '🟢 תקין' : '🟡 בדיקה'),
    'RiseUp Sync ' + V5.VERSION,
    10
  );
}
