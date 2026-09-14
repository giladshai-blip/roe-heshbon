/**
 * ============================================================
 * רואה חשבון — Wix Sync Bridge V1.0
 * ============================================================
 * שכבת גישור חינמית בין מקור האמת ב-Google Sheets לבין Wix CMS.
 *
 * מטרות:
 * 1. לאפשר sync-on-open דרך Web App endpoint.
 * 2. להריץ RiseUp sync לפני פרסום snapshot ל-Wix.
 * 3. לשמור סודות רק ב-Script Properties — לעולם לא ב-GitHub.
 * 4. למנוע הצפה של סנכרונים בעזרת lock + throttle.
 *
 * התקנה חד-פעמית:
 * - להוסיף את הקובץ הזה לפרויקט Apps Script של "רואה חשבון - מערכת פיננסית".
 * - לשמור WIX_API_KEY ב-Script Properties באמצעות setWixApiKeyV1(apiKey).
 * - לפרוס את Apps Script כ-Web App (Execute as: Me; access לפי מדיניות הפרויקט).
 * - באתר Wix להפעיל את כתובת ה-Web App עם ?action=site-open בכל פתיחת האתר.
 */

const WIX_SYNC_V1 = {
  VERSION: '1.0.0',
  SITE_ID: '75bb6330-2c9a-44c7-9946-beb771e35558',
  THROTTLE_MINUTES: 5,
  COLLECTIONS: {
    OVERVIEW: 'FamilyOverview',
    DAILY: 'FamilyCashflowDaily',
    FUTURE_SUMMARY: 'FamilyFutureSummary',
    FUTURE_MONTHLY: 'FamilyFutureMonthly'
  }
};

function setWixApiKeyV1(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    throw new Error('Wix API Key חסר או קצר מדי.');
  }
  PropertiesService.getScriptProperties().setProperty('WIX_API_KEY', apiKey.trim());
  return { ok: true, stored: true };
}

function clearWixApiKeyV1() {
  PropertiesService.getScriptProperties().deleteProperty('WIX_API_KEY');
  return { ok: true, cleared: true };
}

function getWixApiKeyV1_() {
  const key = PropertiesService.getScriptProperties().getProperty('WIX_API_KEY');
  if (!key) throw new Error('WIX_API_KEY אינו מוגדר ב-Script Properties.');
  return key;
}

function doGet(e) {
  const action = e && e.parameter ? String(e.parameter.action || '') : '';
  if (action === 'site-open') {
    try {
      const result = syncWixOnOpenV1_();
      return jsonOutputV1_(result);
    } catch (err) {
      return jsonOutputV1_({
        ok: false,
        error: String(err && err.message ? err.message : err),
        at: new Date().toISOString()
      });
    }
  }
  return jsonOutputV1_({ ok: true, service: 'roe-heshbon-wix-sync', version: WIX_SYNC_V1.VERSION });
}

function doPost(e) {
  let body = {};
  try {
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
  } catch (_) {}

  if (body.action === 'site-open') {
    try {
      return jsonOutputV1_(syncWixOnOpenV1_());
    } catch (err) {
      return jsonOutputV1_({
        ok: false,
        error: String(err && err.message ? err.message : err),
        at: new Date().toISOString()
      });
    }
  }

  return jsonOutputV1_({ ok: false, error: 'UNKNOWN_ACTION' });
}

