/**
 * ============================================================
 * רואה חשבון — Dashboard Clean V5.3
 * ============================================================
 *
 * דשבורד נקי המבוסס על שעוני Gauge בלבד.
 *
 * מה עושה הקוד:
 * - מוחק את כל התוכן/עיצוב/תרשימים הקיימים בלוח המחוונים.
 * - יוצר 6 שעונים בלבד.
 * - נתוני העזר נשמרים בעמודות Y:Z ומוסתרים.
 * - השעונים מתעדכנים אוטומטית כאשר נוסחאות המקור משתנות.
 * - אינו משנה את יתר הטאבים או את מנגנון RiseUp.
 *
 * חשוב:
 * הרץ פעם אחת את installCleanDashboardV53().
 * ============================================================
 */

const DASHBOARD_V53 = {
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  DASHBOARD_SHEET_ID: 1977013179,
  VERSION: 'Dashboard V5.3'
};

/**
 * התקנה מלאה של הדשבורד החדש.
 */
function installCleanDashboardV53() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V53.SPREADSHEET_ID);
  const sheet = getDashboardV53Sheet_();

  // מחיקת התרשימים הישנים.
  sheet.getCharts().forEach(chart => sheet.removeChart(chart));

  // מחיקת הדשבורד הישן לחלוטין.
  sheet.clear();
  sheet.clearConditionalFormatRules();

  // תצוגה נקייה.
  sheet.setHiddenGridlines(true);
  sheet.setRightToLeft(true);
  sheet.setFrozenRows(0);
  sheet.setFrozenColumns(0);

  // שטח עבודה נוח לשישה שעונים.
  for (let c = 1; c <= 16; c++) {
    sheet.setColumnWidth(c, 90);
  }
  for (let r = 1; r <= 30; r++) {
    sheet.setRowHeight(r, 30);
  }

  buildDashboardV53HelperData_();
  createDashboardV53Gauges_();

  // הסתרת אזור הנתונים הטכני.
  sheet.hideColumns(25, 2); // Y:Z

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
 * רענון מבנה השעונים ללא שינוי במקורות הנתונים.
 */
function refreshCleanDashboardV53() {
  installCleanDashboardV53();
}

/**
 * יצירת נתוני העזר המוסתרים.
 */
function buildDashboardV53HelperData_() {
  const sheet = getDashboardV53Sheet_();

  const labels = [
    ['מדד', 'ערך'],
    ['יתרת עו״ש', ''],
    ['סוף חודש צפוי', ''],
    ['שפל 30 יום', ''],
    ['חשיפת אשראי', ''],
    ['כרית ביטחון', ''],
    ['מאזן חודשי', '']
  ];

  sheet.getRange('Y1:Z7').setValues(labels);

  // 1. יתרת עו״ש מחושבת אוטומטית.
  sheet.getRange('Z2').setFormula(
    '=IFERROR(\'הגדרות\'!B21,0)'
  );

  // 2. יתרת סוף החודש החזויה — השורה האחרונה בתזרים.
  sheet.getRange('Z3').setFormula(
    '=IFERROR(INDEX(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""),ROWS(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""))),0)'
  );

  // 3. נקודת השפל ב-30 הימים הקרובים.
  sheet.getRange('Z4').setFormula(
    '=MIN(IFERROR(MIN(FILTER(\'תזרים\'!G$2:G$32,\'תזרים\'!A$2:A$32>=TODAY(),\'תזרים\'!A$2:A$32<=TODAY()+30)),1E+99),IFERROR(MIN(FILTER(\'גאנט תזרים שנתי\'!I$16:I$380,\'גאנט תזרים שנתי\'!A$16:A$380>=TODAY(),\'גאנט תזרים שנתי\'!A$16:A$380<=TODAY()+30)),1E+99))'
  );

  // 4. חשיפה קרובה למסגרות אשראי מאומתות, באחוזים.
  sheet.getRange('Z5').setFormula(
    '=IFERROR(MAX(0,MIN(100,SUM(FILTER(\'כרטיסי אשראי\'!$E$2:$E,\'כרטיסי אשראי\'!$G$2:$G>0))/SUM(FILTER(\'כרטיסי אשראי\'!$G$2:$G,\'כרטיסי אשראי\'!$G$2:$G>0))*100)),0)'
  );

  // 5. התקדמות כרית הביטחון לפי חסכונות נזילים מול היעד בהגדרות B5.
  sheet.getRange('Z6').setFormula(
    '=IFERROR(MAX(0,MIN(100,SUM(\'חסכונות\'!C:C)/\'הגדרות\'!B5*100)),0)'
  );

  // 6. מאזן חודשי לפי מודל התזרים השנתי הקיים.
  sheet.getRange('Z7').setFormula(
    '=IFERROR(\'גאנט תזרים שנתי\'!B5+\'גאנט תזרים שנתי\'!B7-\'גאנט תזרים שנתי\'!B9,0)'
  );

  sheet.getRange('Z2:Z4').setNumberFormat('#,##0 ₪');
  sheet.getRange('Z5:Z6').setNumberFormat('0.0');
  sheet.getRange('Z7').setNumberFormat('#,##0 ₪');
}

