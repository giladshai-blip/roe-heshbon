/**
 * ============================================================
 * רואה חשבון — Accountant UI V1.0
 * ============================================================
 * שכבת UI לא פולשנית מעל Core/Dashboard/Automation Engine.
 * - תפריט רואה חשבון מסודר לפי תחומי פעולה.
 * - Wrapper functions בלבד; הלוגיקה העסקית נשארת ברכיבים הקיימים.
 * - אזור התראות בדשבורד שמבוסס ישירות על גיליון "התראות מערכת".
 * - אין שינוי במקורות האמת הפיננסיים ואין ספירה כפולה.
 * ============================================================
 */

const ACCOUNTANT_UI = {
  VERSION: 'V1.0',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  DASHBOARD: 'לוח מחוונים',
  ALERTS: 'התראות מערכת',
  AUTOMATION_LOG: 'יומן אוטומציות'
};

/**
 * התקנה חד-פעמית של שכבת הממשק.
 * מתקין trigger לפתיחת הקובץ, בונה את התפריט ומרענן את הדשבורד עם אזור ההתראות.
 */
function setupAccountantUIV1() {
  installAccountantUIOpenTriggerV1();
  buildAccountantMenuV1_();
  refreshDashboardWithAlertsV1();
  SpreadsheetApp.openById(ACCOUNTANT_UI.SPREADSHEET_ID)
    .toast('תפריט רואה חשבון ואזור ההתראות הותקנו', 'רואה חשבון', 7);
  return true;
}

function installAccountantUIOpenTriggerV1() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onOpenAccountantUIV1') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('onOpenAccountantUIV1')
    .forSpreadsheet(ACCOUNTANT_UI.SPREADSHEET_ID)
    .onOpen()
    .create();
  return true;
}

function deleteAccountantUIOpenTriggerV1() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onOpenAccountantUIV1') ScriptApp.deleteTrigger(trigger);
  });
}

function onOpenAccountantUIV1() {
  buildAccountantMenuV1_();
}

function buildAccountantMenuV1_() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('💼 רואה חשבון');

  menu.addSubMenu(
    ui.createMenu('🏠 מצב פיננסי')
      .addItem('📊 מעבר ללוח מחוונים', 'uiOpenDashboardV1')
      .addItem('ℹ️ סטטוס מערכת', 'showSystemStatusV5')
      .addItem('🧮 רענון תחזיות וחישובים', 'refreshForecastsV5')
      .addItem('🏦 עדכון יתרת עו״ש מאומתת', 'promptVerifiedBankBalanceV5')
  );

  menu.addSubMenu(
    ui.createMenu('🔄 סנכרון ונתונים')
      .addItem('🔄 סנכרון RiseUp עכשיו', 'runV5Now')
      .addItem('📚 סנכרון 12 חודשים', 'syncRiseUpHistory12MonthsV5')
      .addItem('✅ סריקת סטטוסי אימות', 'scanVerificationStatusV5')
  );

  menu.addSubMenu(
    ui.createMenu('🤖 אוטומציות')
      .addItem('▶️ הרצת Automation Engine', 'uiRunAutomationEngineV1')
      .addItem('🛠 התקנה / שדרוג Automation Engine', 'uiSetupAutomationEngineV101')
      .addSeparator()
      .addItem('🚨 מעבר להתראות מערכת', 'uiOpenAlertsV1')
      .addItem('📜 מעבר ליומן אוטומציות', 'uiOpenAutomationLogV1')
  );

  menu.addSubMenu(
    ui.createMenu('🩺 בדיקות ובקרה')
      .addItem('🩺 Health Check', 'healthCheckV5')
      .addItem('🔍 בדיקת כפילויות', 'checkDuplicatesV5')
      .addItem('🔗 בדיקת תכנון מול ביצוע', 'uiRunAutomationEngineV1')
  );

  menu.addSubMenu(
    ui.createMenu('📊 לוח מחוונים')
      .addItem('📊 מעבר ללוח', 'uiOpenDashboardV1')
      .addItem('🔃 רענון לוח + התראות', 'refreshDashboardWithAlertsV1')
      .addItem('🧹 ניקוי הדשבורד', 'clearDashboardV56')
  );

  menu.addSubMenu(
    ui.createMenu('⚙️ תחזוקה והגדרות')
      .addItem('🛠 התקנת / שדרוג Core V5.6.3', 'setupV56')
      .addItem('⏰ התקנת סנכרון RiseUp שעתי', 'installHourlyTriggerV5')
      .addItem('🗑 מחיקת טריגר RiseUp', 'deleteV5Triggers')
      .addSeparator()
      .addItem('🧩 התקנת תפריט רואה חשבון', 'setupAccountantUIV1')
  );

  menu.addToUi();
}

