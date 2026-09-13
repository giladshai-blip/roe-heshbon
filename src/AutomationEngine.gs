/**
 * ============================================================
 * רואה חשבון — Automation Engine V1.0.1
 * ============================================================
 * שכבת אוטומציה שמרנית מעל Core V5.6.3.
 *
 * V1.0.1:
 * - מקור אמת יחיד למסגרת עו״ש: הגדרות > "מסגרת עו״ש מאומתת".
 * - Migration חד-פעמי למסגרת המאומתת 27,300 ₪ אם הפרמטר עדיין חסר.
 * - Cashflow Guard מתריע במפורש אם מקור המסגרת חסר/לא תקין.
 * - שמירת עקרונות Match → Update → Create ומניעת ספירה כפולה.
 * ============================================================
 */

const AUTOMATION_ENGINE = {
  VERSION: 'V1.0.1',
  TIMEZONE: 'Asia/Jerusalem',
  VERIFIED_CHECKING_FRAME_PARAM: 'מסגרת עו״ש מאומתת',
  VERIFIED_CHECKING_FRAME_MIGRATION_VALUE: 27300,
  SHEETS: {
    PLANNED: 'תזרים מתוכנן',
    TRANSACTIONS: 'תנועות',
    CASHFLOW: 'תזרים',
    CONFIG: 'הגדרות',
    SYNC_LOG: 'יומן סנכרון',
    ALERTS: 'התראות מערכת',
    AUTOMATION_LOG: 'יומן אוטומציות'
  },
  MATCH_WINDOW_DAYS: 3,
  MATCH_AMOUNT_TOLERANCE: 1,
  LOW_MARGIN_WARNING: 3000,
  LOW_MARGIN_CRITICAL: 1500,
  LARGE_UPCOMING_DEBIT: 5000,
  OFFICIAL_API_MAX_AGE_HOURS: 48
};

/**
 * התקנה/שדרוג V1.0.1.
 * מבצע migration למסגרת העו״ש רק אם הפרמטר עדיין לא קיים.
 */
function setupAutomationEngineV101() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('המערכת בשימוש. נסה שוב בעוד מספר שניות.');
  try {
    aeEnsureSupportSheets_();
    aeEnsureVerifiedCheckingFrameConfig_();
    installAutomationEngineTriggersV1();
    const result = runAutomationEngineV1();
    aeAppendAutomationLog_('SETUP', 'SUCCESS', 'Automation Engine ' + AUTOMATION_ENGINE.VERSION + ' הותקן ונבדק', result);
    return result;
  } finally {
    lock.releaseLock();
  }
}

// תאימות לאחור — התקנה ישנה מפנה לגרסה העדכנית.
function setupAutomationEngineV1() {
  return setupAutomationEngineV101();
}

function installAutomationEngineTriggersV1() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runAutomationEngineV1') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('runAutomationEngineV1').timeBased().everyHours(1).create();
  return true;
}

function deleteAutomationEngineTriggersV1() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'runAutomationEngineV1') ScriptApp.deleteTrigger(trigger);
  });
}

function runAutomationEngineV1() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {status: 'SKIPPED', reason: 'LOCKED'};

  const result = {
    version: AUTOMATION_ENGINE.VERSION,
    startedAt: new Date(),
    reconciliation: null,
    cashflow: null,
    health: null,
    status: 'SUCCESS'
  };

  try {
    aeEnsureSupportSheets_();
    result.reconciliation = aeReconcilePlannedOneOffs_();
    SpreadsheetApp.flush();
    result.cashflow = aeCashflowGuard_();
    result.health = aeFinancialHealthGuard_();

    if ((result.cashflow && result.cashflow.critical) || (result.health && result.health.critical)) {
      result.status = 'WARNING';
    }

    aeAppendAutomationLog_('RUN', result.status, aeBuildRunSummary_(result), result);
    return result;
  } catch (err) {
    result.status = 'ERROR';
    result.error = String(err && err.message ? err.message : err);
    try {
      aeUpsertAlert_('engine_error', '🔴', 'מערכת', 'שגיאת Automation Engine', result.error, '', new Date());
      aeAppendAutomationLog_('RUN', 'ERROR', result.error, result);
    } catch (ignored) {}
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function aeEnsureVerifiedCheckingFrameConfig_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUTOMATION_ENGINE.SHEETS.CONFIG);
  if (!sheet) throw new Error('חסר גיליון הגדרות.');

  const values = sheet.getDataRange().getValues();
  const wanted = aeNormalizeText_(AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_PARAM);
  for (let i = 0; i < values.length; i++) {
    if (aeNormalizeText_(values[i][0]) === wanted) {
      const existing = aeNumber_(values[i][1]);
      if (!isFinite(existing) || existing <= 0) {
        throw new Error('הפרמטר "' + AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_PARAM + '" קיים אך הערך שלו אינו תקין.');
      }
      return existing;
    }
  }

  // Migration חד-פעמי מנתון שאומת לפני V1.0.1.
  const row = Math.max(sheet.getLastRow() + 1, 4);
  sheet.getRange(row, 1, 1, 4).setValues([[
    AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_PARAM,
    AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_MIGRATION_VALUE,
    '₪',
    'מאומת בשיחה 13/09/2026; נזרע אוטומטית ב-migration של Automation Engine V1.0.1'
  ]]);
  SpreadsheetApp.flush();
  return AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_MIGRATION_VALUE;
}