function syncWixOnOpenV1_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return { ok: true, skipped: true, reason: 'SYNC_ALREADY_RUNNING', at: new Date().toISOString() };
  }

  try {
    const props = PropertiesService.getScriptProperties();
    const lastRaw = props.getProperty('WIX_LAST_SITE_OPEN_SYNC_AT');
    const last = lastRaw ? new Date(lastRaw) : null;
    const now = new Date();
    const minAgeMs = WIX_SYNC_V1.THROTTLE_MINUTES * 60 * 1000;

    if (last && !isNaN(last.getTime()) && now.getTime() - last.getTime() < minAgeMs) {
      return {
        ok: true,
        skipped: true,
        reason: 'THROTTLED',
        lastSyncAt: last.toISOString(),
        at: now.toISOString()
      };
    }

    let riseupResult = null;
    if (typeof syncRiseUpV5 === 'function') {
      riseupResult = syncRiseUpV5();
    }

    const wixResult = syncWixSnapshotV1_();
    props.setProperty('WIX_LAST_SITE_OPEN_SYNC_AT', now.toISOString());

    return {
      ok: true,
      skipped: false,
      at: now.toISOString(),
      riseup: summarizeRiseupResultV1_(riseupResult),
      wix: wixResult
    };
  } finally {
    lock.releaseLock();
  }
}

function syncWixSnapshotV1_() {
  const snapshot = buildWixSnapshotV1_();

  const results = {
    overview: wixBulkSaveV1_(WIX_SYNC_V1.COLLECTIONS.OVERVIEW, [snapshot.overview]),
    daily: wixBulkSaveV1_(WIX_SYNC_V1.COLLECTIONS.DAILY, snapshot.daily),
    futureSummary: wixBulkSaveV1_(WIX_SYNC_V1.COLLECTIONS.FUTURE_SUMMARY, [snapshot.futureSummary]),
    futureMonthly: wixBulkSaveV1_(WIX_SYNC_V1.COLLECTIONS.FUTURE_MONTHLY, snapshot.futureMonthly)
  };

  return {
    snapshotDate: snapshot.snapshotDate,
    counts: {
      overview: 1,
      daily: snapshot.daily.length,
      futureSummary: 1,
      futureMonthly: snapshot.futureMonthly.length
    },
    results: results
  };
}

