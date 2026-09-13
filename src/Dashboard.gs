/**
 * ============================================================
 * רואה חשבון — Dashboard V5.5
 * ============================================================
 *
 * דשבורד משפחתי ללא שעונים:
 * - 4 כרטיסי מצב מרכזיים.
 * - סיכום מצב בשפה פשוטה.
 * - המלצה מרכזית דינמית.
 * - משימות לביצוע לפי הנתונים בפועל.
 * - מצב אשראי, כרית ביטחון ועדכניות נתונים.
 * - ללא Charts / Gauges.
 *
 * הפעלה:
 * 1. החלף את כל תוכן Dashboard.gs בקוד הזה.
 * 2. שמור.
 * 3. הרץ: installDashboardV55
 * ============================================================
 */

const DASHBOARD_V55 = {
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  DASHBOARD_SHEET_NAME: 'לוח מחוונים',
  VERSION: 'Dashboard V5.5',
  HELPER_START_COL: 25, // Y
  HELPER_END_COL: 26    // Z
};

function installDashboardV55() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V55.SPREADSHEET_ID);
  const sheet = getDashboardV55Sheet_();

  ensureDashboardV55Grid_(sheet);

  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  sheet.clear();
  sheet.clearConditionalFormatRules();

  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);

  try {
    sheet.showColumns(
      DASHBOARD_V55.HELPER_START_COL,
      DASHBOARD_V55.HELPER_END_COL - DASHBOARD_V55.HELPER_START_COL + 1
    );
  } catch (e) {}

  configureDashboardV55Grid_(sheet);
  buildDashboardV55HelperData_(sheet);
  buildDashboardV55Layout_(sheet);
  applyDashboardV55ConditionalFormatting_(sheet);

  sheet.hideColumns(
    DASHBOARD_V55.HELPER_START_COL,
    DASHBOARD_V55.HELPER_END_COL - DASHBOARD_V55.HELPER_START_COL + 1
  );

  SpreadsheetApp.flush();
  ss.setActiveSheet(sheet);
  sheet.getRange('A1').activate();

  ss.toast(
    'Dashboard V5.5 נבנה — כרטיסים, המלצות ומשימות',
    'רואה חשבון',
    8
  );
}

function refreshDashboardV55() {
  installDashboardV55();
}

function clearDashboardV55() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V55.SPREADSHEET_ID);
  const sheet = getDashboardV55Sheet_();

  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);

  ss.toast('לוח המחוונים נוקה', 'רואה חשבון', 5);
}

// תאימות לתפריט V5.4 הקיים ב-Code.gs.
function installCleanDashboardV54() {
  return installDashboardV55();
}

function refreshCleanDashboardV54() {
  return refreshDashboardV55();
}

function clearCleanDashboardV54() {
  return clearDashboardV55();
}