/**
 * יצירת ששת השעונים.
 */
function createDashboardV53Gauges_() {
  const sheet = getDashboardV53Sheet_();

  insertGaugeV53_(sheet, {
    title: '🏦 יתרת עו״ש',
    range: 'Y1:Z2',
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

  insertGaugeV53_(sheet, {
    title: '📅 סוף חודש צפוי',
    range: 'Y1:Y1',
    valueCell: 'Z3',
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

  insertGaugeV53_(sheet, {
    title: '📉 שפל 30 יום',
    range: 'Y1:Y1',
    valueCell: 'Z4',
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

  insertGaugeV53_(sheet, {
    title: '💳 חשיפת אשראי',
    range: 'Y1:Y1',
    valueCell: 'Z5',
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

  insertGaugeV53_(sheet, {
    title: '🛟 כרית ביטחון',
    range: 'Y1:Y1',
    valueCell: 'Z6',
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

  insertGaugeV53_(sheet, {
    title: '📊 מאזן חודשי — מודל',
    range: 'Y1:Y1',
    valueCell: 'Z7',
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
function insertGaugeV53_(sheet, cfg) {
  let builder = sheet.newChart()
    .setChartType(Charts.ChartType.GAUGE)
    .setPosition(cfg.row, cfg.col, 0, 0)
    .setOption('title', cfg.title)
    .setOption('min', cfg.min)
    .setOption('max', cfg.max)
    .setOption('minorTicks', 5)
    .setOption('width', 330)
    .setOption('height', 225)
    .setOption('majorTicks', cfg.majorTicks || []);

  if (cfg.valueCell) {
    // כותרת + תא ערך שאינם צמודים: בונים טווח זמני דו-תאי באזור העזר.
    const helper = getNextGaugeHelperPairV53_(sheet, cfg.title, cfg.valueCell);
    builder = builder.addRange(helper);
  } else {
    builder = builder.addRange(sheet.getRange(cfg.range));
  }

  if (cfg.greenFrom !== undefined) builder.setOption('greenFrom', cfg.greenFrom);
  if (cfg.greenTo !== undefined) builder.setOption('greenTo', cfg.greenTo);
  if (cfg.yellowFrom !== undefined) builder.setOption('yellowFrom', cfg.yellowFrom);
  if (cfg.yellowTo !== undefined) builder.setOption('yellowTo', cfg.yellowTo);
  if (cfg.redFrom !== undefined) builder.setOption('redFrom', cfg.redFrom);
  if (cfg.redTo !== undefined) builder.setOption('redTo', cfg.redTo);

  sheet.insertChart(builder.build());
}

/**
 * יוצר זוג כותרת/ערך באזור עזר נוסף AA:AB עבור כל Gauge.
 */
function getNextGaugeHelperPairV53_(sheet, title, sourceCell) {
  const startCol = 27; // AA
  const index = sheet.getCharts().length + 1;
  const row = index * 2;

  sheet.getRange(row, startCol).setValue(title);
  sheet.getRange(row, startCol + 1).setFormula('=' + sourceCell);
  sheet.hideColumns(startCol, 2);

  return sheet.getRange(row, startCol, 1, 2);
}

/**
 * מחיקת הדשבורד הנקי והשארת גיליון ריק.
 */
function clearCleanDashboardV53() {
  const sheet = getDashboardV53Sheet_();
  sheet.getCharts().forEach(chart => sheet.removeChart(chart));
  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.setHiddenGridlines(true);

  SpreadsheetApp.openById(DASHBOARD_V53.SPREADSHEET_ID).toast(
    'לוח המחוונים נוקה',
    'רואה חשבון',
    5
  );
}

/**
 * איתור גיליון לוח המחוונים לפי Sheet ID.
 */
function getDashboardV53Sheet_() {
  const ss = SpreadsheetApp.openById(DASHBOARD_V53.SPREADSHEET_ID);
  const sheet = ss.getSheets().find(s => s.getSheetId() === DASHBOARD_V53.DASHBOARD_SHEET_ID);

  if (!sheet) {
    throw new Error('לא נמצא גיליון לוח מחוונים לפי Sheet ID: ' + DASHBOARD_V53.DASHBOARD_SHEET_ID);
  }

  return sheet;
}
