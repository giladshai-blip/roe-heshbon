/**
 * ============================================================
 * רואה חשבון — Dashboard Clean V5.4
 * ============================================================
 *
 * דשבורד נקי המבוסס על 6 שעוני Gauge בלבד.
 *
 * מה עושה הקוד:
 * - מוחק את כל התוכן, העיצוב והתרשימים הקיימים בלוח המחוונים.
 * - יוצר 6 שעונים בלבד.
 * - נתוני העזר נשמרים בעמודות Y:AB ומוסתרים.
 * - השעונים מתעדכנים אוטומטית כאשר נוסחאות המקור משתנות.
 * - אינו משנה את יתר הטאבים או את מנגנון RiseUp.
 * - מאתר את הדשבורד לפי שם הגיליון המאומת "לוח מחוונים" ולא לפי Sheet ID לא מאומת.
 *
 * הפעלה:
 * 1. הדבק את כל הקוד בקובץ Dashboard.gs.
 * 2. שמור.
 * 3. הרץ פעם אחת: installCleanDashboardV54
 * ============================================================
 */

const DASHBOARD_V54 = {
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  DASHBOARD_SHEET_NAME: 'לוח מחוונים',
  VERSION: 'Dashboard V5.4',
  HELPER_START_COL: 25, // Y
  HELPER_END_COL: 28    // AB
};

/**
 * התקנה מלאה של הדשבורד החדש.
 * פעולה זו מוחקת את הדשבורד הקיים ובונה אותו מחדש.
 */
function installCleanDashboardV54() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V54.SPREADSHEET_ID);
  const sheet = getDashboardV54Sheet_();

  ensureDashboardV54Grid_(sheet);

  // מחיקת כל התרשימים הישנים.
  sheet.getCharts().forEach(chart => sheet.removeChart(chart));

  // מחיקת הדשבורד הישן לחלוטין.
  sheet.clear();
  sheet.clearConditionalFormatRules();

  // תצוגה נקייה.
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);

  // אם אזור העזר הוסתר בעבר, מציגים אותו זמנית לצורך בנייה מחדש.
  try {
    sheet.showColumns(
      DASHBOARD_V54.HELPER_START_COL,
      DASHBOARD_V54.HELPER_END_COL - DASHBOARD_V54.HELPER_START_COL + 1
    );
  } catch (e) {
    // אם העמודות כבר גלו, אין צורך בפעולה נוספת.
  }

  // שטח עבודה נוח לשישה שעונים.
  for (let c = 1; c <= 16; c++) {
    sheet.setColumnWidth(c, 92);
  }

  for (let r = 1; r <= 30; r++) {
    sheet.setRowHeight(r, 31);
  }

  buildDashboardV54HelperData_(sheet);
  createDashboardV54Gauges_(sheet);

  // הסתרת אזור הנתונים הטכני Y:AB.
  sheet.hideColumns(
    DASHBOARD_V54.HELPER_START_COL,
    DASHBOARD_V54.HELPER_END_COL - DASHBOARD_V54.HELPER_START_COL + 1
  );

  SpreadsheetApp.flush();

  ss.setActiveSheet(sheet);
  sheet.getRange('A1').activate();

  ss.toast(
    'הדשבורד החדש נבנה — 6 שעונים בלבד',
    'רואה חשבון',
    8
  );
}

/**
 * רענון מלא של הדשבורד.
 */
function refreshCleanDashboardV54() {
  installCleanDashboardV54();
}

/**
 * מחיקת הדשבורד והשארת הגיליון ריק.
 */
function clearCleanDashboardV54() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V54.SPREADSHEET_ID);
  const sheet = getDashboardV54Sheet_();

  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);

  ss.toast(
    'לוח המחוונים נוקה',
    'רואה חשבון',
    5
  );
}

/**
 * יצירת נתוני העזר המוסתרים.
 */
