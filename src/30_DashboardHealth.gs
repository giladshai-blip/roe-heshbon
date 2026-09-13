/** Dashboard and health-check services. */
function installDashboardGaugesV5() { installDashboardGaugesV5_(true); }

function installDashboardGaugesV5_(showMessage) {
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);
  removeDashboardGaugeChartsV5_();
  buildGaugeHelperDataV5_();
  createCreditExposureGaugeV5_(sheet);
  createEmergencyFundGaugeV5_(sheet);
  createMonthlyBalanceGaugeV5_(sheet);
  createThirtyDayLowGaugeV5_(sheet);
  SpreadsheetApp.flush();
  if (showMessage !== false) getSpreadsheet_().toast('4 שעונים נוספו ללוח המחוונים', '🎛 רואה חשבון', 8);
}

function buildGaugeHelperDataV5_() {
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);
  sheet.getRange('Y1:Z20').clearContent();
  sheet.getRange('Y2:Z3').setValues([['מדד','ערך'],['חשיפת אשראי','']]);
  sheet.getRange('Z3').setFormula('=IFERROR(MAX(0,MIN(100,$B$27*100)),0)');
  sheet.getRange('Y5:Z6').setValues([['מדד','ערך'],['כרית ביטחון','']]);
  sheet.getRange('Z6').setFormula('=IFERROR(MAX(0,MIN(100,$B$21/\'הגדרות\'!$B$5*100)),0)');
  sheet.getRange('Y8:Z9').setValues([['מדד','ערך'],['מאזן חודשי','']]);
  sheet.getRange('Z9').setFormula('=IFERROR($B$23,0)');
  sheet.getRange('Y11:Z12').setValues([['מדד','ערך'],['שפל 30 יום','']]);
  sheet.getRange('Z12').setFormula('=IFERROR($B$17,0)');
}

function createCreditExposureGaugeV5_(sheet) {
  const chart = sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y2:Z3')).setPosition(2,12,0,0)
    .setOption('title','💳 חשיפת אשראי').setOption('min',0).setOption('max',100).setOption('greenFrom',0).setOption('greenTo',30)
    .setOption('yellowFrom',30).setOption('yellowTo',50).setOption('redFrom',50).setOption('redTo',100)
    .setOption('minorTicks',5).setOption('width',350).setOption('height',220).build();
  sheet.insertChart(chart);
}

function createEmergencyFundGaugeV5_(sheet) {
  const chart = sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y5:Z6')).setPosition(2,18,0,0)
    .setOption('title','🛟 כרית ביטחון').setOption('min',0).setOption('max',100).setOption('redFrom',0).setOption('redTo',25)
    .setOption('yellowFrom',25).setOption('yellowTo',70).setOption('greenFrom',70).setOption('greenTo',100)
    .setOption('minorTicks',5).setOption('width',350).setOption('height',220).build();
  sheet.insertChart(chart);
}

function createMonthlyBalanceGaugeV5_(sheet) {
  const chart = sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y8:Z9')).setPosition(15,12,0,0)
    .setOption('title','📊 מאזן חודשי').setOption('min',-5000).setOption('max',5000).setOption('redFrom',-5000).setOption('redTo',0)
    .setOption('yellowFrom',0).setOption('yellowTo',1500).setOption('greenFrom',1500).setOption('greenTo',5000)
    .setOption('minorTicks',5).setOption('width',350).setOption('height',220).build();
  sheet.insertChart(chart);
}

function createThirtyDayLowGaugeV5_(sheet) {
  const chart = sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y11:Z12')).setPosition(15,18,0,0)
    .setOption('title','📉 שפל צפוי — 30 יום').setOption('min',-40000).setOption('max',30000).setOption('redFrom',-40000).setOption('redTo',0)
    .setOption('yellowFrom',0).setOption('yellowTo',20000).setOption('greenFrom',20000).setOption('greenTo',30000)
    .setOption('minorTicks',5).setOption('width',350).setOption('height',220).build();
  sheet.insertChart(chart);
}

function removeDashboardGaugeChartsV5_() {
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);
  sheet.getCharts().forEach(function(chart) {
    const info = chart.getContainerInfo();
    if (info.getAnchorColumn() >= 12) sheet.removeChart(chart);
  });
}

