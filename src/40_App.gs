/** Public entry points, orchestration, menus and triggers. */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💼 רואה חשבון')
    .addItem('🔄 סנכרון RiseUp עכשיו', 'runV5Now')
    .addItem('📚 סנכרון 12 חודשים', 'syncRiseUpHistory12MonthsV5')
    .addSeparator()
    .addItem('🏦 עדכון יתרת עו״ש מאומתת', 'promptVerifiedBankBalanceV5')
    .addItem('🧮 רענון תחזיות וחישובים', 'refreshForecastsV5')
    .addSeparator()
    .addSubMenu(ui.createMenu('🎛 לוח מחוונים')
      .addItem('📊 מעבר ללוח מחוונים', 'openDashboardV5')
      .addItem('🎯 התקנת / רענון שעונים', 'installDashboardGaugesV5')
      .addItem('🗑 הסרת שעונים', 'uninstallDashboardGaugesV5'))
    .addSeparator()
    .addItem('🩺 בדיקת מערכת', 'healthCheckV5')
    .addItem('🔍 בדיקת כפילויות', 'checkDuplicatesV5')
    .addItem('✅ סריקת סטטוסי אימות', 'scanVerificationStatusV5')
    .addItem('ℹ️ סטטוס מערכת', 'showSystemStatusV5')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ הגדרות מערכת')
      .addItem('🛠 התקנת / שדרוג V5.3', 'setupV5')
      .addItem('⏰ התקנת סנכרון שעתי', 'installHourlyTriggerV5')
      .addItem('🗑 מחיקת טריגר V5', 'deleteV5Triggers'))
    .addToUi();
}

function onInstall() { onOpen(); }

function setupV5() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('המערכת כרגע בשימוש. נסה שוב בעוד מספר שניות.');
  try {
    validateRequiredSheets_();
    setupTransactionHeaders_();
    setupBudgetHeaders_();
    setupSyncLogHeaders_();
    setConfigParam_('גרסת מערכת', V5.VERSION, '', 'RiseUp Sync ' + V5.VERSION);
    setConfigParam_('מקור עסקאות', 'get_transactions', '', 'RiseUp External API');
    setConfigParam_('מפתח upsert', 'transactionId + fingerprint fallback', '', 'transactionId מפתח ראשי');
    setConfigParam_('חלון סנכרון עסקאות', V5.SAFETY_MONTHS, 'חודשים', 'חודש נוכחי + חודש קודם');
    setConfigParam_('מצב מנוע תחזיות', 'AUTO', '', 'כל נתון חדש מחייב בדיקת השפעה על התחזיות');
    ensureAutomaticBankBalanceFormula_();
    formatSystemSheetsRTL_();
    refreshDuplicateFormulas_(2);
    installDashboardGaugesV5_(false);
    SpreadsheetApp.flush();
    invalidateConfigCache_();
    const health = healthCheckV5_('deep');
    logSync_({ action: 'V5 Setup', status: health.ok ? 'SUCCESS' : 'WARNING', records: 0, message: 'התקנת RiseUp Sync ' + V5.VERSION, syncState: 'SETUP', health: health.summary });
    getSpreadsheet_().toast(V5.VERSION + ' הותקן בהצלחה', 'רואה חשבון', 8);
    return health;
  } finally {
    lock.releaseLock();
  }
}