function buildDashboardV54HelperData_(sheet) {
  // כותרת + ששת המדדים.
  sheet.getRange('Y1:Z7').setValues([
    ['מדד', 'ערך'],
    ['יתרת עו״ש', ''],
    ['סוף חודש צפוי', ''],
    ['שפל 30 יום', ''],
    ['חשיפת אשראי', ''],
    ['כרית ביטחון', ''],
    ['מאזן חודשי', '']
  ]);

  // 1. יתרת עו״ש מחושבת אוטומטית.
  sheet.getRange('Z2').setFormula(
    '=IFERROR(\'הגדרות\'!B21,0)'
  );

  // 2. יתרת סוף החודש החזויה — השורה האחרונה בתזרים.
  sheet.getRange('Z3').setFormula(
    '=IFERROR(INDEX(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""),ROWS(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""))),0)'
  );

  // 3. נקודת השפל ב־30 הימים הקרובים.
  sheet.getRange('Z4').setFormula(
    '=MIN(IFERROR(MIN(FILTER(\'תזרים\'!G$2:G$32,\'תזרים\'!A$2:A$32>=TODAY(),\'תזרים\'!A$2:A$32<=TODAY()+30)),1E+99),IFERROR(MIN(FILTER(\'גאנט תזרים שנתי\'!I$16:I$380,\'גאנט תזרים שנתי\'!A$16:A$380>=TODAY(),\'גאנט תזרים שנתי\'!A$16:A$380<=TODAY()+30)),1E+99))'
  );

  // 4. חשיפה קרובה למסגרות אשראי מאומתות, באחוזים.
  sheet.getRange('Z5').setFormula(
    '=IFERROR(MAX(0,MIN(100,SUM(FILTER(\'כרטיסי אשראי\'!$E$2:$E,\'כרטיסי אשראי\'!$G$2:$G>0))/SUM(FILTER(\'כרטיסי אשראי\'!$G$2:$G,\'כרטיסי אשראי\'!$G$2:$G>0))*100)),0)'
  );

  // 5. התקדמות כרית הביטחון — חיסכון נזיל מול היעד בהגדרות B5.
  sheet.getRange('Z6').setFormula(
    '=IFERROR(MAX(0,MIN(100,SUM(\'חסכונות\'!C:C)/\'הגדרות\'!B5*100)),0)'
  );

  // 6. מאזן חודשי לפי מודל התזרים השנתי הקיים.
  sheet.getRange('Z7').setFormula(
    '=IFERROR(\'גאנט תזרים שנתי\'!B5+\'גאנט תזרים שנתי\'!B7-\'גאנט תזרים שנתי\'!B9,0)'
  );

  // זוגות עזר לכל Gauge כדי שכל תרשים יקבל טווח רציף של כותרת+ערך.
  sheet.getRange('AA1:AB6').clearContent();

  setGaugePairV54_(sheet, 1, '🏦 יתרת עו״ש', 'Z2');
  setGaugePairV54_(sheet, 2, '📅 סוף חודש צפוי', 'Z3');
  setGaugePairV54_(sheet, 3, '📉 שפל 30 יום', 'Z4');
  setGaugePairV54_(sheet, 4, '💳 חשיפת אשראי', 'Z5');
  setGaugePairV54_(sheet, 5, '🛟 כרית ביטחון', 'Z6');
  setGaugePairV54_(sheet, 6, '📊 מאזן חודשי', 'Z7');

  sheet.getRange('Z2:Z4').setNumberFormat('#,##0 ₪');
  sheet.getRange('Z5:Z6').setNumberFormat('0.0');
  sheet.getRange('Z7').setNumberFormat('#,##0 ₪');
  sheet.getRange('AB1:AB6').setNumberFormat('#,##0.00');
}

/**
 * יצירת זוג עזר עבור Gauge.
 */
function setGaugePairV54_(sheet, row, title, sourceCell) {
  sheet.getRange(row, 27).setValue(title);      // AA
  sheet.getRange(row, 28).setFormula('=' + sourceCell); // AB
}

/**
 * יצירת ששת השעונים.
 */