function buildDashboardV55HelperData_(sheet) {
  sheet.getRange('Y1:Z11').setValues([
    ['מדד', 'ערך'],
    ['יתרת עו״ש', ''],
    ['סוף חודש צפוי', ''],
    ['שפל 30 יום', ''],
    ['חשיפת אשראי', ''],
    ['יעד כרית ביטחון', ''],
    ['כרית ביטחון נוכחית', ''],
    ['פער כרית ביטחון', ''],
    ['מאזן חודשי', ''],
    ['סנכרון אחרון', ''],
    ['אימות עו״ש אחרון', '']
  ]);

  sheet.getRange('Z2').setFormula(
    '=IFERROR(INDEX(\'הגדרות\'!B:B,MATCH("יתרת עו״ש מחושבת אוטומטית",\'הגדרות\'!A:A,0)),0)'
  );

  sheet.getRange('Z3').setFormula(
    '=IFERROR(INDEX(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""),ROWS(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""))),0)'
  );

  sheet.getRange('Z4').setFormula(
    '=MIN(IFERROR(MIN(FILTER(\'תזרים\'!G$2:G$32,\'תזרים\'!A$2:A$32>=TODAY(),\'תזרים\'!A$2:A$32<=TODAY()+30)),1E+99),IFERROR(MIN(FILTER(\'גאנט תזרים שנתי\'!I$16:I$380,\'גאנט תזרים שנתי\'!A$16:A$380>=TODAY(),\'גאנט תזרים שנתי\'!A$16:A$380<=TODAY()+30)),1E+99))'
  );

  sheet.getRange('Z5').setFormula(
    '=IFERROR(MAX(0,MIN(100,SUM(FILTER(\'כרטיסי אשראי\'!$E$2:$E,\'כרטיסי אשראי\'!$G$2:$G>0))/SUM(FILTER(\'כרטיסי אשראי\'!$G$2:$G,\'כרטיסי אשראי\'!$G$2:$G>0))*100)),0)'
  );

  sheet.getRange('Z6').setFormula(
    '=IFERROR(INDEX(\'יעדים\'!B:B,MATCH("כרית ביטחון / חיסכון ראשון",\'יעדים\'!A:A,0)),0)'
  );

  sheet.getRange('Z7').setFormula(
    '=IFERROR(INDEX(\'יעדים\'!C:C,MATCH("כרית ביטחון / חיסכון ראשון",\'יעדים\'!A:A,0)),0)'
  );

  sheet.getRange('Z8').setFormula('=MAX(0,Z6-Z7)');

  sheet.getRange('Z9').setFormula(
    '=IFERROR(\'גאנט תזרים שנתי\'!B5+\'גאנט תזרים שנתי\'!B7-\'גאנט תזרים שנתי\'!B9,0)'
  );

  sheet.getRange('Z10').setFormula(
    '=IFERROR(INDEX(\'הגדרות\'!B:B,MATCH("תאריך רענון אחרון",\'הגדרות\'!A:A,0)),"")'
  );

  sheet.getRange('Z11').setFormula(
    '=IFERROR(INDEX(\'הגדרות\'!B:B,MATCH("תאריך ושעת יתרת עו״ש",\'הגדרות\'!A:A,0)),"")'
  );

  sheet.getRange('Z2:Z4').setNumberFormat('#,##0.00 ₪');
  sheet.getRange('Z5').setNumberFormat('0.0');
  sheet.getRange('Z6:Z9').setNumberFormat('#,##0.00 ₪');
  sheet.getRange('Z10:Z11').setNumberFormat('dd/mm/yyyy hh:mm');
}