function syncRiseUpV5() {
  const startedAt = new Date();
  const startMs = Date.now();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    logSync_({ action: 'RiseUp Sync V5', status: 'SKIPPED', records: 0, message: 'סנכרון אחר כבר פעיל', syncState: 'LOCKED' });
    return null;
  }
  const metrics = { inserted:0, updated:0, unchanged:0, duplicates:0, months:[], largeTransactions:[], budgetUpdated:false, tokenRef:'', riseupLastUpdatedAt:'', balanceBefore:'', balanceAfter:'', errors:[] };
  try {
    validateRequiredSheets_();
    const pat = getRiseupPat_();
    metrics.balanceBefore = getAutomaticBankBalance_();
    metrics.months = getSyncMonths_();
    const paths = metrics.months.map(function(month) { return '/api/external/transactions?cashflowMonth=' + encodeURIComponent(month); });
    const responses = riseupGetMany_(paths, pat);
    let allTransactions = [];
    responses.forEach(function(response) {
      if (response && response._meta && response._meta.tokenRef) metrics.tokenRef = response._meta.tokenRef;
      if (response && Array.isArray(response.transactions)) allTransactions = allTransactions.concat(response.transactions);
    });

    const txResult = upsertTransactions_(allTransactions);
    metrics.inserted = txResult.inserted;
    metrics.updated = txResult.updated;
    metrics.unchanged = txResult.unchanged;
    metrics.duplicates = txResult.duplicates;
    metrics.largeTransactions = txResult.largeTransactions;

    const currentMonth = formatMonth_(new Date());
    const budgetResponse = riseupGet_('/api/external/budget/' + encodeURIComponent(currentMonth), pat);
    if (budgetResponse && budgetResponse._meta && budgetResponse._meta.tokenRef) metrics.tokenRef = budgetResponse._meta.tokenRef;
    if (budgetResponse && budgetResponse.lastUpdatedAt) metrics.riseupLastUpdatedAt = new Date(budgetResponse.lastUpdatedAt);
    metrics.budgetUpdated = syncBudget_(currentMonth, budgetResponse);

    setConfigParam_('תאריך רענון אחרון', new Date(), '', 'RiseUp Sync ' + V5.VERSION);
    setConfigParam_('מצב hash', metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED', '', 'Budget hash');
    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();
    invalidateConfigCache_();
    metrics.balanceAfter = getAutomaticBankBalance_();
    const health = healthCheckV5_('quick');

    logSync_({
      time: startedAt, action: 'RiseUp Sync V5', status: health.ok ? 'SUCCESS' : 'WARNING', records: allTransactions.length,
      message: 'חודשים: ' + metrics.months.join(', ') + ' | חדשות: ' + metrics.inserted + ' | עודכנו: ' + metrics.updated + ' | ללא שינוי: ' + metrics.unchanged + ' | כפילויות: ' + metrics.duplicates,
      tokenRef: metrics.tokenRef, riseupLastUpdatedAt: metrics.riseupLastUpdatedAt,
      syncState: metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED', durationMs: Date.now() - startMs,
      inserted: metrics.inserted, updated: metrics.updated, duplicates: metrics.duplicates,
      balanceBefore: metrics.balanceBefore, balanceAfter: metrics.balanceAfter, health: health.summary
    });
    showSyncToast_(metrics, health);
    return { success: health.ok, metrics: metrics, health: health };
  } catch (err) {
    metrics.errors.push(String(err && err.message ? err.message : err));
    logSync_({ time: startedAt, action: 'RiseUp Sync V5', status: 'ERROR', records: 0, message: metrics.errors.join(' | '), durationMs: Date.now() - startMs, inserted: metrics.inserted, updated: metrics.updated, duplicates: metrics.duplicates, balanceBefore: metrics.balanceBefore, balanceAfter: metrics.balanceAfter, health: 'ERROR' });
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
    ui.alert('הסנכרון הסתיים', 'חדשות: ' + result.metrics.inserted + '\nעודכנו: ' + result.metrics.updated + '\nיתרת עו״ש: ' + formatMoney_(result.metrics.balanceAfter) + '\n\n' + result.health.summary, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('שגיאת סנכרון', String(e.message || e), ui.ButtonSet.OK);
    throw e;
  }
}

function syncRiseUpHistory12MonthsV5() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert('סנכרון 12 חודשים', 'הפעולה תמשוך את 12 החודשים האחרונים ותבצע upsert ללא כפילות.\n\nלהמשיך?', ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) { ui.alert('סנכרון אחר כבר פעיל.'); return; }
  const startedAt = new Date();
  try {
    const pat = getRiseupPat_();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      months.push(formatMonth_(d));
    }
    const paths = months.map(function(month) { return '/api/external/transactions?cashflowMonth=' + encodeURIComponent(month); });
    const responses = riseupGetMany_(paths, pat);
    let allTransactions = [];
    const monthStats = [];
    responses.forEach(function(response, index) {
      const transactions = response && Array.isArray(response.transactions) ? response.transactions : [];
      allTransactions = allTransactions.concat(transactions);
      monthStats.push(months[index] + ': ' + transactions.length);
    });
    const result = upsertTransactions_(allTransactions);
    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();
    invalidateConfigCache_();
    const health = healthCheckV5_('quick');
    logSync_({ time: startedAt, action: 'RiseUp History 12M V5', status: health.ok ? 'SUCCESS' : 'WARNING', records: allTransactions.length, message: monthStats.join(' | '), syncState: 'HISTORY_BACKFILL', inserted: result.inserted, updated: result.updated, duplicates: result.duplicates, balanceAfter: getAutomaticBankBalance_(), health: health.summary });
    ui.alert('הסנכרון ההיסטורי הסתיים', 'סה״כ התקבלו: ' + allTransactions.length + '\nחדשות: ' + result.inserted + '\nעודכנו: ' + result.updated + '\nללא שינוי: ' + result.unchanged, ui.ButtonSet.OK);
  } finally {
    lock.releaseLock();
  }
}

function openDashboardV5() {
  const ss = getSpreadsheet_();
  const sheet = getSheetById_(V5.SHEETS.DASHBOARD);
  ss.setActiveSheet(sheet);
  sheet.getRange('A1').activate();
}

function showSystemStatusV5() {
  const health = healthCheckV5_('quick');
  SpreadsheetApp.getUi().alert('סטטוס מערכת', 'גרסה: ' + V5.VERSION + '\nPAT: ' + (PropertiesService.getScriptProperties().getProperty('RISEUP_PAT') ? '✅ מוגדר' : '❌ חסר') + '\nיתרת עו״ש: ' + formatMoney_(getAutomaticBankBalance_()) + '\n\n' + health.summary, SpreadsheetApp.getUi().ButtonSet.OK);
}

function installHourlyTriggerV5() {
  deleteV5Triggers();
  ScriptApp.newTrigger('syncRiseUpV5').timeBased().everyHours(1).create();
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