function uninstallDashboardGaugesV5() {
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);
  removeDashboardGaugeChartsV5_();
  sheet.getRange('Y1:Z20').clearContent();
  getSpreadsheet_().toast('השעונים הוסרו', 'רואה חשבון', 5);
}

function scanVerificationStatusV5() {
  const sheet = getSheetById_(V5.SHEETS.VERIFICATION);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { SpreadsheetApp.getUi().alert('אין נתוני אימות.'); return []; }
  const values = sheet.getRange(2, 1, lastRow - 1, Math.min(sheet.getLastColumn(), 10)).getDisplayValues();
  const patterns = ['דורש רענון','לא מאומת','סותר','פתוח','חסר','חלקי','טרם אומת'];
  const openRows = [];
  values.forEach(function(row, index) {
    const text = row.join(' | ');
    if (patterns.some(function(pattern) { return text.indexOf(pattern) !== -1; })) openRows.push(index + 2);
  });
  SpreadsheetApp.getUi().alert('סריקת אימות', openRows.length === 0 ? '✅ לא נמצאו פריטים פתוחים.' : 'נמצאו ' + openRows.length + ' פריטים הדורשים טיפול או רענון.', SpreadsheetApp.getUi().ButtonSet.OK);
  return openRows;
}

function healthCheckV5() {
  const result = healthCheckV5_('deep');
  SpreadsheetApp.getUi().alert(result.ok ? '🟢 Health Check תקין' : '🟡 Health Check', result.summary, SpreadsheetApp.getUi().ButtonSet.OK);
  return result;
}

function healthCheckV5_(mode) {
  mode = mode || 'quick';
  const issues = [];
  try { validateRequiredSheets_(); } catch (e) { issues.push(String(e.message || e)); }
  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');
  if (!pat || !pat.startsWith('riseup_pat_')) issues.push('PAT חסר או לא תקין');
  const balance = getAutomaticBankBalance_();
  if (balance === '' || balance === null || isNaN(Number(balance))) issues.push('אין יתרת עו"ש מחושבת תקינה');
  const formulaErrors = mode === 'deep' ? findFormulaErrors_() : [];
  if (formulaErrors.length > 0) issues.push('נמצאו ' + formulaErrors.length + ' שגיאות נוסחה');
  const ok = issues.length === 0;
  return {
    ok: ok,
    mode: mode,
    issues: issues,
    balance: balance,
    formulaErrors: formulaErrors,
    summary: ok ? '🟢 המערכת תקינה\n\nיתרת עו״ש מחושבת: ' + formatMoney_(balance) : '🟡 נמצאו נקודות לבדיקה:\n\n• ' + issues.join('\n• ')
  };
}

function findFormulaErrors_() {
  const ids = [V5.SHEETS.DASHBOARD, V5.SHEETS.ANNUAL_CASHFLOW, V5.SHEETS.FIVE_YEAR_PLAN, V5.SHEETS.CONFIG];
  const errors = [];
  const pattern = /#REF!|#N\/A|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#ERROR!/;
  ids.forEach(function(id) {
    const sheet = getSheetById_(id);
    const rows = Math.min(Math.max(sheet.getLastRow(), 1), 500);
    const cols = Math.min(Math.max(sheet.getLastColumn(), 1), 30);
    const values = sheet.getRange(1, 1, rows, cols).getDisplayValues();
    values.forEach(function(row, r) {
      row.forEach(function(value, c) {
        if (pattern.test(String(value))) errors.push({ sheet: sheet.getName(), cell: columnToLetter_(c + 1) + (r + 1), value: value });
      });
    });
  });
  return errors;
}

function formatSystemSheetsRTL_() {
  getSpreadsheet_().getSheets().forEach(function(sheet) {
    try {
      sheet.setRightToLeft(true);
      const rows = Math.max(sheet.getLastRow(), 1);
      const cols = Math.max(sheet.getLastColumn(), 1);
      sheet.getRange(1, 1, rows, cols).setHorizontalAlignment('right');
    } catch (e) {
      console.log('RTL warning: ' + sheet.getName());
    }
  });
}