function buildDashboardV55Layout_(sheet) {
  // כותרת.
  mergeAndSetV55_(sheet, 'A1:P2', 'המצב הכספי שלנו');
  sheet.getRange('A1:P2')
    .setBackground('#16324F')
    .setFontColor('#FFFFFF')
    .setFontSize(22)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  mergeAndSetV55_(sheet, 'A3:P3', 'תמונה פשוטה וברורה של המצב, מה חשוב עכשיו ומה עושים הלאה');
  sheet.getRange('A3:P3')
    .setBackground('#EAF1F8')
    .setFontColor('#38506A')
    .setFontSize(11)
    .setHorizontalAlignment('center');

  // 4 כרטיסי מצב.
  buildMetricCardV55_(sheet, 'A5:D8', 'יתרת עו״ש עכשיו', '=Z2', '#,##0 ₪');
  buildMetricCardV55_(sheet, 'E5:H8', 'סוף חודש צפוי', '=Z3', '#,##0 ₪');
  buildMetricCardV55_(sheet, 'I5:L8', 'שפל ב־30 יום', '=Z4', '#,##0 ₪');
  buildMetricCardV55_(sheet, 'M5:P8', 'מאזן חודשי', '=Z9', '#,##0 ₪');

  // מצב והמלצה.
  buildSectionHeaderV55_(sheet, 'A10:H10', 'מה זה אומר');
  mergeAndSetV55_(sheet, 'A11:H14', '');
  sheet.getRange('A11').setFormula(
    '=IF($Z$3<0,"אם לא נעשה שינוי, סוף החודש צפוי להיות במינוס של "&TEXT(ABS($Z$3),"#,##0 ₪")&". נקודת השפל הצפויה ב־30 יום היא "&TEXT($Z$4,"#,##0 ₪")&".",IF($Z$9<0,"העו״ש נראה טוב יותר, אבל התקציב החודשי עדיין שלילי ב־"&TEXT(ABS($Z$9),"#,##0 ₪")&" לחודש.","התזרים החודשי מאוזן או חיובי. אפשר לעבור בהדרגה לבניית כרית ביטחון וחיסכון."))'
  );
  styleTextPanelV55_(sheet.getRange('A11:H14'));

  buildSectionHeaderV55_(sheet, 'I10:P10', 'המלצה מרכזית');
  mergeAndSetV55_(sheet, 'I11:P14', '');
  sheet.getRange('I11').setFormula(
    '=IF($Z$3<0,"המטרה הראשונה עכשיו היא להאט את קצב יציאת הכסף עד סוף החודש. לא לקחת אשראי חדש כדי לכסות את הפער; קודם לבדוק הוצאות משתנות, תשלומים שניתן לדחות וחיובים שניתן להעביר למועד מתאים יותר.",IF($Z$9<0,"המטרה הבאה היא לסגור גירעון חודשי של "&TEXT(ABS($Z$9),"#,##0 ₪")&". כל שיפור קבוע בסכום הזה משנה את התמונה לשנים קדימה.",IF($Z$7<$Z$6,"התזרים יציב. עכשיו בונים כרית ביטחון. היעד הוא "&TEXT($Z$6,"#,##0 ₪")&" וחסרים "&TEXT($Z$8,"#,##0 ₪")&".","המצב יציב יחסית. אפשר להתקדם לחיסכון והשקעות בהתאם לסדר העדיפויות המשפחתי.")))'
  );
  styleTextPanelV55_(sheet.getRange('I11:P14'));
  sheet.getRange('I11:P14').setBackground('#FFF7E6');

  // משימות.
  buildSectionHeaderV55_(sheet, 'A16:P16', 'משימות לביצוע');
  buildTaskRowV55_(sheet, 17, '1', '=IF($Z$3<0,"דחוף","מעקב")', '=IF($Z$3<0,"עברו על ההוצאות עד סוף החודש וסמנו לפחות 3 הוצאות שניתן לדחות, לצמצם או לבטל.","שמרו על מסגרת ההוצאות עד סוף החודש כדי לא לפגוע ביתרה הצפויה.")');
  buildTaskRowV55_(sheet, 18, '2', '=IF($Z$9<0,"חשוב","בוצע")', '=IF($Z$9<0,"מצאו שיפור קבוע של "&TEXT(ABS($Z$9),"#,##0 ₪")&" לחודש באמצעות צמצום הוצאה קבועה, הוצאה משתנה או תוספת הכנסה.","המאזן החודשי אינו שלילי כרגע — המשיכו לעקוב.")');
  buildTaskRowV55_(sheet, 19, '3', '=IF($Z$5>=50,"דחוף",IF($Z$5>=30,"חשוב","תקין"))', '=IF($Z$5>=50,"חשיפת האשראי גבוהה. הימנעו כרגע מרכישות חדשות בתשלומים ומפתיחת מסגרות נוספות.",IF($Z$5>=30,"חשיפת האשראי היא "&TEXT($Z$5,"0.0")&"%. שמרו שלא תעלה מעל 50%.","חשיפת האשראי נמוכה יחסית. המשיכו לשמור על שימוש מבוקר."))');
  buildTaskRowV55_(sheet, 20, '4', '=IF($Z$8>0,"בהמשך","בוצע")', '=IF($Z$8>0,"לאחר איזון התזרים, התחילו לבנות כרית ביטחון. חסרים ליעד "&TEXT($Z$8,"#,##0 ₪")&".","יעד כרית הביטחון הושלם.")');

  // אשראי וכרית ביטחון.
  buildSectionHeaderV55_(sheet, 'A22:H22', 'יציבות פיננסית');
  mergeAndSetV55_(sheet, 'A23:D23', 'חשיפת אשראי');
  mergeAndSetV55_(sheet, 'E23:H23', 'כרית ביטחון');
  sheet.getRange('A24:D26').merge();
  sheet.getRange('E24:H26').merge();
  sheet.getRange('A24').setFormula('=TEXT($Z$5,"0.0")&"%"');
  sheet.getRange('E24').setFormula('=TEXT($Z$7,"#,##0 ₪")&" מתוך "&TEXT($Z$6,"#,##0 ₪")');
  styleMiniMetricV55_(sheet.getRange('A23:D26'));
  styleMiniMetricV55_(sheet.getRange('E23:H26'));

  // עדכניות נתונים.
  buildSectionHeaderV55_(sheet, 'I22:P22', 'עדכניות הנתונים');
  mergeAndSetV55_(sheet, 'I23:L23', 'סנכרון אחרון');
  mergeAndSetV55_(sheet, 'M23:P23', 'אימות עו״ש אחרון');
  sheet.getRange('I24:L26').merge();
  sheet.getRange('M24:P26').merge();
  sheet.getRange('I24').setFormula('=IF($Z$10="","לא ידוע",TEXT($Z$10,"dd/mm/yyyy hh:mm"))');
  sheet.getRange('M24').setFormula('=IF($Z$11="","לא ידוע",TEXT($Z$11,"dd/mm/yyyy hh:mm"))');
  styleMiniMetricV55_(sheet.getRange('I23:L26'));
  styleMiniMetricV55_(sheet.getRange('M23:P26'));

  // תחתית.
  mergeAndSetV55_(sheet, 'A28:P29', 'סדר העדיפויות: איזון חודשי → יציאה מהמינוס → כרית ביטחון → חיסכון → השקעות');
  sheet.getRange('A28:P29')
    .setBackground('#F2F5F8')
    .setFontColor('#536273')
    .setFontSize(10)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
}

