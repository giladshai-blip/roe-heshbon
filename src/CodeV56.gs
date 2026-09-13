/**
 * ============================================================
 * רואה חשבון — Core V5.6
 * ============================================================
 * קובץ מלא להחלפת Code.gs ב-Google Apps Script.
 *
 * עיקרי V5.6:
 * - Health Check סמנטי, לא רק בדיקת #REF.
 * - ביטול תלות של תחזיות בדשבורד.
 * - מקור יחיד ליעד כרית ביטחון: גיליון יעדים.
 * - firstSeenAt לעסקאות, כדי לטפל נכון בעסקאות date-only ביום העוגן.
 * - Budget envelopeId תומך גם id וגם envelopeId.
 * - שמירת כותרות יומן קיימות והרחבה ללא דריסה היסטורית.
 * - גרסאות Core/Dashboard נפרדות עד הפצה מלאה.
 * - תאימות לשמות פונקציות V5/V5.4 קיימים.
 * ============================================================
 */

const V56 = {
  VERSION: 'V5.6',
  DASHBOARD_VERSION: 'V5.6',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  API_BASE: 'https://input.riseup.co.il',
  SAFETY_MONTHS: 2,
  LARGE_TRANSACTION_ALERT: 2000,
  MAX_RETRIES: 4,
  INITIAL_RETRY_MS: 1000,
  SHEET_NAMES: {
    DASHBOARD: 'לוח מחוונים',
    PLANNED_CASHFLOW: 'תזרים מתוכנן',
    TRANSACTIONS: 'תנועות',
    ANNUAL_CASHFLOW: 'גאנט תזרים שנתי',
    BUDGET: 'תקציב',
    CASHFLOW: 'תזרים',
    CREDIT_CARDS: 'כרטיסי אשראי',
    LOANS: 'הלוואות',
    SAVINGS: 'חסכונות',
    GOALS: 'יעדים',
    RULES: 'כללים',
    CONFIG: 'הגדרות',
    SYNC_LOG: 'יומן סנכרון',
    VERIFICATION: 'אימות נתונים',
    FIVE_YEAR_PLAN: 'תוכנית 5 שנים'
  },
  TRANSACTION_HEADERS: [
    'transactionId','transactionDate','cashflowMonth','businessName','categoryLabel',
    'amount','direction','sourceType','source','accountNickname','accountNumberHash',
    'billingDate','isInstallment','installmentNumber','totalInstallments','isPostponed',
    'commitmentId','actualType','categoryType','lastSyncedAt','firstSeenAt'
  ],
  BUDGET_HEADERS: [
    'budgetDate','envelopeId','type','originalAmount','balancedAmount',
    'balanceDate','lastUpdatedAt','cashflowHash','rawData'
  ],
  LOG_HEADERS: [
    'זמן','פעולה','סטטוס','מספר רשומות','הודעה','cashflowHash','RiseUp lastUpdatedAt',
    'מצב סנכרון','X-Riseup-Token-Ref','משך_ms','חדשות','עודכנו','כפילויות',
    'יתרה לפני','יתרה אחרי','Health Check'
  ]
};

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💼 רואה חשבון')
    .addItem('🔄 סנכרון RiseUp עכשיו', 'runV5Now')
    .addItem('📚 סנכרון 12 חודשים', 'syncRiseUpHistory12MonthsV5')
    .addSeparator()
    .addItem('🏦 עדכון יתרת עו״ש מאומתת', 'promptVerifiedBankBalanceV5')
    .addItem('🧮 רענון תחזיות וחישובים', 'refreshForecastsV5')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('📊 לוח מחוונים')
        .addItem('מעבר ללוח מחוונים', 'openDashboardV5')
        .addItem('התקנה / רענון V5.6', 'installDashboardV56')
        .addItem('ניקוי הדשבורד', 'clearDashboardV56')
    )
    .addSeparator()
    .addItem('🩺 בדיקת מערכת V5.6', 'healthCheckV5')
    .addItem('🔍 בדיקת כפילויות', 'checkDuplicatesV5')
    .addItem('✅ סריקת סטטוסי אימות', 'scanVerificationStatusV5')
    .addItem('ℹ️ סטטוס מערכת', 'showSystemStatusV5')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('⚙️ הגדרות מערכת')
        .addItem('🛠 התקנת / שדרוג V5.6', 'setupV56')
        .addItem('⏰ התקנת סנכרון שעתי', 'installHourlyTriggerV5')
        .addItem('🗑 מחיקת טריגר', 'deleteV5Triggers')
    )
    .addToUi();
}

function onInstall() { onOpen(); }

