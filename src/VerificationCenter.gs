/**
 * ============================================================
 * רואה חשבון — Verification Center V1.0
 * ============================================================
 * מרכז אימות אינטואיטיבי מעל גיליון "אימות נתונים".
 *
 * עקרונות:
 * - לא מוחק שורות ולא משנה נתון פיננסי מקור.
 * - מעדכן רק שדות תפעוליים של תהליך האימות.
 * - סגירה אוטומטית שמרנית: רק כאשר הסטטוס מאומת ואין מידע חסר.
 * - כל פתיחת המרכז מרעננת סטטוסים.
 * - טריגר רענון כל 3 שעות ניתן להתקנה דרך installVerificationCenterV1().
 * - נשמרת תאימות לגיליון הקיים באמצעות זיהוי כותרות לפי שם.
 * ============================================================
 */

const VERIFICATION_CENTER_V1 = {
  VERSION: 'V1.0',
  SHEET_NAME: 'אימות נתונים',
  MENU_NAME: '✅ מרכז אימות',
  OPEN_HANDLER: 'verificationCenterOnOpenV1',
  REFRESH_HANDLER: 'refreshVerificationCenterV1',
  AUTO_REFRESH_HOURS: 3,
  REQUIRED_HEADERS: [
    'נושא',
    'סטטוס',
    'החלטה תפעולית',
    'מה חסר לאימות',
    'מצב טיפול'
  ],
  OPTIONAL_HEADERS: [
    'הערת טיפול',
    'עודכן לאחרונה'
  ]
};

function installVerificationCenterV1() {
  const ss = vcSpreadsheet_();
  const sheet = vcSheet_(ss);
  vcEnsureHeaders_(sheet);
  vcNormalizeRows_(sheet, true);
  vcInstallTriggers_();
  verificationCenterOnOpenV1();
  SpreadsheetApp.flush();
  ss.toast('מרכז האימות V1 הותקן', 'רואה חשבון', 6);
  return getVerificationCenterDataV1('open');
}

function verificationCenterOnOpenV1() {
  SpreadsheetApp.getUi()
    .createMenu(VERIFICATION_CENTER_V1.MENU_NAME)
    .addItem('📋 פתח מרכז אימות', 'openVerificationCenterV1')
    .addItem('🔄 רענן סטטוסים', 'refreshVerificationCenterV1')
    .addSeparator()
    .addItem('⚙️ התקן / תקן טריגרים', 'installVerificationCenterV1')
    .addToUi();
}

function openVerificationCenterV1() {
  refreshVerificationCenterV1();
  const html = HtmlService.createHtmlOutputFromFile('VerificationCenter')
    .setTitle('מרכז אימות נתונים');
  SpreadsheetApp.getUi().showSidebar(html);
}

function refreshVerificationCenterV1() {
  const ss = vcSpreadsheet_();
  const sheet = vcSheet_(ss);
  vcEnsureHeaders_(sheet);
  const result = vcNormalizeRows_(sheet, true);
  SpreadsheetApp.flush();
  return result;
}

function getVerificationCenterDataV1(filter) {
  const ss = vcSpreadsheet_();
  const sheet = vcSheet_(ss);
  vcEnsureHeaders_(sheet);
  vcNormalizeRows_(sheet, true);

  const map = vcHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues() : [];
  const items = [];

  rows.forEach(function(row, index) {
    const topic = vcCell_(row, map, 'נושא');
    if (!topic) return;
    const item = vcBuildItem_(row, index + 2, map);
    if (!filter || filter === 'all' || vcFilterMatch_(item, filter)) items.push(item);
  });

  const counts = {open:0, waiting:0, refresh:0, done:0, wrong:0, later:0, total:0};
  rows.forEach(function(row, index) {
    if (!vcCell_(row, map, 'נושא')) return;
    const item = vcBuildItem_(row, index + 2, map);
    counts.total++;
    if (item.bucket === 'open') counts.open++;
    else if (item.bucket === 'waiting') counts.waiting++;
    else if (item.bucket === 'refresh') counts.refresh++;
    else if (item.bucket === 'done') counts.done++;
    else if (item.bucket === 'wrong') counts.wrong++;
    else if (item.bucket === 'later') counts.later++;
  });

  return {
    version: VERIFICATION_CENTER_V1.VERSION,
    filter: filter || 'open',
    counts: counts,
    items: items,
    refreshedAt: Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm')
  };
}