function configureDashboardV55Grid_(sheet) {
  for (let c = 1; c <= 16; c++) {
    sheet.setColumnWidth(c, 78);
  }

  for (let r = 1; r <= 35; r++) {
    sheet.setRowHeight(r, 30);
  }

  sheet.setRowHeight(1, 34);
  sheet.setRowHeight(2, 34);
  sheet.setRowHeight(3, 28);
  sheet.setRowHeights(11, 4, 34);
  sheet.setRowHeights(17, 4, 34);
  sheet.setRowHeights(24, 3, 34);
}

function buildMetricCardV55_(sheet, rangeA1, label, formula, numberFormat) {
  const range = sheet.getRange(rangeA1);
  const row = range.getRow();
  const col = range.getColumn();
  const numCols = range.getNumColumns();

  sheet.getRange(row, col, 1, numCols).merge();
  sheet.getRange(row + 1, col, range.getNumRows() - 1, numCols).merge();

  const titleCell = sheet.getRange(row, col);
  const valueCell = sheet.getRange(row + 1, col);

  titleCell
    .setValue(label)
    .setFontSize(10)
    .setFontWeight('bold')
    .setFontColor('#5B6B7A')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  valueCell
    .setFormula(formula)
    .setNumberFormat(numberFormat)
    .setFontSize(20)
    .setFontWeight('bold')
    .setFontColor('#16324F')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  range
    .setBackground('#FFFFFF')
    .setBorder(true, true, true, true, false, false, '#D7E0E8', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function buildSectionHeaderV55_(sheet, rangeA1, text) {
  mergeAndSetV55_(sheet, rangeA1, text);
  sheet.getRange(rangeA1)
    .setBackground('#DCEAF7')
    .setFontColor('#16324F')
    .setFontSize(12)
    .setFontWeight('bold')
    .setHorizontalAlignment('right')
    .setVerticalAlignment('middle');
}

function buildTaskRowV55_(sheet, row, number, priorityFormula, taskFormula) {
  sheet.getRange(row, 1, 1, 2).merge();
  sheet.getRange(row, 3, 1, 3).merge();
  sheet.getRange(row, 6, 1, 11).merge();

  sheet.getRange(row, 1)
    .setValue(number)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row, 3)
    .setFormula(priorityFormula)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.getRange(row, 6)
    .setFormula(taskFormula)
    .setWrap(true)
    .setHorizontalAlignment('right');

  sheet.getRange(row, 1, 1, 16)
    .setBackground('#FFFFFF')
    .setVerticalAlignment('middle')
    .setBorder(false, false, true, false, false, false, '#E3E8ED', SpreadsheetApp.BorderStyle.SOLID);
}

function styleTextPanelV55_(range) {
  range
    .setBackground('#FFFFFF')
    .setFontColor('#2B3A48')
    .setFontSize(11)
    .setWrap(true)
    .setHorizontalAlignment('right')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, '#D7E0E8', SpreadsheetApp.BorderStyle.SOLID);
}