function setupV56() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('המערכת בשימוש. נסה שוב בעוד מספר שניות.');
  try {
    validateRequiredSheets_();
    setupTransactionHeaders_();
    setupBudgetHeaders_();
    setupSyncLogHeaders_();
    backfillFirstSeenAt_();
    applyModelIntegrityFixes_();
    ensureAutomaticBankBalanceFormula_();
    refreshDuplicateFormulas_();
    formatSystemSheetsRTL_();

    setConfigParam_('גרסת מערכת', V56.VERSION, '', 'Core V5.6');
    setConfigParam_('גרסת דשבורד', V56.DASHBOARD_VERSION, '', 'Dashboard V5.6');
    setConfigParam_('מקור עסקאות', 'get_transactions', '', 'RiseUp External API');
    setConfigParam_('מפתח upsert', 'transactionId + fingerprint fallback', '', 'transactionId מפתח ראשי');
    setConfigParam_('חלון סנכרון עסקאות', V56.SAFETY_MONTHS, 'חודשים', 'חודש נוכחי + חודש קודם');
    setConfigParam_('מצב מנוע תחזיות', 'AUTO+SEMANTIC_CHECK', '', 'רענון + בדיקת תלות סמנטית');

    if (typeof installDashboardV56 === 'function') installDashboardV56();
    SpreadsheetApp.flush();

    const health = healthCheckV56_();
    logSync_({
      action: 'V5.6 Setup', status: health.ok ? 'SUCCESS' : 'WARNING', records: 0,
      message: 'התקנת Core V5.6 + בדיקות שלמות', syncState: 'SETUP', health: health.summary
    });
    getSpreadsheet_().toast(
      health.ok ? 'V5.6 הותקן ונבדק בהצלחה' : 'V5.6 הותקן עם אזהרות — הפעל Health Check',
      'רואה חשבון', 8
    );
    return health;
  } finally {
    lock.releaseLock();
  }
}

// תאימות לשמות קודמים.
function setupV54() { return setupV56(); }
function setupV5() { return setupV56(); }

function setRiseupPatV5(pat) {
  if (!pat || typeof pat !== 'string') throw new Error('PAT חסר.');
  pat = pat.trim();
  if (!pat.startsWith('riseup_pat_')) throw new Error('PAT אינו בפורמט RiseUp תקין.');
  PropertiesService.getScriptProperties().setProperty('RISEUP_PAT', pat);
  getSpreadsheet_().toast('PAT נשמר ב-Script Properties', 'רואה חשבון', 5);
}

function clearRiseupPatV5() {
  PropertiesService.getScriptProperties().deleteProperty('RISEUP_PAT');
}

function getRiseupPat_() {
  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');
  if (!pat || !pat.startsWith('riseup_pat_')) throw new Error('RISEUP_PAT אינו מוגדר או אינו תקין.');
  return pat;
}

function syncRiseUpV5() {
  const startedAt = new Date();
  const startMs = Date.now();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    logSync_({action:'RiseUp Sync V5.6',status:'SKIPPED',records:0,message:'סנכרון אחר כבר פעיל',syncState:'LOCKED'});
    return null;
  }

  const metrics = {
    inserted:0, updated:0, unchanged:0, duplicates:0, months:[], tokenRef:'',
    riseupLastUpdatedAt:'', budgetUpdated:false, balanceBefore:'', balanceAfter:''
  };

  try {
    validateRequiredSheets_();
    const pat = getRiseupPat_();
    metrics.balanceBefore = getAutomaticBankBalance_();
    metrics.months = getSyncMonths_();
    let all = [];

    metrics.months.forEach(function(month) {
      const r = riseupGet_('/api/external/transactions?cashflowMonth=' + encodeURIComponent(month), pat);
      if (r && r._meta && r._meta.tokenRef) metrics.tokenRef = r._meta.tokenRef;
      const txs = r && Array.isArray(r.transactions) ? r.transactions : [];
      all = all.concat(txs);
    });

    const txr = upsertTransactions_(all);
    Object.assign(metrics, txr);

    const currentMonth = formatMonth_(new Date());
    const budget = riseupGet_('/api/external/budget/' + encodeURIComponent(currentMonth), pat);
    if (budget && budget._meta && budget._meta.tokenRef) metrics.tokenRef = budget._meta.tokenRef;
    if (budget && budget.lastUpdatedAt) metrics.riseupLastUpdatedAt = new Date(budget.lastUpdatedAt);
    metrics.budgetUpdated = syncBudget_(currentMonth, budget);

    setConfigParam_('תאריך רענון אחרון', new Date(), '', 'RiseUp Sync ' + V56.VERSION);
    setConfigParam_('מצב hash', metrics.budgetUpdated ? 'UPDATED' : 'SKIPPED_UNCHANGED', '', 'Budget hash');

    applyModelIntegrityFixes_();
    ensureAutomaticBankBalanceFormula_();
    refreshDuplicateFormulas_();
    SpreadsheetApp.flush();
    metrics.balanceAfter = getAutomaticBankBalance_();

    const health = healthCheckV56_();
    logSync_({
      time:startedAt, action:'RiseUp Sync V5.6', status:health.ok?'SUCCESS':'WARNING', records:all.length,
      message:'חודשים: '+metrics.months.join(', ')+' | חדשות: '+metrics.inserted+' | עודכנו: '+metrics.updated+' | ללא שינוי: '+metrics.unchanged+' | כפילויות API: '+metrics.duplicates,
      tokenRef:metrics.tokenRef, riseupLastUpdatedAt:metrics.riseupLastUpdatedAt,
      syncState:metrics.budgetUpdated?'UPDATED':'SKIPPED_UNCHANGED', durationMs:Date.now()-startMs,
      inserted:metrics.inserted, updated:metrics.updated, duplicates:metrics.duplicates,
      balanceBefore:metrics.balanceBefore, balanceAfter:metrics.balanceAfter, health:health.summary
    });
    showSyncToast_(metrics, health);
    return {success:health.ok, metrics:metrics, health:health};
  } catch (e) {
    logSync_({time:startedAt,action:'RiseUp Sync V5.6',status:'ERROR',records:0,message:String(e.message||e),durationMs:Date.now()-startMs,health:'ERROR'});
    throw e;
  } finally {
    lock.releaseLock();
  }
}