/**
 * התאמה שמרנית של תכנון חד-פעמי מול תנועות עו״ש.
 * אין התאמה אוטומטית לתכנון חודשי או להעברה פנימית.
 */
function aeReconcilePlannedOneOffs_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const plannedSheet = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.PLANNED);
  const txSheet = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.TRANSACTIONS);
  if (!plannedSheet || !txSheet) throw new Error('חסרים גיליונות תזרים מתוכנן או תנועות.');

  const plannedValues = plannedSheet.getDataRange().getValues();
  const txValues = txSheet.getDataRange().getValues();
  if (plannedValues.length < 2 || txValues.length < 2) return {matched: 0, review: 0, scanned: 0};

  const txHeaders = aeHeaderMap_(txValues[0]);
  ['transactionDate','businessName','amount','direction','sourceType'].forEach(function(h) {
    if (txHeaders[h] == null) throw new Error('חסרה עמודה בתנועות: ' + h);
  });

  const txs = [];
  for (let i = 1; i < txValues.length; i++) {
    const row = txValues[i];
    if (String(row[txHeaders.sourceType] || '') !== 'checkingAccount') continue;
    const date = aeDate_(row[txHeaders.transactionDate]);
    const amount = aeNumber_(row[txHeaders.amount]);
    if (!date || !isFinite(amount)) continue;
    txs.push({
      row: i + 1,
      date: date,
      amount: Math.abs(amount),
      direction: String(row[txHeaders.direction] || '').trim(),
      business: String(row[txHeaders.businessName] || '').trim()
    });
  }

  let matched = 0, review = 0, scanned = 0;
  const updates = [];

  for (let r = 1; r < plannedValues.length; r++) {
    const row = plannedValues[r];
    const date = aeDate_(row[0]);
    const type = String(row[1] || '').trim();
    const description = String(row[2] || '').trim();
    const amount = Math.abs(aeNumber_(row[3]));
    const frequency = String(row[5] || '').trim();
    const status = String(row[11] || '').trim();
    const includedEffective = aeNumber_(row[12]);

    if (!date || !isFinite(amount) || amount <= 0) continue;
    if (frequency === 'חודשי') continue;
    if (type === 'העברה פנימית') continue;
    if (/בוצע|מאומת/.test(status)) continue;
    if (includedEffective !== 1) continue;
    if (['הוצאה','הכנסה','זיכוי'].indexOf(type) === -1) continue;

    scanned++;
    const expectedDirection = type === 'הוצאה' ? 'הוצאה' : 'הכנסה';
    const candidates = txs.filter(function(tx) {
      return tx.direction === expectedDirection &&
        Math.abs(tx.amount - amount) <= AUTOMATION_ENGINE.MATCH_AMOUNT_TOLERANCE &&
        Math.abs(aeDaysBetween_(date, tx.date)) <= AUTOMATION_ENGINE.MATCH_WINDOW_DAYS;
    });

    if (!candidates.length) continue;

    const scored = candidates.map(function(tx) {
      const exactDate = aeDaysBetween_(date, tx.date) === 0 ? 2 : 0;
      return {tx: tx, score: exactDate + aeTextOverlapScore_(description, tx.business)};
    }).sort(function(a,b) { return b.score - a.score; });

    const best = scored[0];
    const uniqueBest = scored.length === 1 || best.score > scored[1].score;
    const highConfidence = uniqueBest && (best.score >= 2 || (candidates.length === 1 && aeDaysBetween_(date, best.tx.date) === 0));

    if (highConfidence) {
      const oldNote = String(row[9] || '').trim();
      const audit = 'התאמה אוטומטית ' + aeFormatDate_(new Date()) + ': תנועה בפועל ' + aeFormatDate_(best.tx.date) + ' | ' + best.tx.business + ' | ' + aeMoney_(best.tx.amount) + '.';
      updates.push({
        row: r + 1,
        matchCount: candidates.length,
        note: oldNote ? oldNote + '\n' + audit : audit,
        status: '✅ בוצע — מאומת אוטומטית',
        includedEffective: 0
      });
      matched++;
      aeResolveAlert_('reconcile_review_row_' + (r + 1));
    } else {
      review++;
      aeUpsertAlert_(
        'reconcile_review_row_' + (r + 1), '🟡', 'התאמות', 'נדרשת בדיקת התאמה לתכנון',
        description + ' | ' + aeMoney_(amount) + ' | נמצאו ' + candidates.length + ' מועמדים בעו״ש.', amount, date
      );
    }
  }

  updates.forEach(function(u) {
    plannedSheet.getRange(u.row, 10).setValue(u.note);
    plannedSheet.getRange(u.row, 11).setValue(u.matchCount);
    plannedSheet.getRange(u.row, 12).setValue(u.status);
    plannedSheet.getRange(u.row, 13).setValue(u.includedEffective);
  });

  return {matched: matched, review: review, scanned: scanned};
}

