/**
 * ============================================================
 * רואה חשבון — User Actions — dev-1.1.0
 * ============================================================
 * שכבת פונקציות ידידותית למשתמש.
 *
 * כל פונקציה בקובץ זה היא שם קנוני ללא מספר גרסה.
 * הפונקציות הישנות נשארות מאחור כתאימות בלבד עד להעברת כל הטריגרים.
 * ============================================================
 */

const USER_RELEASE = Object.freeze({
  CHANNEL: 'dev',
  VERSION: 'dev-1.1.0',
  PROMOTION_TARGET: 'core-1.1.0',
  APPROVED_CORE: 'core-1.0.0'
});

function installSystem() {
  return setupV56();
}

function syncNow() {
  return runV5Now();
}

function syncHistory12Months() {
  return syncRiseUpHistory12MonthsV5();
}

function updateBankBalance() {
  return promptVerifiedBankBalanceV5();
}

function refreshForecasts() {
  return refreshForecastsV5();
}

function checkSystemHealth() {
  return healthCheckV5();
}

function runSystemDiagnostics() {
  return runRuntimeSelfTestV57();
}

function checkDuplicateTransactions() {
  return checkDuplicatesV5();
}

function reviewDataVerification() {
  return scanVerificationStatusV5();
}

function showSystemStatus() {
  const health = healthCheckV56_();
  const sync = getConfigParam_('תאריך רענון אחרון');
  const anchor = getConfigParam_('תאריך ושעת יתרת עו״ש');
  const legacyCore = (typeof V56 !== 'undefined' && V56.VERSION) ? V56.VERSION : 'לא זמין';
  const legacyDashboard = (typeof DASHBOARD_V56 !== 'undefined' && DASHBOARD_V56.VERSION) ? DASHBOARD_V56.VERSION : 'לא זמין';
  const text = [
    'גרסה פעילה: ' + USER_RELEASE.VERSION,
    'גרסה מאושרת: ' + USER_RELEASE.APPROVED_CORE,
    'יעד קידום: ' + USER_RELEASE.PROMOTION_TARGET,
    '',
    'סנכרון אחרון: ' + formatDateTime_(sync),
    'אימות עו״ש: ' + formatDateTime_(anchor),
    '',
    health.summary,
    '',
    'Legacy Build IDs — תאימות בלבד:',
    'Core: ' + legacyCore,
    'Dashboard: ' + legacyDashboard
  ].join('\n');
  SpreadsheetApp.getUi().alert('מצב מערכת — ' + USER_RELEASE.VERSION, text, SpreadsheetApp.getUi().ButtonSet.OK);
  return { version: USER_RELEASE.VERSION, health: health, text: text };
}

function openDashboard() {
  return openDashboardV5();
}

function enableAutomaticSync() {
  return installRiseupSyncTriggerV5();
}

function disableAutomaticSync() {
  deleteV5Triggers();
  const count = typeof getRiseupSyncTriggerCount_ === 'function' ? getRiseupSyncTriggerCount_() : null;
  if (count !== null && count !== 0) throw new Error('לא כל טריגרי הסנכרון הוסרו. נמצאו: ' + count);
  getSpreadsheet_().toast('הסנכרון האוטומטי בוטל', 'רואה חשבון', 5);
  return { ok: true, triggerCount: count };
}

function reconcilePlannedCashflow() {
  return runPlannedReconciliationV59();
}

function buildDashboard() {
  return installDashboardV56();
}

function refreshDashboard() {
  return refreshDashboardV56();
}

function resetDashboard() {
  return clearDashboardV56();
}

function updateRiseUpToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'עדכון חיבור RiseUp',
    'הדבק את ה־PAT של RiseUp. המפתח נשמר רק ב־Script Properties ולא ב־GitHub.',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return { ok: false, cancelled: true };
  const token = String(response.getResponseText() || '').trim();
  setRiseupPatV5(token);
  ui.alert('חיבור RiseUp', 'המפתח נשמר בהצלחה.', ui.ButtonSet.OK);
  return { ok: true };
}

function clearRiseUpToken() {
  clearRiseupPatV5();
  getSpreadsheet_().toast('מפתח RiseUp נמחק מ־Script Properties', 'רואה חשבון', 5);
  return { ok: true };
}

function updateWixApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'עדכון חיבור Wix',
    'הדבק את Wix API Key. המפתח נשמר רק ב־Script Properties ולא ב־GitHub.',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return { ok: false, cancelled: true };
  const key = String(response.getResponseText() || '').trim();
  setWixApiKeyV1(key);
  ui.alert('חיבור Wix', 'המפתח נשמר בהצלחה.', ui.ButtonSet.OK);
  return { ok: true };
}

function clearWixApiKey() {
  return clearWixApiKeyV1();
}

function syncWixNow() {
  return runSyncWixSnapshotV1();
}

function showReleaseInfo() {
  const legacyCore = (typeof V56 !== 'undefined' && V56.VERSION) ? V56.VERSION : 'לא זמין';
  const legacyDashboard = (typeof DASHBOARD_V56 !== 'undefined' && DASHBOARD_V56.VERSION) ? DASHBOARD_V56.VERSION : 'לא זמין';
  const legacyWix = (typeof WIX_SYNC_V1 !== 'undefined' && WIX_SYNC_V1.VERSION) ? WIX_SYNC_V1.VERSION : 'לא זמין';
  const info = {
    version: USER_RELEASE.VERSION,
    channel: USER_RELEASE.CHANNEL,
    promotionTarget: USER_RELEASE.PROMOTION_TARGET,
    approvedCore: USER_RELEASE.APPROVED_CORE,
    legacyBuildIds: {
      core: legacyCore,
      dashboard: legacyDashboard,
      wix: legacyWix
    }
  };
  const text = [
    'גרסה פעילה: ' + info.version,
    'ערוץ: ' + info.channel,
    'יעד קידום: ' + info.promotionTarget,
    'גרסה מאושרת: ' + info.approvedCore,
    '',
    'Build IDs ישנים — תאימות בלבד:',
    'Core: ' + legacyCore,
    'Dashboard: ' + legacyDashboard,
    'Wix: ' + legacyWix
  ].join('\n');
  SpreadsheetApp.getUi().alert('גרסת מערכת', text, SpreadsheetApp.getUi().ButtonSet.OK);
  return info;
}