function runV5Now() {
  const ui = SpreadsheetApp.getUi();
  try {
    const r = syncRiseUpV5();
    if (!r) return;
    ui.alert('הסנכרון הסתיים',
      'חדשות: '+r.metrics.inserted+'\nעודכנו: '+r.metrics.updated+'\nיתרת עו״ש מחושבת: '+formatMoney_(r.metrics.balanceAfter)+'\n\n'+r.health.summary,
      ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('שגיאת סנכרון', String(e.message||e), ui.ButtonSet.OK);
    throw e;
  }
}

function syncRiseUpHistory12MonthsV5() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('סנכרון אחר פעיל.');
  const start = Date.now();
  try {
    const pat = getRiseupPat_();
    const months = [];
    const now = new Date();
    for (let i=11;i>=0;i--) months.push(formatMonth_(new Date(now.getFullYear(), now.getMonth()-i, 1)));
    let all=[]; const details=[];
    months.forEach(function(m){
      const r=riseupGet_('/api/external/transactions?cashflowMonth='+encodeURIComponent(m),pat);
      const txs=r&&Array.isArray(r.transactions)?r.transactions:[];
      details.push(m+': '+txs.length); all=all.concat(txs);
    });
    const result=upsertTransactions_(all);
    applyModelIntegrityFixes_();
    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();
    const health=healthCheckV56_();
    logSync_({action:'RiseUp History 12M V5.6',status:health.ok?'SUCCESS':'WARNING',records:all.length,message:'נטענו 12 חודשים | '+details.join(' | '),syncState:'HISTORY_BACKFILL',durationMs:Date.now()-start,inserted:result.inserted,updated:result.updated,duplicates:result.duplicates,health:health.summary});
    getSpreadsheet_().toast('היסטוריית 12 חודשים סונכרנה', 'רואה חשבון', 7);
    return result;
  } finally { lock.releaseLock(); }
}

function promptVerifiedBankBalanceV5() {
  const ui=SpreadsheetApp.getUi();
  const r=ui.prompt('עדכון יתרת עו״ש מאומתת','הזן יתרת עו״ש מהבנק. מספר שלילי למינוס.',ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton()!==ui.Button.OK) return;
  const value=Number(String(r.getResponseText()).replace(/,/g,'').replace(/₪/g,'').trim());
  if (!isFinite(value)) throw new Error('היתרה אינה מספר תקין.');
  setConfigParam_('יתרת עו״ש נוכחית ידנית',value,'₪','עוגן מאומת ידנית; אין להציג כיתרה חיה לאחר חלוף זמן');
  setConfigParam_('תאריך ושעת יתרת עו״ש',new Date(),'תאריך/שעה','מועד אימות העוגן');
  ensureAutomaticBankBalanceFormula_();
  SpreadsheetApp.flush();
  const h=healthCheckV56_();
  ui.alert('עודכן עוגן העו״ש',h.summary,ui.ButtonSet.OK);
}