function aeCashflowGuard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.CASHFLOW);
  if (!sheet) throw new Error('חסר גיליון תזרים.');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return {critical: false, rows: 0};

  const today = aeStartOfDay_(new Date());
  let minBalance = Infinity, minDate = null;
  let nextLargeDebit = 0, nextLargeDebitDate = null;
  let currentOrFirstBalance = null;

  for (let i = 1; i < values.length; i++) {
    const date = aeDate_(values[i][0]);
    if (!date) continue;
    const closing = aeNumber_(values[i][6]);
    const plannedOut = aeNumber_(values[i][3]);
    const cardOut = aeNumber_(values[i][4]);
    const dailyOut = Math.max(0, plannedOut) + Math.max(0, cardOut);

    if (date >= today && isFinite(closing)) {
      if (currentOrFirstBalance == null) currentOrFirstBalance = closing;
      if (closing < minBalance) { minBalance = closing; minDate = date; }
      if (dailyOut >= AUTOMATION_ENGINE.LARGE_UPCOMING_DEBIT && (nextLargeDebitDate == null || date < nextLargeDebitDate)) {
        nextLargeDebit = dailyOut;
        nextLargeDebitDate = date;
      }
    }
  }

  if (!isFinite(minBalance)) return {critical: false, rows: values.length - 1};

  const frame = aeFindConfigNumber_([AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_PARAM]);
  const remaining = frame > 0 ? frame + minBalance : null;
  let critical = false;

  if (!(frame > 0)) {
    critical = true;
    aeUpsertAlert_(
      'checking_frame_missing', '🔴', 'תזרים', 'מסגרת עו״ש מאומתת חסרה',
      'לא ניתן לחשב מרווח מסגרת עד שיוגדר בהגדרות הפרמטר "' + AUTOMATION_ENGINE.VERIFIED_CHECKING_FRAME_PARAM + '".', '', new Date()
    );
    aeResolveAlert_('cashflow_low_margin');
  } else {
    aeResolveAlert_('checking_frame_missing');
    if (remaining < AUTOMATION_ENGINE.LOW_MARGIN_CRITICAL) {
      critical = true;
      aeUpsertAlert_('cashflow_low_margin', '🔴', 'תזרים', 'מרווח מסגרת עו״ש נמוך מאוד', 'השפל החזוי הוא ' + aeMoney_(minBalance) + ' ב-' + aeFormatDate_(minDate) + ', ונשאר מרווח של ' + aeMoney_(remaining) + ' בלבד.', remaining, minDate);
    } else if (remaining < AUTOMATION_ENGINE.LOW_MARGIN_WARNING) {
      aeUpsertAlert_('cashflow_low_margin', '🟡', 'תזרים', 'מרווח מסגרת עו״ש נמוך', 'השפל החזוי הוא ' + aeMoney_(minBalance) + ' ב-' + aeFormatDate_(minDate) + ', ונשאר מרווח של ' + aeMoney_(remaining) + '.', remaining, minDate);
    } else {
      aeResolveAlert_('cashflow_low_margin');
    }
  }

  if (nextLargeDebitDate) {
    aeUpsertAlert_('cashflow_next_large_debit', '🟡', 'תזרים', 'חיוב גדול קרוב', 'צפויה יציאה של כ-' + aeMoney_(nextLargeDebit) + ' ב-' + aeFormatDate_(nextLargeDebitDate) + '.', nextLargeDebit, nextLargeDebitDate);
  } else {
    aeResolveAlert_('cashflow_next_large_debit');
  }

  return {
    critical: critical,
    minBalance: minBalance,
    minDate: minDate,
    checkingFrame: frame || null,
    remainingFrameAtLow: remaining,
    nextLargeDebit: nextLargeDebit,
    nextLargeDebitDate: nextLargeDebitDate,
    currentOrFirstBalance: currentOrFirstBalance
  };
}