function uiRunAutomationEngineV1() {
  if (typeof runAutomationEngineV1 !== 'function') {
    throw new Error('AutomationEngine.gs אינו מותקן בפרויקט Apps Script.');
  }
  const result = runAutomationEngineV1();
  SpreadsheetApp.flush();
  renderDashboardAlertsV1();
  SpreadsheetApp.getUi().alert(
    'Automation Engine',
    'הריצה הסתיימה בסטטוס: ' + String(result && result.status ? result.status : 'לא ידוע'),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return result;
}

function uiSetupAutomationEngineV101() {
  if (typeof setupAutomationEngineV101 !== 'function') {
    throw new Error('AutomationEngine.gs V1.0.1 אינו מותקן בפרויקט Apps Script.');
  }
  const result = setupAutomationEngineV101();
  SpreadsheetApp.flush();
  renderDashboardAlertsV1();
  return result;
}

function refreshDashboardWithAlertsV1() {
  if (typeof installDashboardV56 !== 'function') {
    throw new Error('Dashboard.gs אינו מותקן בפרויקט Apps Script.');
  }
  installDashboardV56();
  SpreadsheetApp.flush();
  renderDashboardAlertsV1();
  return true;
}

function uiOpenDashboardV1() {
  const ss = SpreadsheetApp.openById(ACCOUNTANT_UI.SPREADSHEET_ID);
  const sh = ss.getSheetByName(ACCOUNTANT_UI.DASHBOARD);
  if (!sh) throw new Error('לא נמצא גיליון לוח מחוונים.');
  ss.setActiveSheet(sh);
  renderDashboardAlertsV1();
  sh.getRange('A1').activate();
}

function uiOpenAlertsV1() {
  return uiOpenSheetByNameV1_(ACCOUNTANT_UI.ALERTS);
}

function uiOpenAutomationLogV1() {
  return uiOpenSheetByNameV1_(ACCOUNTANT_UI.AUTOMATION_LOG);
}

function uiOpenSheetByNameV1_(name) {
  const ss = SpreadsheetApp.openById(ACCOUNTANT_UI.SPREADSHEET_ID);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('לא נמצא גיליון: ' + name);
  ss.setActiveSheet(sh);
  sh.getRange('A1').activate();
  return true;
}

/**
 * מציג בדשבורד התראות פתוחות בלבד.
 * מקור הנתונים היחיד נשאר גיליון "התראות מערכת"; הדשבורד הוא שכבת תצוגה בלבד.
 */
function renderDashboardAlertsV1() {
  const ss = SpreadsheetApp.openById(ACCOUNTANT_UI.SPREADSHEET_ID);
  const dash = ss.getSheetByName(ACCOUNTANT_UI.DASHBOARD);
  const alerts = ss.getSheetByName(ACCOUNTANT_UI.ALERTS);
  if (!dash) throw new Error('לא נמצא גיליון לוח מחוונים.');

  ensureDashboardAlertGridV1_(dash);
  clearDashboardAlertAreaV1_(dash);

  dash.getRange('A31:P31').merge();
  dash.getRange('A31').setValue('🚨 התראות פעילות')
    .setBackground('#DCEAF7')
    .setFontColor('#16324F')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('right');

  if (!alerts || alerts.getLastRow() < 2) {
    dash.getRange('A32:P34').merge();
    dash.getRange('A32').setValue('אין כרגע התראות מערכת פעילות.')
      .setBackground('#ECF8F0')
      .setFontColor('#2B3A48')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    return {open: 0, critical: 0, warning: 0};
  }

  const rows = alerts.getRange(2,1,alerts.getLastRow()-1,10).getValues()
    .filter(function(r){ return String(r[8] || '').trim() === 'פתוח'; })
    .sort(function(a,b){
      const rank = {'🔴':0,'🟡':1,'🟢':2};
      const ra = rank[String(a[2] || '').trim()] == null ? 9 : rank[String(a[2] || '').trim()];
      const rb = rank[String(b[2] || '').trim()] == null ? 9 : rank[String(b[2] || '').trim()];
      if (ra !== rb) return ra - rb;
      const da = a[9] instanceof Date ? a[9].getTime() : 0;
      const db = b[9] instanceof Date ? b[9].getTime() : 0;
      return db - da;
    });

  const critical = rows.filter(function(r){ return String(r[2] || '').indexOf('🔴') !== -1; }).length;
  const warning = rows.filter(function(r){ return String(r[2] || '').indexOf('🟡') !== -1; }).length;

  dash.getRange('A32:P32').merge();
  dash.getRange('A32').setValue('פתוחות: ' + rows.length + '   |   🔴 קריטיות: ' + critical + '   |   🟡 אזהרות: ' + warning)
    .setBackground(critical ? '#FDECEC' : warning ? '#FFF7E6' : '#ECF8F0')
    .setFontColor('#2B3A48')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  const display = rows.slice(0,5);
  let row = 34;
  display.forEach(function(item, index){
    const severity = String(item[2] || '').trim();
    const category = String(item[3] || '').trim();
    const title = String(item[4] || '').trim();
    const detail = String(item[5] || '').trim();
    const relevant = item[7] instanceof Date
      ? Utilities.formatDate(item[7], 'Asia/Jerusalem', 'dd/MM/yyyy')
      : String(item[7] || '').trim();

    dash.getRange(row,1,1,2).merge();
    dash.getRange(row,3,1,4).merge();
    dash.getRange(row,7,1,10).merge();
    dash.getRange(row,1).setValue(severity || '•').setFontWeight('bold').setHorizontalAlignment('center');
    dash.getRange(row,3).setValue(category + (relevant ? ' | ' + relevant : '')).setFontWeight('bold');
    dash.getRange(row,7).setValue(title + (detail ? ' — ' + detail : '')).setWrap(true);
    dash.getRange(row,1,1,16)
      .setBackground(severity.indexOf('🔴') !== -1 ? '#FDECEC' : severity.indexOf('🟡') !== -1 ? '#FFF7E6' : '#FFFFFF')
      .setFontColor('#2B3A48')
      .setVerticalAlignment('middle')
      .setBorder(false,false,true,false,false,false,'#E3E8ED',SpreadsheetApp.BorderStyle.SOLID);
    row++;
  });

  if (rows.length > display.length) {
    dash.getRange(row,1,1,16).merge();
    dash.getRange(row,1).setValue('ועוד ' + (rows.length - display.length) + ' התראות — לפירוט מלא: 💼 רואה חשבון → 🤖 אוטומציות → מעבר להתראות מערכת')
      .setFontColor('#536273')
      .setFontSize(9)
      .setHorizontalAlignment('center');
  }

  return {open: rows.length, critical: critical, warning: warning};
}

function ensureDashboardAlertGridV1_(sheet) {
  if (sheet.getMaxRows() < 40) sheet.insertRowsAfter(sheet.getMaxRows(), 40 - sheet.getMaxRows());
  if (sheet.getMaxColumns() < 16) sheet.insertColumnsAfter(sheet.getMaxColumns(), 16 - sheet.getMaxColumns());
  for (let r=31; r<=40; r++) sheet.setRowHeight(r, 32);
}

function clearDashboardAlertAreaV1_(sheet) {
  const range = sheet.getRange('A31:P40');
  range.getMergedRanges().forEach(function(r){ r.breakApart(); });
  range.clearContent();
  range.clearFormat();
  range.setHorizontalAlignment('right');
}