function refreshForecastsV5() {
  applyModelIntegrityFixes_();
  ensureAutomaticBankBalanceFormula_();
  SpreadsheetApp.flush();
  const h=healthCheckV56_();
  logSync_({action:'Forecast Refresh V5.6',status:h.ok?'SUCCESS':'WARNING',records:0,message:'רענון תחזיות + בדיקת תלות',syncState:'FORECAST_REFRESH',health:h.summary});
  getSpreadsheet_().toast(h.summary,'רואה חשבון',8);
  return h;
}

function healthCheckV5() {
  const h=healthCheckV56_();
  SpreadsheetApp.getUi().alert('Health Check V5.6',h.summary,SpreadsheetApp.getUi().ButtonSet.OK);
  return h;
}

function healthCheckV56_() {
  const ss=getSpreadsheet_();
  const errors=[]; const warnings=[];
  try { validateRequiredSheets_(); } catch(e) { errors.push(String(e.message||e)); }

  const config=getSheet_('CONFIG');
  const cashflow=getSheet_('CASHFLOW');
  const annual=getSheet_('ANNUAL_CASHFLOW');
  const goals=getSheet_('GOALS');
  const dashboard=getSheet_('DASHBOARD');

  const autoBalance=Number(getConfigParam_('יתרת עו״ש מחושבת אוטומטית'));
  if (!isFinite(autoBalance)) errors.push('יתרת עו״ש מחושבת אינה מספר תקין');

  const lastCashflow=getLastNumericValue_(cashflow,7,2);
  if (!isFinite(lastCashflow)) errors.push('סוף חודש בתזרים אינו זמין');

  const ganttOpening=Number(annual.getRange('B4').getValue());
  if (!isFinite(ganttOpening)) errors.push('יתרת פתיחה בגאנט B4 אינה מספר');
  if (isFinite(lastCashflow)&&isFinite(ganttOpening)&&Math.abs(lastCashflow-ganttOpening)>0.01) {
    errors.push('גאנט B4 אינו שווה לסוף החודש בתזרים');
  }

  const goalTarget=Number(goals.getRange('B2').getValue());
  const configTarget=Number(config.getRange('B5').getValue());
  if (!(goalTarget>0)) errors.push('יעד כרית ביטחון בגיליון יעדים אינו תקין');
  if (Math.abs(goalTarget-configTarget)>0.01) errors.push('יעד כרית הביטחון בהגדרות אינו מפנה למקור היחיד ביעדים');

  const annualFormulas=annual.getRange('A1:R60').getFormulas().flat().filter(Boolean).join('\n');
  if (annualFormulas.indexOf("'לוח מחוונים'!")!==-1 || annualFormulas.indexOf('לוח מחוונים!')!==-1) {
    errors.push('נמצאה תלות אסורה של הגאנט בדשבורד');
  }

  const dashLabel=String(dashboard.getRange('A5').getDisplayValue()||'');
  if (dashLabel.indexOf('מחושבת')===-1) warnings.push('כרטיס העו״ש בדשבורד אינו מסומן כמחושב');
  if (dashboard.getCharts().length>0) warnings.push('נמצאו Charts בדשבורד למרות מדיניות ללא שעונים');

  const errorCells=findFormulaErrors_();
  if (errorCells.length) errors.push('שגיאות נוסחה: '+errorCells.slice(0,10).join(', '));

  const version=String(getConfigParam_('גרסת מערכת')||'');
  if (version!==V56.VERSION) warnings.push('גרסת Core בגיליון היא '+version+' ולא '+V56.VERSION);

  const lastSync=getConfigParam_('תאריך רענון אחרון');
  if (lastSync instanceof Date) {
    const age=(Date.now()-lastSync.getTime())/3600000;
    if (age>3) warnings.push('הסנכרון האחרון ישן מ-3 שעות');
  }

  const ok=errors.length===0;
  let summary=(ok?'🟢 המערכת תקינה':'🔴 נמצאו תקלות')+'\n\nיתרת עו״ש מחושבת: '+formatMoney_(autoBalance);
  if (errors.length) summary+='\n\nתקלות:\n• '+errors.join('\n• ');
  if (warnings.length) summary+='\n\nאזהרות:\n• '+warnings.join('\n• ');
  return {ok:ok,errors:errors,warnings:warnings,summary:summary};
}

function checkDuplicatesV5() {
  const sh=getSheet_('TRANSACTIONS');
  const lr=sh.getLastRow(); if(lr<2) return {duplicates:0,items:[]};
  const vals=sh.getRange(2,1,lr-1,21).getValues();
  const seen={}; const dup=[];
  vals.forEach(function(r,i){
    const key=String(r[0]||'').trim() || transactionFingerprintFromRow_(r);
    if (!key) return;
    if (seen[key]!==undefined) dup.push({key:key,rows:[seen[key]+2,i+2]}); else seen[key]=i;
  });
  SpreadsheetApp.getUi().alert('בדיקת כפילויות',dup.length?'נמצאו '+dup.length+' כפילויות.':'לא נמצאו כפילויות.',SpreadsheetApp.getUi().ButtonSet.OK);
  return {duplicates:dup.length,items:dup};
}