function verificationCenterActionV1(rowNumber, action, note) {
  const ss = vcSpreadsheet_();
  const sheet = vcSheet_(ss);
  vcEnsureHeaders_(sheet);
  const map = vcHeaderMap_(sheet);
  const row = Number(rowNumber);
  if (!Number.isInteger(row) || row < 2 || row > sheet.getLastRow()) {
    throw new Error('שורת אימות לא תקינה.');
  }

  const actionMap = {
    verified: 'נסגר ידנית',
    missing_document: 'ממתין למסמך',
    later: 'בדיקה מאוחר יותר',
    wrong: 'נתון שגוי — דורש תיקון',
    refresh: 'דורש רענון',
    reopen: 'פתוח'
  };
  if (!actionMap[action]) throw new Error('פעולת אימות לא מוכרת.');

  sheet.getRange(row, map['מצב טיפול']).setValue(actionMap[action]);
  if (map['הערת טיפול']) {
    sheet.getRange(row, map['הערת טיפול']).setValue(String(note || '').trim());
  }
  if (map['עודכן לאחרונה']) {
    sheet.getRange(row, map['עודכן לאחרונה'])
      .setValue(new Date())
      .setNumberFormat('dd/mm/yyyy hh:mm');
  }

  SpreadsheetApp.flush();
  return getVerificationCenterDataV1('all');
}

function vcNormalizeRows_(sheet, writeChanges) {
  const map = vcHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return {updated:0, total:0};
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
  const treatmentCol = map['מצב טיפול'];
  const noteCol = map['הערת טיפול'];
  const updatedCol = map['עודכן לאחרונה'];
  const writes = [];

  values.forEach(function(row, index) {
    const topic = vcCell_(row, map, 'נושא');
    if (!topic) return;
    const current = vcCell_(row, map, 'מצב טיפול');
    const next = vcSuggestedTreatment_(row, map, current);
    if (next && next !== current) {
      writes.push({row:index + 2, value:next});
    }
  });

  if (writeChanges) {
    writes.forEach(function(w) {
      sheet.getRange(w.row, treatmentCol).setValue(w.value);
      if (updatedCol) {
        sheet.getRange(w.row, updatedCol).setValue(new Date()).setNumberFormat('dd/mm/yyyy hh:mm');
      }
      if (noteCol && w.value === 'נסגר אוטומטית' && !sheet.getRange(w.row, noteCol).getValue()) {
        sheet.getRange(w.row, noteCol).setValue('נסגר אוטומטית: הנתון מסומן מאומת ולא חסר מידע נוסף.');
      }
    });
  }

  return {updated:writes.length, total:values.length};
}