function buildWixSnapshotV1_() {
  const ss = SpreadsheetApp.openById(V56.SPREADSHEET_ID);
  const tz = V56.TIMEZONE || Session.getScriptTimeZone() || 'Asia/Jerusalem';
  const now = new Date();
  const snapshotDate = Utilities.formatDate(now, tz, 'yyyy-MM-dd');

  const cashflowRows = readTableV1_(ss.getSheetByName(V56.SHEET_NAMES.CASHFLOW));
  if (!cashflowRows.length) throw new Error('גיליון תזרים ריק.');

  const annualRows = readTableByHeaderSearchV1_(ss.getSheetByName(V56.SHEET_NAMES.ANNUAL_CASHFLOW), 'תאריך');

  const daily = cashflowRows.map(function(row, i) {
    const d = normalizeDateV1_(row['תאריך'], tz);
    return {
      id: d,
      data: {
        date: d,
        openingBalance: numV1_(row['יתרת פתיחה (₪)']),
        inflows: numV1_(row['כניסות עו״ש + מתוכננות (₪)']),
        outflows: numV1_(row['יציאות עו״ש + מתוכננות (₪)']),
        creditCard: numV1_(row['חיוב אשראי עתידי (₪)']),
        dailyNet: numV1_(row['נטו יומי (₪)']),
        closingBalance: numV1_(row['יתרת סגירה חזויה (₪)']),
        bufferTarget: numV1_(row['כרית יעד (₪)']),
        gapToBuffer: numV1_(row['פער מהכרית (₪)']),
        status: String(row['סטטוס'] || '')
      }
    };
  }).filter(function(item) { return !!item.id; });

  const current = daily[0];
  const monthEnd = daily[daily.length - 1];
  if (!current || !monthEnd) throw new Error('לא ניתן לחשב תמונת מצב מתזרים.');

  const annualDaily = annualRows.map(function(row) {
    const d = normalizeDateV1_(row['תאריך'], tz);
    return {
      date: d,
      openingBalance: numV1_(row['יתרת פתיחה']),
      salary: numV1_(row['משכורת']),
      benefit: numV1_(row['קצבה']),
      baseExpense: numV1_(row['הוצאה יומית בסיס']),
      oneTimeIncome: numV1_(row['הכנסה חד-פעמית']),
      oneTimeExpense: numV1_(row['הוצאה חד-פעמית']),
      dailyNet: numV1_(row['נטו יומי']),
      closingBalance: numV1_(row['יתרת סגירה']),
      status: String(row['סטטוס'] || ''),
      monthLabel: String(row['חודש'] || '')
    };
  }).filter(function(row) { return !!row.date; });

  const horizon = daily.map(function(x) {
    return { date: x.id, closingBalance: x.data.closingBalance };
  }).concat(annualDaily.slice(0, 31).map(function(x) {
    return { date: x.date, closingBalance: x.closingBalance };
  }));

  const lowest = horizon.reduce(function(best, row) {
    if (row.closingBalance === null || row.closingBalance === undefined) return best;
    if (!best || row.closingBalance < best.closingBalance) return row;
    return best;
  }, null);

  const nextPositive = annualDaily.find(function(row) {
    return row.closingBalance !== null && row.closingBalance >= 0;
  });

  const grouped = {};
  annualDaily.forEach(function(row) {
    const monthKey = row.date ? row.date.slice(0, 7) : '';
    if (!monthKey) return;
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(row);
  });

  const monthKeys = Object.keys(grouped).sort().slice(0, 12);
  const futureMonthly = monthKeys.map(function(monthKey) {
    const rows = grouped[monthKey];
    const lows = rows.map(function(r) { return r.closingBalance; }).filter(function(v) { return typeof v === 'number'; });
    const low = lows.length ? Math.min.apply(null, lows) : null;
    const end = rows.length ? rows[rows.length - 1].closingBalance : null;
    const label = rows.length ? rows[0].monthLabel : monthKey;
    return {
      id: monthKey,
      data: {
        month: monthKey + '-01',
        monthLabel: label,
        monthEndBalance: end,
        monthlyLow: low,
        status: end !== null && end >= 0 ? '🟡 חיובי' : '🔴 מינוס',
        source: 'רואה חשבון - מערכת פיננסית / גאנט תזרים שנתי'
      }
    };
  });

  const allAnnualBalances = annualDaily.map(function(r) { return r.closingBalance; }).filter(function(v) { return typeof v === 'number'; });
  const worstBalance = allAnnualBalances.length ? Math.min.apply(null, allAnnualBalances) : null;
  const worstRow = worstBalance === null ? null : annualDaily.find(function(r) { return r.closingBalance === worstBalance; });
  const end12 = futureMonthly.length ? futureMonthly[futureMonthly.length - 1].data.monthEndBalance : null;
  const firstPositiveMonth = futureMonthly.find(function(m) { return m.data.monthEndBalance !== null && m.data.monthEndBalance >= 0; });

  const overviewData = {
    snapshotDate: snapshotDate,
    currentBalance: current.data.closingBalance,
    monthEndBalance: monthEnd.data.closingBalance,
    lowestBalance: lowest ? lowest.closingBalance : null,
    lowestDate: lowest ? lowest.date : null,
    nextPositiveDate: nextPositive ? nextPositive.date : null,
    bufferTarget: current.data.bufferTarget,
    status: current.data.closingBalance < 0 ? '🔴 תזרים שלילי' : '🟡 תזרים חיובי',
    message: buildOverviewMessageV1_(current.data.closingBalance, monthEnd.data.closingBalance, lowest),
    source: 'רואה חשבון - מערכת פיננסית / תזרים + גאנט תזרים שנתי'
  };

  const futureSummaryData = {
    snapshotDate: snapshotDate,
    openingBalance: monthEnd.data.closingBalance,
    endOf12Months: end12,
    worstBalance: worstBalance,
    worstMonth: worstRow ? (worstRow.monthLabel || worstRow.date.slice(0, 7)) : '',
    exitWithin12Months: !!firstPositiveMonth,
    turningPoint: firstPositiveMonth ? ('סוף חודש חיובי ראשון צפוי ב-' + firstPositiveMonth.data.monthLabel) : 'לא צפויה יציאה יציבה מהמינוס בתוך 12 חודשים',
    message: buildFutureMessageV1_(worstBalance, worstRow, end12, firstPositiveMonth),
    source: 'רואה חשבון - מערכת פיננסית / גאנט תזרים שנתי'
  };

  return {
    snapshotDate: snapshotDate,
    overview: { id: 'current', data: overviewData },
    daily: daily,
    futureSummary: { id: 'baseline-current', data: futureSummaryData },
    futureMonthly: futureMonthly
  };
}