function scanVerificationStatusV5() {
  const sh=getSheet_('VERIFICATION');
  const lr=sh.getLastRow();
  if(lr<2) return {active:0,total:0};
  const vals=sh.getRange(2,1,lr-1,Math.min(sh.getLastColumn(),9)).getDisplayValues();
  let active=0;
  vals.forEach(function(r){
    const status=(r[8]||r[5]||'').toLowerCase();
    if (/פעיל|דורש|פער|חסר|לא אומת|חלקית/.test(status)) active++;
  });
  SpreadsheetApp.getUi().alert('סריקת אימות','נושאים פעילים: '+active+' מתוך '+vals.length,SpreadsheetApp.getUi().ButtonSet.OK);
  return {active:active,total:vals.length};
}

function showSystemStatusV5() {
  const h=healthCheckV56_();
  const sync=getConfigParam_('תאריך רענון אחרון');
  const anchor=getConfigParam_('תאריך ושעת יתרת עו״ש');
  const text='Core: '+String(getConfigParam_('גרסת מערכת')||'')+'\nDashboard: '+String(getConfigParam_('גרסת דשבורד')||'')+'\nסנכרון אחרון: '+formatDateTime_(sync)+'\nאימות עו״ש: '+formatDateTime_(anchor)+'\n\n'+h.summary;
  SpreadsheetApp.getUi().alert('סטטוס מערכת',text,SpreadsheetApp.getUi().ButtonSet.OK);
  return text;
}

function openDashboardV5() {
  const ss=getSpreadsheet_(); const sh=getSheet_('DASHBOARD'); ss.setActiveSheet(sh); sh.getRange('A1').activate();
}

function installHourlyTriggerV5() {
  deleteV5Triggers();
  ScriptApp.newTrigger('syncRiseUpV5').timeBased().everyHours(1).create();
  getSpreadsheet_().toast('טריגר סנכרון שעתי הותקן','רואה חשבון',5);
}

function deleteV5Triggers() {
  ScriptApp.getProjectTriggers().forEach(function(t){ if(t.getHandlerFunction()==='syncRiseUpV5') ScriptApp.deleteTrigger(t); });
}

function applyModelIntegrityFixes_() {
  const config=getSheet_('CONFIG');
  const goals=getSheet_('GOALS');
  const annual=getSheet_('ANNUAL_CASHFLOW');
  const plan=getSheet_('FIVE_YEAR_PLAN');

  config.getRange('A1').setValue('הגדרות מערכת — רואה חשבון');
  config.getRange('B5').setFormula("='יעדים'!B2");
  config.getRange('D5').setValue('מקור יחיד ליעד: גיליון יעדים');

  annual.getRange('B4').setFormula('=IFERROR(INDEX(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""),ROWS(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A<>""))),0)');
  annual.getRange('C4').setValue('מקור ישיר מתזרים — סוף החודש; ללא תלות בדשבורד');
  annual.getRange('C5').setValue('בסיס נטו חוזר מאומת: 13,329 ₪. אוגוסט החריג והחזרי מס אינם בסיס חודשי.');
  annual.getRange('B10').setFormula("='יעדים'!B2");
  annual.getRange('C10').setValue('מקור יחיד: יעד כרית ביטחון בגיליון יעדים');

  plan.getRange('C7:G7').setValues([[0,0,0,0,0]]);
  plan.getRange('H7').setValue('תחזית פירעון');
  plan.getRange('I7').setValue('חוב ועד הבית מתוכנן להיסגר עד 12/2026 ומימון הרכב עד 03/2027; בהיעדר חוב חדש, יתרת החוב בסוף שנה 1 ואילך היא 0.');
  plan.getRange('C14').setFormula("=B14-('הלוואות'!E2*5/12)");
  plan.getRange('D14:G14').setFormulas([["=B14-'הלוואות'!E2","=B14-'הלוואות'!E2","=B14-'הלוואות'!E2","=B14-'הלוואות'!E2"]]);
  plan.getRange('H14').setValue('תחזית מחושבת');
  plan.getRange('I14').setValue('שנה 1 מפחיתה בממוצע 5 חודשי תשלום רכב לאחר סיום משוער במרץ 2027; משנה 2 בסיס ההוצאות מפחית את תשלום הרכב הנוכחי.');
  plan.getRange('B31:G31').setFormulas([[
    '=B26+B27+B28+B29+B30-B7','=C26+C27+C28+C29+C30-C7','=D26+D27+D28+D29+D30-D7',
    '=E26+E27+E28+E29+E30-E7','=F26+F27+F28+F29+F30-F7','=G26+G27+G28+G29+G30-G7'
  ]]);
  plan.getRange('I31').setValue('מפחית את יתרת החוב החזויה בכל שנה ולא חוב נוכחי קבוע.');

  // שמירה על מקור היעד היחיד גם אם שורת היעד זזה בעתיד — Health Check יתריע.
  if (!(Number(goals.getRange('B2').getValue())>0)) throw new Error('יעד כרית הביטחון ביעדים אינו תקין.');
}