function styleMiniMetricV55_(range) {
  range
    .setBackground('#FFFFFF')
    .setFontColor('#2B3A48')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, false, false, '#D7E0E8', SpreadsheetApp.BorderStyle.SOLID);

  const topRow = range.getRow();
  const leftCol = range.getColumn();
  const width = range.getNumColumns();

  sheetSafeRangeV55_(range.getSheet(), topRow, leftCol, 1, width)
    .setFontWeight('bold')
    .setFontColor('#5B6B7A');

  sheetSafeRangeV55_(range.getSheet(), topRow + 1, leftCol, range.getNumRows() - 1, width)
    .setFontSize(16)
    .setFontWeight('bold')
    .setFontColor('#16324F');
}

function applyDashboardV55ConditionalFormatting_(sheet) {
  const rules = [];

  addCardRulesV55_(rules, sheet, 'A5:D8', '$Z$2');
  addCardRulesV55_(rules, sheet, 'E5:H8', '$Z$3');
  addCardRulesV55_(rules, sheet, 'I5:L8', '$Z$4');
  addCardRulesV55_(rules, sheet, 'M5:P8', '$Z$9');

  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$Z$5>=50')
      .setBackground('#FDECEC')
      .setRanges([sheet.getRange('A23:D26')])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($Z$5>=30,$Z$5<50)')
      .setBackground('#FFF7E6')
      .setRanges([sheet.getRange('A23:D26')])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$Z$5<30')
      .setBackground('#ECF8F0')
      .setRanges([sheet.getRange('A23:D26')])
      .build()
  );

  sheet.setConditionalFormatRules(rules);
}

function addCardRulesV55_(rules, sheet, rangeA1, helperRef) {
  const range = sheet.getRange(rangeA1);

  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=' + helperRef + '<0')
      .setBackground('#FDECEC')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(' + helperRef + '>=0,' + helperRef + '<1500)')
      .setBackground('#FFF7E6')
      .setRanges([range])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=' + helperRef + '>=1500')
      .setBackground('#ECF8F0')
      .setRanges([range])
      .build()
  );
}

function mergeAndSetV55_(sheet, rangeA1, value) {
  const range = sheet.getRange(rangeA1);
  range.merge();
  range.getCell(1, 1).setValue(value);
  return range;
}

function sheetSafeRangeV55_(sheet, row, col, numRows, numCols) {
  return sheet.getRange(row, col, Math.max(1, numRows), Math.max(1, numCols));
}

function ensureDashboardV55Grid_(sheet) {
  const requiredColumns = 26; // Z
  const requiredRows = 35;

  if (sheet.getMaxColumns() < requiredColumns) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      requiredColumns - sheet.getMaxColumns()
    );
  }

  if (sheet.getMaxRows() < requiredRows) {
    sheet.insertRowsAfter(
      sheet.getMaxRows(),
      requiredRows - sheet.getMaxRows()
    );
  }
}

function getDashboardV55Sheet_() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V55.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DASHBOARD_V55.DASHBOARD_SHEET_NAME);

  if (!sheet) {
    throw new Error('לא נמצא גיליון בשם "' + DASHBOARD_V55.DASHBOARD_SHEET_NAME + '".');
  }

  return sheet;
}