function createDashboardV54Gauges_(sheet) {
  insertGaugeV54_(sheet, {
    title: '🏦 יתרת עו״ש',
    helperRow: 1,
    row: 1,
    col: 1,
    min: -50000,
    max: 30000,
    redFrom: -50000,
    redTo: 0,
    yellowFrom: 0,
    yellowTo: 20000,
    greenFrom: 20000,
    greenTo: 30000,
    majorTicks: ['-50K', '0', '20K', '30K']
  });

  insertGaugeV54_(sheet, {
    title: '📅 סוף חודש צפוי',
    helperRow: 2,
    row: 1,
    col: 6,
    min: -50000,
    max: 30000,
    redFrom: -50000,
    redTo: 0,
    yellowFrom: 0,
    yellowTo: 20000,
    greenFrom: 20000,
    greenTo: 30000,
    majorTicks: ['-50K', '0', '20K', '30K']
  });

  insertGaugeV54_(sheet, {
    title: '📉 שפל 30 יום',
    helperRow: 3,
    row: 1,
    col: 11,
    min: -50000,
    max: 30000,
    redFrom: -50000,
    redTo: 0,
    yellowFrom: 0,
    yellowTo: 20000,
    greenFrom: 20000,
    greenTo: 30000,
    majorTicks: ['-50K', '0', '20K', '30K']
  });

  insertGaugeV54_(sheet, {
    title: '💳 חשיפת אשראי',
    helperRow: 4,
    row: 14,
    col: 1,
    min: 0,
    max: 100,
    greenFrom: 0,
    greenTo: 30,
    yellowFrom: 30,
    yellowTo: 50,
    redFrom: 50,
    redTo: 100,
    majorTicks: ['0%', '30%', '50%', '100%']
  });

  insertGaugeV54_(sheet, {
    title: '🛟 כרית ביטחון',
    helperRow: 5,
    row: 14,
    col: 6,
    min: 0,
    max: 100,
    redFrom: 0,
    redTo: 25,
    yellowFrom: 25,
    yellowTo: 70,
    greenFrom: 70,
    greenTo: 100,
    majorTicks: ['0%', '25%', '70%', '100%']
  });

  insertGaugeV54_(sheet, {
    title: '📊 מאזן חודשי — מודל',
    helperRow: 6,
    row: 14,
    col: 11,
    min: -5000,
    max: 10000,
    redFrom: -5000,
    redTo: 0,
    yellowFrom: 0,
    yellowTo: 1500,
    greenFrom: 1500,
    greenTo: 10000,
    majorTicks: ['-5K', '0', '1.5K', '10K']
  });
}

/**
 * פונקציית עזר אחידה ליצירת Gauge.
 */
function insertGaugeV54_(sheet, cfg) {
  let builder = sheet.newChart()
    .setChartType(Charts.ChartType.GAUGE)
    .addRange(sheet.getRange(cfg.helperRow, 27, 1, 2)) // AA:AB
    .setPosition(cfg.row, cfg.col, 0, 0)
    .setOption('title', cfg.title)
    .setOption('min', cfg.min)
    .setOption('max', cfg.max)
    .setOption('minorTicks', 5)
    .setOption('width', 330)
    .setOption('height', 225)
    .setOption('majorTicks', cfg.majorTicks || []);

  if (cfg.greenFrom !== undefined) builder = builder.setOption('greenFrom', cfg.greenFrom);
  if (cfg.greenTo !== undefined) builder = builder.setOption('greenTo', cfg.greenTo);
  if (cfg.yellowFrom !== undefined) builder = builder.setOption('yellowFrom', cfg.yellowFrom);
  if (cfg.yellowTo !== undefined) builder = builder.setOption('yellowTo', cfg.yellowTo);
  if (cfg.redFrom !== undefined) builder = builder.setOption('redFrom', cfg.redFrom);
  if (cfg.redTo !== undefined) builder = builder.setOption('redTo', cfg.redTo);

  sheet.insertChart(builder.build());
}

/**
 * מבטיח שיש מספיק שורות ועמודות לדשבורד ולאזור העזר.
 */
function ensureDashboardV54Grid_(sheet) {
  const requiredColumns = 28; // AB
  const requiredRows = 30;

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

/**
 * איתור גיליון לוח המחוונים לפי שם מאומת.
 */
function getDashboardV54Sheet_() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V54.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DASHBOARD_V54.DASHBOARD_SHEET_NAME);

  if (!sheet) {
    throw new Error(
      'לא נמצא גיליון בשם "' + DASHBOARD_V54.DASHBOARD_SHEET_NAME + '".'
    );
  }

  return sheet;
}