function ensureAutomaticBankBalanceFormula_() {
  const sh=getSheet_('CONFIG');
  const row=findConfigRow_('יתרת עו״ש מחושבת אוטומטית',true);
  sh.getRange(row,2).setFormula(
    '=IF(OR(B9="",B12=""),"",B9+'+
    'SUMIFS(\'תנועות\'!F:F,\'תנועות\'!H:H,"checkingAccount",\'תנועות\'!G:G,"הכנסה",\'תנועות\'!U:U,">"&B12)-'+
    'SUMIFS(\'תנועות\'!F:F,\'תנועות\'!H:H,"checkingAccount",\'תנועות\'!G:G,"הוצאה",\'תנועות\'!U:U,">"&B12))'
  );
  sh.getRange(row,3).setValue('₪');
  sh.getRange(row,4).setValue('עוגן יתרה מאומת + עסקאות checkingAccount שנקלטו לראשונה לאחר העוגן; firstSeenAt מונע בעיית date-only ביום העוגן.');
}

function backfillFirstSeenAt_() {
  const sh=getSheet_('TRANSACTIONS'); const lr=sh.getLastRow(); if(lr<2) return;
  const lastSynced=sh.getRange(2,20,lr-1,1).getValues();
  const first=sh.getRange(2,21,lr-1,1).getValues();
  let changed=false;
  for(let i=0;i<first.length;i++) if(!first[i][0]&&lastSynced[i][0]) { first[i][0]=lastSynced[i][0]; changed=true; }
  if(changed) sh.getRange(2,21,first.length,1).setValues(first);
}

function setupTransactionHeaders_() {
  const sh=getSheet_('TRANSACTIONS');
  sh.getRange(1,1,1,V56.TRANSACTION_HEADERS.length).setValues([V56.TRANSACTION_HEADERS]);
  sh.setFrozenRows(1);
}

function setupBudgetHeaders_() {
  const sh=getSheet_('BUDGET');
  sh.getRange(1,1,1,V56.BUDGET_HEADERS.length).setValues([V56.BUDGET_HEADERS]);
  sh.setFrozenRows(1);
}

function setupSyncLogHeaders_() {
  const sh=getSheet_('SYNC_LOG');
  const current=sh.getRange(1,1,1,V56.LOG_HEADERS.length).getValues()[0];
  const out=[];
  V56.LOG_HEADERS.forEach(function(h,i){ out.push(current[i]||h); });
  sh.getRange(1,1,1,out.length).setValues([out]);
  sh.setFrozenRows(1);
}

function upsertTransactions_(transactions) {
  const sh=getSheet_('TRANSACTIONS');
  const lr=sh.getLastRow();
  const width=V56.TRANSACTION_HEADERS.length;
  const existing=lr>1?sh.getRange(2,1,lr-1,width).getValues():[];
  const index={};
  existing.forEach(function(r,i){
    const key=String(r[0]||'').trim() || transactionFingerprintFromRow_(r);
    if(key) index[key]=i;
  });

  let inserted=0,updated=0,unchanged=0,duplicates=0;
  const seenApi={}; const now=new Date(); const append=[];

  transactions.forEach(function(tx){
    const row=normalizeTransaction_(tx,now);
    const key=String(row[0]||'').trim() || transactionFingerprintFromRow_(row);
    if(!key) return;
    if(seenApi[key]) { duplicates++; return; }
    seenApi[key]=true;

    if(index[key]===undefined){
      row[20]=now; append.push(row); index[key]=existing.length+append.length-1; inserted++;
    } else {
      const i=index[key]; const old=existing[i];
      row[20]=old[20]||old[19]||now;
      if(rowsEquivalent_(old,row,19)) unchanged++;
      else { existing[i]=row; sh.getRange(i+2,1,1,width).setValues([row]); updated++; }
    }
  });

  if(append.length) sh.getRange(sh.getLastRow()+1,1,append.length,width).setValues(append);
  return {inserted:inserted,updated:updated,unchanged:unchanged,duplicates:duplicates};
}