function vcSuggestedTreatment_(row, map, current) {
  const status = vcCell_(row, map, 'סטטוס');
  const missing = vcCell_(row, map, 'מה חסר לאימות');
  const c = String(current || '').trim();

  // בחירה ידנית תמיד גוברת על אוטומציה, למעט שגיאת נוסחה.
  if (c && c !== '#REF!' && !/^#(?:N\/A|VALUE!|NAME\?|ERROR!)/i.test(c)) return c;

  const clearlyVerified = /מאומת|אושר|מוצה/.test(status) && !/חלקית|דורש|טרם|פער|חסר|לא אומת/.test(status);
  const nothingMissing = !missing || /^אין(?:\s|\b|—|-)/.test(missing);
  if (clearlyVerified && nothingMissing) return 'נסגר אוטומטית';

  if (/דורש רענון/.test(status) || /דורש רענון/.test(missing)) return 'דורש רענון';
  if (/מסמך|דוח|אישור|חשבונית|צילום|יתרה עדכנית|מועד קליטה|תאריך חיוב|שם הגוף/.test(missing)) return 'ממתין למסמך';
  return 'פתוח';
}

function vcBuildItem_(row, rowNumber, map) {
  const treatment = vcCell_(row, map, 'מצב טיפול');
  const bucket = vcBucket_(treatment);
  return {
    row: rowNumber,
    topic: vcCell_(row, map, 'נושא'),
    dataA: vcCell_(row, map, 'נתון A'),
    sourceA: vcCell_(row, map, 'מקור A'),
    dataB: vcCell_(row, map, 'נתון B'),
    sourceB: vcCell_(row, map, 'מקור B'),
    status: vcCell_(row, map, 'סטטוס'),
    decision: vcCell_(row, map, 'החלטה תפעולית'),
    missing: vcCell_(row, map, 'מה חסר לאימות'),
    treatment: treatment || 'פתוח',
    note: vcCell_(row, map, 'הערת טיפול'),
    updatedAt: vcCell_(row, map, 'עודכן לאחרונה'),
    bucket: bucket
  };
}

function vcBucket_(treatment) {
  const t = String(treatment || '').trim();
  if (/נסגר|הושלם|מאומת ידנית|לא פעיל/.test(t)) return 'done';
  if (/ממתין למסמך/.test(t)) return 'waiting';
  if (/דורש רענון/.test(t)) return 'refresh';
  if (/נתון שגוי|דורש תיקון/.test(t)) return 'wrong';
  if (/מאוחר יותר/.test(t)) return 'later';
  return 'open';
}

function vcFilterMatch_(item, filter) {
  if (filter === 'open') return ['open','wrong'].indexOf(item.bucket) !== -1;
  if (filter === 'waiting') return item.bucket === 'waiting';
  if (filter === 'refresh') return item.bucket === 'refresh';
  if (filter === 'done') return item.bucket === 'done';
  if (filter === 'later') return item.bucket === 'later';
  return true;
}

function vcEnsureHeaders_(sheet) {
  if (sheet.getLastRow() < 1) throw new Error('גיליון אימות נתונים ריק.');
  let map = vcHeaderMap_(sheet);
  VERIFICATION_CENTER_V1.REQUIRED_HEADERS.forEach(function(header) {
    if (!map[header]) throw new Error('חסרה כותרת חובה בגיליון אימות נתונים: ' + header);
  });

  VERIFICATION_CENTER_V1.OPTIONAL_HEADERS.forEach(function(header) {
    map = vcHeaderMap_(sheet);
    if (!map[header]) {
      const col = sheet.getLastColumn() + 1;
      sheet.getRange(1, col).setValue(header).setFontWeight('bold');
    }
  });
  return vcHeaderMap_(sheet);
}

function vcHeaderMap_(sheet) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const map = {};
  headers.forEach(function(header, index) {
    const key = String(header || '').trim();
    if (key) map[key] = index + 1;
  });
  return map;
}

function vcCell_(row, map, header) {
  const col = map[header];
  if (!col) return '';
  return String(row[col - 1] == null ? '' : row[col - 1]).trim();
}

function vcInstallTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  [VERIFICATION_CENTER_V1.OPEN_HANDLER, VERIFICATION_CENTER_V1.REFRESH_HANDLER].forEach(function(handler) {
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === handler) ScriptApp.deleteTrigger(trigger);
    });
  });

  ScriptApp.newTrigger(VERIFICATION_CENTER_V1.OPEN_HANDLER)
    .forSpreadsheet(vcSpreadsheet_())
    .onOpen()
    .create();

  ScriptApp.newTrigger(VERIFICATION_CENTER_V1.REFRESH_HANDLER)
    .timeBased()
    .everyHours(VERIFICATION_CENTER_V1.AUTO_REFRESH_HOURS)
    .create();
}

function vcSpreadsheet_() {
  if (typeof getSpreadsheet_ === 'function') return getSpreadsheet_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('לא נמצא קובץ מערכת פעיל.');
  return ss;
}

function vcSheet_(ss) {
  const sheet = ss.getSheetByName(VERIFICATION_CENTER_V1.SHEET_NAME);
  if (!sheet) throw new Error('לא נמצא גיליון "' + VERIFICATION_CENTER_V1.SHEET_NAME + '".');
  return sheet;
}
