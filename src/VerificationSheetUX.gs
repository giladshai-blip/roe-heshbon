/**
 * ============================================================
 * רואה חשבון — Verification Sheet UX V1.0.1
 * ============================================================
 * עיצוב שמרני וברור לגיליון "אימות נתונים".
 *
 * עקרונות:
 * - לא משנה נתונים פיננסיים ולא מזיז את עמודות המקור.
 * - שומר תאימות ל-Core ול-Verification Center הקיימים.
 * - מסתיר כברירת מחדל את עמודות ההשוואה הטכניות B:E.
 * - מציג את עמודות העבודה המרכזיות: נושא, סטטוס, החלטה,
 *   מה חסר, מצב טיפול, הערה, עודכן לאחרונה.
 * - מוסיף מסנן, צבעי סטטוס, dropdown למצב טיפול ולוח סיכום קטן.
 * ============================================================
 */

const VERIFICATION_SHEET_UX_V1 = {
  VERSION: 'V1.0.1',
  SHEET_NAME: 'אימות נתונים',
  MAX_FORMAT_ROWS: 2000,
  EXPECTED_HEADERS: {
    A: 'נושא',
    B: 'נתון A',
    C: 'מקור A',
    D: 'נתון B',
    E: 'מקור B',
    F: 'סטטוס',
    G: 'החלטה תפעולית',
    H: 'מה חסר לאימות',
    I: 'מצב טיפול'
  },
  TREATMENT_VALUES: [
    'פתוח',
    'ממתין למסמך',
    'דורש רענון',
    'בדיקה מאוחר יותר',
    'נתון שגוי — דורש תיקון',
    'נסגר ידנית',
    'נסגר אוטומטית'
  ]
};

function installVerificationSheetUXV1() {
  const ss = vsuSpreadsheet_();
  const sheet = vsuSheet_(ss);

  if (typeof refreshVerificationCenterV1 === 'function') {
    refreshVerificationCenterV1();
  }

  vsuValidateLayout_(sheet);
  vsuEnsureOptionalHeaders_(sheet);
  vsuApplyLayout_(sheet);
  vsuApplyFilter_(sheet);
  vsuApplyTreatmentValidation_(sheet);
  vsuApplyConditionalFormatting_(sheet);
  vsuBuildSummaryPanel_(sheet);
  vsuAddHeaderNotes_(sheet);

  SpreadsheetApp.flush();
  ss.toast('גיליון אימות נתונים סודר ועוצב', 'Verification UX ' + VERIFICATION_SHEET_UX_V1.VERSION, 6);
  return getVerificationSheetUXStatusV1();
}

function refreshVerificationSheetUXV1() {
  return installVerificationSheetUXV1();
}

function getVerificationSheetUXStatusV1() {
  const sheet = vsuSheet_(vsuSpreadsheet_());
  const map = vsuHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  const topicCol = map['נושא'];
  const treatmentCol = map['מצב טיפול'];
  const rows = lastRow > 1 && topicCol && treatmentCol
    ? sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues()
    : [];

  const counts = {open:0, waiting:0, refresh:0, later:0, done:0, wrong:0, total:0};
  rows.forEach(function(row) {
    if (!String(row[topicCol - 1] || '').trim()) return;
    counts.total++;
    const t = String(row[treatmentCol - 1] || '').trim();
    if (/נסגר|הושלם|לא פעיל/.test(t)) counts.done++;
    else if (/ממתין למסמך/.test(t)) counts.waiting++;
    else if (/דורש רענון/.test(t)) counts.refresh++;
    else if (/מאוחר יותר/.test(t)) counts.later++;
    else if (/שגוי|דורש תיקון/.test(t)) counts.wrong++;
    else counts.open++;
  });

  return {
    version: VERIFICATION_SHEET_UX_V1.VERSION,
    counts: counts,
    technicalColumnsHidden: sheet.isColumnHiddenByUser(2) && sheet.isColumnHiddenByUser(5)
  };
}

function showVerificationTechnicalColumnsV1() {
  const sheet = vsuSheet_(vsuSpreadsheet_());
  sheet.showColumns(2, 4);
  SpreadsheetApp.getActive().toast('פרטי ההשוואה הטכניים מוצגים', 'אימות נתונים', 4);
}

function hideVerificationTechnicalColumnsV1() {
  const sheet = vsuSheet_(vsuSpreadsheet_());
  sheet.hideColumns(2, 4);
  SpreadsheetApp.getActive().toast('פרטי ההשוואה הטכניים הוסתרו', 'אימות נתונים', 4);
}