function normalizeTransaction_(tx,now) {
  const amount=Math.abs(Number(tx.amount||tx.transactionAmount||0)||0);
  let direction=tx.direction||'';
  if(!direction) direction=Number(tx.amount||0)<0?'הוצאה':'הכנסה';
  if(direction==='expense') direction='הוצאה'; if(direction==='income') direction='הכנסה';
  const date=parseDateSafe_(tx.transactionDate||tx.date||tx.actualDate);
  const billing=parseDateSafe_(tx.billingDate||tx.chargeDate);
  return [
    tx.transactionId||tx.id||'', date, tx.cashflowMonth||'', tx.businessName||tx.description||'',
    tx.categoryLabel||tx.category||'', amount, direction, tx.sourceType||tx.accountType||'',
    tx.source||'', tx.accountNickname||tx.accountName||'', tx.accountNumberHash||'', billing,
    !!tx.isInstallment, tx.installmentNumber||'', tx.totalInstallments||'', !!tx.isPostponed,
    tx.commitmentId||'', tx.actualType||'', tx.categoryType||'', now, ''
  ];
}

function transactionFingerprintFromRow_(r) {
  const d=r[1] instanceof Date?Utilities.formatDate(r[1],V56.TIMEZONE,'yyyy-MM-dd'):String(r[1]||'');
  return [d,r[3]||'',r[5]||'',r[6]||'',r[7]||'',r[10]||'',r[11]||''].join('|');
}

function rowsEquivalent_(a,b,compareCols) {
  for(let i=0;i<compareCols;i++){
    const av=a[i] instanceof Date?a[i].getTime():String(a[i]??'');
    const bv=b[i] instanceof Date?b[i].getTime():String(b[i]??'');
    if(av!==bv) return false;
  }
  return true;
}

function syncBudget_(month,response) {
  if(!response) return false;
  const raw=JSON.stringify(response);
  const hash=sha256_(raw);
  const previous=String(getConfigParam_('cashflowHash אחרון')||'');
  if(previous===hash) return false;

  const envelopes=Array.isArray(response.envelopes)?response.envelopes:(Array.isArray(response.budget)?response.budget:[]);
  const rows=envelopes.map(function(env){
    return [month,env.id||env.envelopeId||'',env.type||env.name||'',Number(env.originalAmount||0),Number(env.balancedAmount||env.amount||0),parseDateSafe_(env.balanceDate),parseDateSafe_(response.lastUpdatedAt||env.lastUpdatedAt),hash,JSON.stringify(env)];
  });
  const sh=getSheet_('BUDGET');
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,V56.BUDGET_HEADERS.length).clearContent();
  if(rows.length) sh.getRange(2,1,rows.length,V56.BUDGET_HEADERS.length).setValues(rows);
  setConfigParam_('cashflowHash אחרון',hash,'','SHA-256 של תגובת Budget האחרונה');
  return true;
}

function riseupGet_(path,pat) {
  let wait=V56.INITIAL_RETRY_MS;
  for(let attempt=1;attempt<=V56.MAX_RETRIES;attempt++){
    const res=UrlFetchApp.fetch(V56.API_BASE+path,{method:'get',headers:{Authorization:'Bearer '+pat,Accept:'application/json'},muteHttpExceptions:true});
    const code=res.getResponseCode();
    if(code>=200&&code<300){
      const obj=JSON.parse(res.getContentText()||'{}');
      const headers=res.getAllHeaders();
      obj._meta=obj._meta||{};
      obj._meta.tokenRef=headers['X-Riseup-Token-Ref']||headers['x-riseup-token-ref']||'';
      return obj;
    }
    if(code===401) throw new Error('RiseUp PAT פג/בוטל (401).');
    if(code===403) throw new Error('RiseUp PAT חסר הרשאה מתאימה (403).');
    if(code===429||code>=500){ Utilities.sleep(wait); wait*=2; continue; }
    throw new Error('RiseUp API '+code+': '+res.getContentText().slice(0,300));
  }
  throw new Error('RiseUp API לא הגיב לאחר מספר ניסיונות.');
}

function getSyncMonths_() {
  const arr=[]; const now=new Date();
  for(let i=0;i<V56.SAFETY_MONTHS;i++) arr.push(formatMonth_(new Date(now.getFullYear(),now.getMonth()-i,1)));
  return arr;
}

function refreshDuplicateFormulas_() {
  // שמור פונקציה כתאימות. בדיקת הכפילויות עצמה מתבצעת ב-checkDuplicatesV5.
}