function readTableV1_(sheet) {
  if (!sheet) throw new Error('גיליון נדרש לא נמצא.');
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function(v) { return String(v || '').trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(v) { return v !== '' && v !== null; });
  }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function readTableByHeaderSearchV1_(sheet, firstHeader) {
  if (!sheet) throw new Error('גיליון שנתי לא נמצא.');
  const values = sheet.getDataRange().getValues();
  let headerIndex = -1;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === firstHeader) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) throw new Error('שורת כותרת לא נמצאה בגאנט השנתי.');
  const headers = values[headerIndex].map(function(v) { return String(v || '').trim(); });
  return values.slice(headerIndex + 1).filter(function(row) {
    return row[0] !== '' && row[0] !== null;
  }).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function normalizeDateV1_(value, tz) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  if (typeof value === 'number') {
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
  }
  return '';
}

function numV1_(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''));
    return isFinite(n) ? n : null;
  }
  return null;
}

function buildOverviewMessageV1_(currentBalance, monthEndBalance, lowest) {
  const parts = [];
  if (typeof currentBalance === 'number') parts.push('היתרה המחושבת היא ' + formatMoneyPlainV1_(currentBalance));
  if (typeof monthEndBalance === 'number') parts.push('סוף החודש צפוי להיות ' + formatMoneyPlainV1_(monthEndBalance));
  if (lowest && typeof lowest.closingBalance === 'number') parts.push('נקודת השפל החזויה היא ' + formatMoneyPlainV1_(lowest.closingBalance) + ' בתאריך ' + lowest.date);
  return parts.join('. ') + (parts.length ? '.' : '');
}

function buildFutureMessageV1_(worstBalance, worstRow, end12, firstPositiveMonth) {
  const parts = [];
  if (typeof worstBalance === 'number') parts.push('השפל במודל השנתי הוא ' + formatMoneyPlainV1_(worstBalance) + (worstRow ? ' סביב ' + (worstRow.monthLabel || worstRow.date) : ''));
  if (firstPositiveMonth) parts.push('סוף חודש חיובי ראשון צפוי ב-' + firstPositiveMonth.data.monthLabel);
  if (typeof end12 === 'number') parts.push('בסוף 12 חודשים התחזית היא ' + formatMoneyPlainV1_(end12));
  return parts.join('. ') + (parts.length ? '.' : '');
}

function formatMoneyPlainV1_(value) {
  return Math.round(value).toLocaleString('he-IL') + ' ₪';
}

function wixBulkSaveV1_(collectionId, dataItems) {
  if (!dataItems || !dataItems.length) return { ok: true, skipped: true, count: 0 };
  const key = getWixApiKeyV1_();
  const url = 'https://www.wixapis.com/wix-data/v2/bulk/items/save';
  const payload = {
    dataCollectionId: collectionId,
    dataItems: dataItems,
    returnEntity: false
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: key,
      'wix-site-id': WIX_SYNC_V1.SITE_ID
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Wix CMS sync failed [' + collectionId + '] HTTP ' + code + ': ' + text.slice(0, 500));
  }
  return { ok: true, count: dataItems.length, status: code };
}

function summarizeRiseupResultV1_(result) {
  if (!result) return { status: 'NO_RESULT' };
  const m = result.metrics || {};
  return {
    success: result.success !== false,
    inserted: m.inserted || 0,
    updated: m.updated || 0,
    unchanged: m.unchanged || 0,
    duplicates: m.duplicates || 0,
    balanceAfter: m.balanceAfter === undefined ? null : m.balanceAfter
  };
}

function jsonOutputV1_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