function aeFinancialHealthGuard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const log = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.SYNC_LOG);
  let critical = false;
  const result = {critical: false, sync: null, officialApi: null};

  if (!log || log.getLastRow() < 2) {
    aeUpsertAlert_('sync_log_missing', '🔴', 'מערכת', 'אין יומן סנכרון תקין', 'לא ניתן לאמת את מצב הסנכרון.', '', new Date());
    return {critical: true, sync: 'MISSING', officialApi: 'UNKNOWN'};
  }

  const values = log.getDataRange().getValues();
  const headers = aeHeaderMap_(values[0]);
  const timeCol = headers['זמן'];
  const actionCol = headers['פעולה'];
  const statusCol = headers['סטטוס'];
  const healthCol = headers['Health Check'];

  let latestSync = null;
  let latestOfficial = null;

  for (let i = 1; i < values.length; i++) {
    const action = String(values[i][actionCol] || '');
    const time = aeDateTime_(values[i][timeCol]);
    if (!time) continue;
    const item = {
      time: time,
      action: action,
      status: String(values[i][statusCol] || ''),
      health: healthCol == null ? '' : String(values[i][healthCol] || '')
    };
    if (/RiseUp Sync/.test(action) && (!latestSync || time > latestSync.time)) latestSync = item;
    if (/Official APIs/.test(action) && (!latestOfficial || time > latestOfficial.time)) latestOfficial = item;
  }

  if (!latestSync) {
    critical = true;
    aeUpsertAlert_('riseup_sync_health', '🔴', 'סנכרון', 'לא נמצא סנכרון RiseUp', 'לא נמצאה רשומת סנכרון RiseUp ביומן.', '', new Date());
  } else if (latestSync.status === 'ERROR' || /🔴|תקלות/.test(latestSync.health)) {
    critical = true;
    aeUpsertAlert_('riseup_sync_health', '🔴', 'סנכרון', 'סנכרון/Health Check דורש טיפול', latestSync.action + ' | ' + latestSync.status + ' | ' + latestSync.health, '', latestSync.time);
  } else {
    aeResolveAlert_('riseup_sync_health');
  }

  const now = new Date();
  if (!latestOfficial) {
    aeUpsertAlert_('official_api_health', '🟡', 'מקורות רשמיים', 'לא נמצא רענון מקורות רשמיים', 'אין רשומת Official APIs ביומן הסנכרון.', '', now);
  } else {
    const ageHours = (now.getTime() - latestOfficial.time.getTime()) / 3600000;
    if (latestOfficial.status !== 'SUCCESS' || ageHours > AUTOMATION_ENGINE.OFFICIAL_API_MAX_AGE_HOURS) {
      aeUpsertAlert_('official_api_health', '🟡', 'מקורות רשמיים', 'מקורות רשמיים דורשים רענון', 'רענון אחרון: ' + aeFormatDateTime_(latestOfficial.time) + ' | סטטוס: ' + latestOfficial.status + ' | גיל: ' + Math.floor(ageHours) + ' שעות.', ageHours, latestOfficial.time);
    } else {
      aeResolveAlert_('official_api_health');
    }
  }

  result.critical = critical;
  result.sync = latestSync;
  result.officialApi = latestOfficial;
  return result;
}

function aeEnsureSupportSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let alerts = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.ALERTS);
  if (!alerts) alerts = ss.insertSheet(AUTOMATION_ENGINE.SHEETS.ALERTS);
  if (alerts.getLastRow() === 0) {
    alerts.getRange(1,1,1,10).setValues([['זמן יצירה','מפתח','חומרה','קטגוריה','כותרת','פירוט','ערך','תאריך רלוונטי','סטטוס','נראה לאחרונה']]);
    alerts.setFrozenRows(1);
  }

  let log = ss.getSheetByName(AUTOMATION_ENGINE.SHEETS.AUTOMATION_LOG);
  if (!log) log = ss.insertSheet(AUTOMATION_ENGINE.SHEETS.AUTOMATION_LOG);
  if (log.getLastRow() === 0) {
    log.getRange(1,1,1,6).setValues([['זמן','פעולה','סטטוס','הודעה','גרסה','JSON תוצאה']]);
    log.setFrozenRows(1);
  }
}