function vsuApplyLayout_(sheet) {
  sheet.setRightToLeft(true);
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  const lastCol = Math.max(11, sheet.getLastColumn());
  const lastRow = Math.max(2, Math.min(VERIFICATION_SHEET_UX_V1.MAX_FORMAT_ROWS, Math.max(sheet.getLastRow(), 60)));

  sheet.getRange(1, 1, 1, lastCol)
    .setBackground('#16324F')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(1, 42);

  sheet.getRange(2, 1, lastRow - 1, Math.min(11, lastCol))
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setFontSize(10);

  sheet.setColumnWidth(1, 230);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(7, 360);
  sheet.setColumnWidth(8, 360);
  sheet.setColumnWidth(9, 190);
  if (lastCol >= 10) sheet.setColumnWidth(10, 280);
  if (lastCol >= 11) sheet.setColumnWidth(11, 145);

  sheet.hideColumns(2, 4);

  sheet.getRange(2, 7, lastRow - 1, 3).setBackground('#FAFCFE');
  if (lastCol >= 10) sheet.getRange(2, 10, lastRow - 1, 2).setBackground('#F7F9FB');
  if (lastCol >= 11) sheet.getRange(2, 11, lastRow - 1, 1).setNumberFormat('dd/mm/yyyy hh:mm');
}

function vsuApplyFilter_(sheet) {
  const lastRow = Math.max(2, sheet.getLastRow());
  const lastCol = Math.min(11, Math.max(9, sheet.getLastColumn()));
  const existing = sheet.getFilter();
  if (existing) existing.remove();
  sheet.getRange(1, 1, lastRow, lastCol).createFilter();
}