function findFormulaErrors_() {
  const ss=getSpreadsheet_(); const bad=[];
  ss.getSheets().forEach(function(sh){
    const lr=Math.min(sh.getLastRow(),500), lc=Math.min(sh.getLastColumn(),30);
    if(lr<1||lc<1) return;
    const vals=sh.getRange(1,1,lr,lc).getDisplayValues();
    for(let r=0;r<vals.length;r++) for(let c=0;c<vals[r].length;c++) if(/^#(REF|VALUE|N\/A|DIV\/0|NAME|NUM|ERROR)/.test(vals[r][c])) bad.push(sh.getName()+'!'+columnToLetter_(c+1)+(r+1));
  });
  return bad;
}

function validateRequiredSheets_() {
  const ss=getSpreadsheet_(); const missing=[];
  Object.keys(V56.SHEET_NAMES).forEach(function(k){ if(!ss.getSheetByName(V56.SHEET_NAMES[k])) missing.push(V56.SHEET_NAMES[k]); });
  if(missing.length) throw new Error('חסרים גיליונות: '+missing.join(', '));
}

function formatSystemSheetsRTL_() {
  getSpreadsheet_().getSheets().forEach(function(sh){
    sh.setRightToLeft(true);
    const lr=sh.getLastRow(),lc=sh.getLastColumn();
    if(lr&&lc) sh.getRange(1,1,lr,lc).setHorizontalAlignment('right');
  });
}

function setConfigParam_(name,value,unit,note) {
  const sh=getSheet_('CONFIG'); const row=findConfigRow_(name,true);
  sh.getRange(row,1,1,4).setValues([[name,value,unit||'',note||'']]);
}

function getConfigParam_(name) {
  const sh=getSheet_('CONFIG'); const row=findConfigRow_(name,false); return row?sh.getRange(row,2).getValue():'';
}

function findConfigRow_(name,create) {
  const sh=getSheet_('CONFIG'); const lr=Math.max(sh.getLastRow(),1);
  const vals=sh.getRange(1,1,lr,1).getDisplayValues();
  for(let i=0;i<vals.length;i++) if(vals[i][0]===name) return i+1;
  if(!create) return 0;
  return lr+1;
}

function getAutomaticBankBalance_() {
  const v=getConfigParam_('יתרת עו״ש מחושבת אוטומטית'); return v===''?'':Number(v);
}

function getLastNumericValue_(sheet,col,startRow) {
  const lr=sheet.getLastRow(); if(lr<startRow) return NaN;
  const vals=sheet.getRange(startRow,col,lr-startRow+1,1).getValues();
  for(let i=vals.length-1;i>=0;i--) if(vals[i][0]!==''&&isFinite(Number(vals[i][0]))) return Number(vals[i][0]);
  return NaN;
}

function getSheet_(key) {
  const name=V56.SHEET_NAMES[key]||key;
  const sh=getSpreadsheet_().getSheetByName(name);
  if(!sh) throw new Error('לא נמצא גיליון: '+name);
  return sh;
}

function getSpreadsheet_() { return SpreadsheetApp.openById(V56.SPREADSHEET_ID); }

function logSync_(x) {
  const sh=getSheet_('SYNC_LOG'); setupSyncLogHeaders_();
  sh.appendRow([
    x.time||new Date(),x.action||'',x.status||'',x.records||0,x.message||'',x.cashflowHash||getConfigParam_('cashflowHash אחרון')||'',
    x.riseupLastUpdatedAt||'',x.syncState||'',x.tokenRef||'',x.durationMs||'',x.inserted||0,x.updated||0,x.duplicates||0,
    x.balanceBefore===''?'':x.balanceBefore,x.balanceAfter===''?'':x.balanceAfter,x.health||''
  ]);
}

function showSyncToast_(m,h) {
  getSpreadsheet_().toast('חדשות '+m.inserted+' | עודכנו '+m.updated+' | עו״ש '+formatMoney_(m.balanceAfter)+'\n'+(h.ok?'🟢 תקין':'🔴 דורש בדיקה'),'RiseUp Sync V5.6',8);
}

function sha256_(text) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8);
  return bytes.map(function(b){ const v=(b<0?b+256:b).toString(16); return v.length===1?'0'+v:v; }).join('');
}

function parseDateSafe_(v) {
  if(!v) return '';
  if(v instanceof Date) return v;
  const d=new Date(v); return isNaN(d.getTime())?'':d;
}

function formatMonth_(d) { return Utilities.formatDate(d,V56.TIMEZONE,'yyyy-MM'); }
function formatDateTime_(d) { return d instanceof Date?Utilities.formatDate(d,V56.TIMEZONE,'dd/MM/yyyy HH:mm'):String(d||'לא ידוע'); }
function formatMoney_(n) { return isFinite(Number(n))?Number(n).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪':'לא זמין'; }
function columnToLetter_(n) { let s=''; while(n){ n--; s=String.fromCharCode(65+n%26)+s; n=Math.floor(n/26); } return s; }