function aeUpsertAlert_(key, severity, category, title, message, value, relevantDate) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUTOMATION_ENGINE.SHEETS.ALERTS);
  if (!sheet) return;
  const now = new Date();
  const values = sheet.getDataRange().getValues();
  let row = 0;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === key) { row = i + 1; break; }
  }
  const record = [now,key,severity,category,title,message,value || '',relevantDate || '', 'פתוח', now];
  if (row) sheet.getRange(row,1,1,10).setValues([record]);
  else sheet.appendRow(record);
}

function aeResolveAlert_(key) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUTOMATION_ENGINE.SHEETS.ALERTS);
  if (!sheet || sheet.getLastRow() < 2) return;
  const values = sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][1]) === key && String(values[i][8]) !== 'נפתר') {
      sheet.getRange(i + 2,9).setValue('נפתר');
      sheet.getRange(i + 2,10).setValue(new Date());
      return;
    }
  }
}

function aeAppendAutomationLog_(action, status, message, result) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUTOMATION_ENGINE.SHEETS.AUTOMATION_LOG);
  if (!sheet) return;
  let json = '';
  try { json = JSON.stringify(result || {}); } catch (e) { json = ''; }
  if (json.length > 45000) json = json.slice(0,45000);
  sheet.appendRow([new Date(),action,status,message,AUTOMATION_ENGINE.VERSION,json]);
}

function aeBuildRunSummary_(result) {
  const r = result.reconciliation || {};
  const c = result.cashflow || {};
  return 'התאמות: ' + (r.matched || 0) + ' | לבדיקה: ' + (r.review || 0) +
    ' | שפל תזרים: ' + (isFinite(c.minBalance) ? aeMoney_(c.minBalance) : 'לא זמין') +
    ' | מסגרת: ' + (c.checkingFrame ? aeMoney_(c.checkingFrame) : 'חסרה') +
    ' | מרווח בשפל: ' + (isFinite(c.remainingFrameAtLow) ? aeMoney_(c.remainingFrameAtLow) : 'לא זמין') +
    ' | סטטוס: ' + result.status;
}

function aeFindConfigNumber_(labels) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AUTOMATION_ENGINE.SHEETS.CONFIG);
  if (!sheet) return 0;
  const values = sheet.getDataRange().getValues();
  const wanted = labels.map(aeNormalizeText_);
  for (let i = 0; i < values.length; i++) {
    const label = aeNormalizeText_(values[i][0]);
    if (wanted.indexOf(label) !== -1) {
      const n = aeNumber_(values[i][1]);
      return isFinite(n) ? n : 0;
    }
  }
  return 0;
}

function aeHeaderMap_(headers) {
  const map = {};
  headers.forEach(function(h, i) { map[String(h || '').trim()] = i; });
  return map;
}

function aeTextOverlapScore_(a, b) {
  const stop = {של:1,את:1,עם:1,על:1,ב:1,ל:1,ו:1,הוצאה:1,הכנסה:1,תשלום:1,חיוב:1};
  const ta = aeNormalizeText_(a).split(' ').filter(function(t){return t.length > 2 && !stop[t];});
  const tb = aeNormalizeText_(b).split(' ').filter(function(t){return t.length > 2 && !stop[t];});
  let score = 0;
  ta.forEach(function(t){ if (tb.indexOf(t) !== -1) score++; });
  return Math.min(score, 3);
}

function aeNormalizeText_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[״"׳']/g,'')
    .replace(/[^0-9a-zא-ת]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function aeNumber_(value) {
  if (typeof value === 'number') return value;
  if (value == null || value === '') return NaN;
  const n = Number(String(value).replace(/[^0-9.\-]/g,''));
  return isFinite(n) ? n : NaN;
}

function aeDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return aeStartOfDay_(value);
  if (value == null || value === '') return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : aeStartOfDay_(d);
}

function aeDateTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), Number(m[4]||0), Number(m[5]||0), Number(m[6]||0));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function aeStartOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function aeDaysBetween_(a,b) { return Math.round((aeStartOfDay_(b).getTime() - aeStartOfDay_(a).getTime()) / 86400000); }
function aeFormatDate_(d) { return Utilities.formatDate(d, AUTOMATION_ENGINE.TIMEZONE, 'dd/MM/yyyy'); }
function aeFormatDateTime_(d) { return Utilities.formatDate(d, AUTOMATION_ENGINE.TIMEZONE, 'dd/MM/yyyy HH:mm'); }
function aeMoney_(n) { return Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ₪'; }