function vsuApplyTreatmentValidation_(sheet) {
  const map = vsuHeaderMap_(sheet);
  const col = map['מצב טיפול'];
  if (!col) return;
  const rows = Math.max(1, VERIFICATION_SHEET_UX_V1.MAX_FORMAT_ROWS - 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(VERIFICATION_SHEET_UX_V1.TREATMENT_VALUES, true)
    .setAllowInvalid(true)
    .setHelpText('בחר מצב טיפול. פעולות ממרכז האימות יעדכנו את אותה עמודה.')
    .build();
  sheet.getRange(2, col, rows, 1).setDataValidation(rule);
}

function vsuApplyConditionalFormatting_(sheet) {
  const map = vsuHeaderMap_(sheet);
  const treatmentCol = map['מצב טיפול'];
  const statusCol = map['סטטוס'];
  if (!treatmentCol) return;

  const lastCol = Math.min(11, Math.max(9, sheet.getLastColumn()));
  const body = sheet.getRange(2, 1, VERIFICATION_SHEET_UX_V1.MAX_FORMAT_ROWS - 1, lastCol);
  const treatmentLetter = vsuColumnLetter_(treatmentCol);
  const rules = [];

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=REGEXMATCH($' + treatmentLetter + '2,"נסגר|הושלם|לא פעיל")')
    .setBackground('#E8F5E9').setFontColor('#1B5E20').setRanges([body]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + treatmentLetter + '2="ממתין למסמך"')
    .setBackground('#FFF3E0').setFontColor('#8A4B08').setRanges([body]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + treatmentLetter + '2="דורש רענון"')
    .setBackground('#E3F2FD').setFontColor('#0D47A1').setRanges([body]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=REGEXMATCH($' + treatmentLetter + '2,"שגוי|דורש תיקון")')
    .setBackground('#FDECEC').setFontColor('#9B1C1C').setRanges([body]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + treatmentLetter + '2="בדיקה מאוחר יותר"')
    .setBackground('#F3E5F5').setFontColor('#6A1B9A').setRanges([body]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=OR($' + treatmentLetter + '2="",$' + treatmentLetter + '2="פתוח")')
    .setBackground('#FFFDE7').setFontColor('#5D4B00').setRanges([body]).build());

  if (statusCol) {
    const statusRange = sheet.getRange(2, statusCol, VERIFICATION_SHEET_UX_V1.MAX_FORMAT_ROWS - 1, 1);
    const statusLetter = vsuColumnLetter_(statusCol);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=REGEXMATCH($' + statusLetter + '2,"פער|חסר|לא אומת|דורש")')
      .setBackground('#FFEBEE').setFontColor('#B71C1C').setRanges([statusRange]).build());
  }

  sheet.setConditionalFormatRules(rules);
}

function vsuBuildSummaryPanel_(sheet) {
  sheet.getRange('M1:N7').breakApart();
  sheet.getRange('M1:N7').clearContent().clearFormat();
  sheet.getRange('M1:N1').merge();
  sheet.getRange('M1').setValue('מרכז אימות — תמונת מצב')
    .setBackground('#16324F').setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange('M2:M7').setValues([
    ['פתוחים לטיפול'],
    ['ממתינים למסמך'],
    ['דורשים רענון'],
    ['בדיקה מאוחר יותר'],
    ['הושלמו'],
    ['סה״כ נושאים']
  ]).setFontWeight('bold').setBackground('#EAF1F8');

  sheet.getRange('N2').setFormula('=COUNTIF(I2:I,"פתוח")+COUNTIF(I2:I,"*דורש תיקון*")+COUNTIFS(A2:A,"<>",I2:I,"")');
  sheet.getRange('N3').setFormula('=COUNTIF(I2:I,"ממתין למסמך")');
  sheet.getRange('N4').setFormula('=COUNTIF(I2:I,"דורש רענון")');
  sheet.getRange('N5').setFormula('=COUNTIF(I2:I,"בדיקה מאוחר יותר")');
  sheet.getRange('N6').setFormula('=COUNTIF(I2:I,"נסגר*")+COUNTIF(I2:I,"*הושלם*")+COUNTIF(I2:I,"לא פעיל")');
  sheet.getRange('N7').setFormula('=COUNTA(A2:A)');
  sheet.getRange('N2:N7').setHorizontalAlignment('center').setFontWeight('bold');

  sheet.setColumnWidth(13, 170);
  sheet.setColumnWidth(14, 90);
}

function vsuAddHeaderNotes_(sheet) {
  const map = vsuHeaderMap_(sheet);
  const notes = {
    'נושא': 'מה אנחנו מנסים לאמת.',
    'נתון A': 'ערך ראשון להשוואה — עמודה טכנית מוסתרת כברירת מחדל.',
    'מקור A': 'מקור הנתון הראשון.',
    'נתון B': 'ערך שני להשוואה — עמודה טכנית מוסתרת כברירת מחדל.',
    'מקור B': 'מקור הנתון השני.',
    'סטטוס': 'מה המערכת יודעת כרגע על אמינות הנתון.',
    'החלטה תפעולית': 'כיצד המערכת משתמשת בנתון עד לסיום האימות.',
    'מה חסר לאימות': 'הפעולה או המסמך שעדיין דרושים.',
    'מצב טיפול': 'מצב המשימה במרכז האימות.',
    'הערת טיפול': 'הערה חופשית שלך או של המערכת.',
    'עודכן לאחרונה': 'מועד העדכון האחרון של תהליך האימות.'
  };
  Object.keys(notes).forEach(function(header) {
    if (map[header]) sheet.getRange(1, map[header]).setNote(notes[header]);
  });
}

function vsuEnsureOptionalHeaders_(sheet) {
  let nextCol = sheet.getLastColumn() + 1;
  ['הערת טיפול', 'עודכן לאחרונה'].forEach(function(header) {
    if (!vsuHeaderMap_(sheet)[header]) {
      sheet.getRange(1, nextCol).setValue(header);
      nextCol++;
    }
  });
}

function vsuValidateLayout_(sheet) {
  const headers = sheet.getRange(1, 1, 1, 9).getDisplayValues()[0];
  Object.keys(VERIFICATION_SHEET_UX_V1.EXPECTED_HEADERS).forEach(function(letter) {
    const index = vsuColumnNumber_(letter) - 1;
    const expected = VERIFICATION_SHEET_UX_V1.EXPECTED_HEADERS[letter];
    if (String(headers[index] || '').trim() !== expected) {
      throw new Error('מבנה גיליון אימות נתונים השתנה. צפוי ' + expected + ' בעמודה ' + letter + '.');
    }
  });
}

function vsuHeaderMap_(sheet) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const map = {};
  headers.forEach(function(value, index) {
    const key = String(value || '').trim();
    if (key) map[key] = index + 1;
  });
  return map;
}

function vsuSpreadsheet_() {
  if (typeof getSpreadsheet_ === 'function') return getSpreadsheet_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('לא נמצא Spreadsheet פעיל.');
  return ss;
}

function vsuSheet_(ss) {
  const sheet = ss.getSheetByName(VERIFICATION_SHEET_UX_V1.SHEET_NAME);
  if (!sheet) throw new Error('לא נמצא גיליון "אימות נתונים".');
  return sheet;
}

function vsuColumnLetter_(n) {
  let s = '';
  while (n) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function vsuColumnNumber_(letter) {
  let n = 0;
  String(letter).toUpperCase().split('').forEach(function(ch) {
    n = n * 26 + ch.charCodeAt(0) - 64;
  });
  return n;
}
