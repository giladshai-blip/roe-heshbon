/**
 * ============================================================
 * רואה חשבון — Core V5.10.0
 * ============================================================
 * קובץ מלא להחלפת Code.gs ב-Google Apps Script.
 *
 * עיקרי V5.10.0:
 * - "מוח אחד": Snapshot מרכזי יחיד ל-KPI תזרים, תקציב, אשראי וכרית ביטחון.
 * - גיליון "תקציב חודשי" הפך לצרכן KPI: הכנסות, הוצאות, קבועות, משתנות, מסגרות ומאזנים מחושבים ב-Core.
 * - Dashboard צורך את אותו Snapshot ואינו מחשב מחדש KPI פיננסיים.
 * - נשמרת הפרדה בין מאזן בפועל למאזן חודשי מתוכנן כדי למנוע שינוי סמנטיקה.
 * - מנגנון התאמת תזרים מתוכנן ↔ תנועות עבר נשאר ב-Core עם סינון סטטוס מדויק.
 * - בדיקות Runtime כוללות כעת parity של KPI בין Core לתצוגות.
 * ============================================================
 */

const V56 = {
  VERSION: 'V5.10.0',
  DASHBOARD_VERSION: 'V5.9.0',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  API_BASE: 'https://input.riseup.co.il',
  SAFETY_MONTHS: 2,
  SYNC_INTERVAL_HOURS: 3,
  SYNC_STALE_HOURS: 4,
  LARGE_TRANSACTION_ALERT: 2000,
  MAX_RETRIES: 4,
  INITIAL_RETRY_MS: 1000,
  RECONCILIATION_WINDOW_DAYS: 3,
  RECONCILIATION_AMOUNT_TOLERANCE: 1,
  SHEET_NAMES: {
    DASHBOARD: 'לוח מחוונים',
    MONTHLY_BUDGET: 'תקציב חודשי',
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
    FIVE_YEAR_PLAN: 'תוכנית 5 שנים',
    ALERTS: 'התראות מערכת',
    AUTOMATION_LOG: 'יומן אוטומציות'
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
  SpreadsheetApp.getUi()
    .createMenu('💼 רואה חשבון')
    .addItem('🔄 סנכרון עכשיו', 'runV5Now')
    .addToUi();
}

function onInstall() { onOpen(); }

function setupV56() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('המערכת בשימוש. נסה שוב בעוד מספר שניות.');
  try {
    validateRequiredSheets_();
    validateSyncSchema_();
    validateModelLayout_();
    setupTransactionHeaders_();
    setupBudgetHeaders_();
    setupSyncLogHeaders_();
    applyModelIntegrityFixes_();
    ensureAutomaticBankBalanceFormula_();
    refreshDuplicateFormulas_();
    setConfigParam_('גרסת מערכת', V56.VERSION, '', 'Core ' + V56.VERSION);
    setConfigParam_('מקור עסקאות', 'get_transactions', '', 'RiseUp External API');
    setConfigParam_('מפתח upsert', 'transactionId + fingerprint fallback', '', 'transactionId מפתח ראשי');
    setConfigParam_('חלון סנכרון עסקאות', V56.SAFETY_MONTHS, 'חודשים', 'חודש נוכחי + חודש קודם');
    setConfigParam_('תדירות סנכרון RiseUp', V56.SYNC_INTERVAL_HOURS, 'שעות', 'טריגר מתוזמן; התקנה באמצעות installRiseupSyncTriggerV5');
    setConfigParam_('מצב מנוע תחזיות', 'AUTO+SEMANTIC_CHECK', '', 'רענון + בדיקת תלות סמנטית');
    if (typeof installDashboardV56 === 'function') installDashboardV56();
    refreshBudgetViewKpisV510_();
    SpreadsheetApp.flush();
    const health = healthCheckV56_();
    logSync_({action:V56.VERSION + ' Setup',status:health.status,records:0,message:'התקנת Core ' + V56.VERSION + ' + בדיקות שלמות',syncState:'SETUP',health:health.summary});
    getSpreadsheet_().toast(health.status==='SUCCESS'?V56.VERSION+' הותקן ונבדק בהצלחה':V56.VERSION+' הותקן — יש לעיין בדוח הבדיקה','רואה חשבון',8);
    return health;
  } finally { lock.releaseLock(); }
}

function setupV510() { return setupV56(); }
function setupV59() { return setupV56(); }
function setupV58() { return setupV56(); }
function setupV57() { return setupV56(); }
function setupV54() { return setupV56(); }
function setupV5() { return setupV56(); }

function setRiseupPatV5(pat) {
  if (!pat || typeof pat !== 'string') throw new Error('PAT חסר.');
  pat = pat.trim();
  if (!pat.startsWith('riseup_pat_')) throw new Error('PAT אינו בפורמט RiseUp תקין.');
  PropertiesService.getScriptProperties().setProperty('RISEUP_PAT', pat);
  getSpreadsheet_().toast('PAT נשמר ב-Script Properties', 'רואה חשבון', 5);
}
function clearRiseupPatV5(){ PropertiesService.getScriptProperties().deleteProperty('RISEUP_PAT'); }
function getRiseupPat_(){ const pat=PropertiesService.getScriptProperties().getProperty('RISEUP_PAT'); if(!pat||!pat.startsWith('riseup_pat_')) throw new Error('RISEUP_PAT אינו מוגדר או אינו תקין.'); return pat; }

function syncRiseUpV5() {
  const startedAt=new Date(),startMs=Date.now();
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000)){safeLogSync_({action:'RiseUp Sync '+V56.VERSION,status:'SKIPPED',records:0,message:'סנכרון אחר כבר פעיל',syncState:'LOCKED'});return null;}
  const metrics={inserted:0,updated:0,unchanged:0,duplicates:0,months:[],tokenRef:'',riseupLastUpdatedAt:'',budgetUpdated:false,balanceBefore:'',balanceAfter:'',reconciliation:null};
  try{
    validateRequiredSheets_();validateSyncSchema_();validateModelLayout_();
    const pat=getRiseupPat_();
    metrics.balanceBefore=getAutomaticBankBalance_();metrics.months=getSyncMonths_();
    let all=[];
    metrics.months.forEach(function(month){const r=riseupGet_('/api/external/transactions?cashflowMonth='+encodeURIComponent(month),pat);if(r&&r._meta&&r._meta.tokenRef)metrics.tokenRef=r._meta.tokenRef;const txs=requireTransactions_(r);all=all.concat(withCashflowMonth_(txs,month));});
    const txr=upsertTransactions_(all);Object.assign(metrics,txr);
    const currentMonth=formatMonth_(new Date());
    const budget=riseupGet_('/api/external/budget/'+encodeURIComponent(currentMonth),pat);
    if(budget&&budget._meta&&budget._meta.tokenRef)metrics.tokenRef=budget._meta.tokenRef;
    if(budget&&budget.lastUpdatedAt)metrics.riseupLastUpdatedAt=new Date(budget.lastUpdatedAt);
    metrics.budgetUpdated=syncBudget_(currentMonth,budget);
    setConfigParam_('תאריך רענון אחרון',new Date(),'','RiseUp Sync '+V56.VERSION);
    setConfigParam_('מצב hash',metrics.budgetUpdated?'UPDATED':'SKIPPED_UNCHANGED','','Budget hash');
    applyModelIntegrityFixes_();ensureAutomaticBankBalanceFormula_();refreshDuplicateFormulas_();SpreadsheetApp.flush();
    metrics.reconciliation=getPlannedReconciliationV59_();
    refreshFinancialViewsV510_();
    SpreadsheetApp.flush();
    metrics.balanceAfter=getAutomaticBankBalance_();
    const health=healthCheckV56_();
    logSync_({time:startedAt,action:'RiseUp Sync '+V56.VERSION,status:health.status,records:all.length,message:'חודשים: '+metrics.months.join(', ')+' | חדשות: '+metrics.inserted+' | עודכנו: '+metrics.updated+' | ללא שינוי: '+metrics.unchanged+' | כפילויות API: '+metrics.duplicates+' | תכנון נסרק: '+metrics.reconciliation.eligible+' | התאמות בטוחות: '+metrics.reconciliation.matched+' | לבדיקה: '+metrics.reconciliation.review,tokenRef:metrics.tokenRef,riseupLastUpdatedAt:metrics.riseupLastUpdatedAt,syncState:metrics.budgetUpdated?'UPDATED':'SKIPPED_UNCHANGED',durationMs:Date.now()-startMs,inserted:metrics.inserted,updated:metrics.updated,duplicates:metrics.duplicates,balanceBefore:metrics.balanceBefore,balanceAfter:metrics.balanceAfter,health:health.summary});
    showSyncToast_(metrics,health);return {success:health.ok,metrics:metrics,health:health};
  }catch(e){safeLogSync_({time:startedAt,action:'RiseUp Sync '+V56.VERSION,status:'ERROR',records:0,message:String(e.message||e),durationMs:Date.now()-startMs,health:'ERROR'});throw e;}
  finally{lock.releaseLock();}
}

function runV5Now(){const ui=SpreadsheetApp.getUi();try{const r=syncRiseUpV5();if(!r)return;ui.alert('הסנכרון הסתיים','חדשות: '+r.metrics.inserted+'\nעודכנו: '+r.metrics.updated+'\nיתרת עו״ש מחושבת: '+formatMoney_(r.metrics.balanceAfter)+'\n\n'+r.health.summary,ui.ButtonSet.OK);}catch(e){ui.alert('שגיאת סנכרון',String(e.message||e),ui.ButtonSet.OK);throw e;}}

function syncRiseUpHistory12MonthsV5(){
  const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('סנכרון אחר פעיל.');const start=Date.now();
  try{
    validateRequiredSheets_();validateSyncSchema_();validateModelLayout_();const pat=getRiseupPat_();const months=[];const now=new Date();months.push.apply(months,syncMonthsAt_(now,12).reverse());
    let all=[];const details=[];
    months.forEach(function(m){const r=riseupGet_('/api/external/transactions?cashflowMonth='+encodeURIComponent(m),pat);const txs=requireTransactions_(r);details.push(m+': '+txs.length);all=all.concat(withCashflowMonth_(txs,m));});
    const result=upsertTransactions_(all);applyModelIntegrityFixes_();ensureAutomaticBankBalanceFormula_();SpreadsheetApp.flush();refreshDuplicateFormulas_();
    refreshFinancialViewsV510_();
    SpreadsheetApp.flush();
    const health=healthCheckV56_();
    logSync_({action:'RiseUp History 12M '+V56.VERSION,status:health.status,records:all.length,message:'נטענו 12 חודשים | '+details.join(' | '),syncState:'HISTORY_BACKFILL',durationMs:Date.now()-start,inserted:result.inserted,updated:result.updated,duplicates:result.duplicates,health:health.summary});
    getSpreadsheet_().toast('היסטוריית 12 חודשים סונכרנה','רואה חשבון',7);return result;
  }catch(e){safeLogSync_({action:'RiseUp History 12M '+V56.VERSION,status:'ERROR',records:0,message:String(e.message||e),durationMs:Date.now()-start});throw e;}finally{lock.releaseLock();}
}

function promptVerifiedBankBalanceV5(){const ui=SpreadsheetApp.getUi();const r=ui.prompt('עדכון יתרת עו״ש מאומתת','הזן יתרת עו״ש מהבנק. מספר שלילי למינוס.',ui.ButtonSet.OK_CANCEL);if(r.getSelectedButton()!==ui.Button.OK)return;const input=String(r.getResponseText()).replace(/,/g,'').replace(/₪/g,'').trim();if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(input))throw new Error('היתרה אינה מספר תקין');const value=Number(input);if(!isFinite(value))throw new Error('היתרה אינה מספר תקין');const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('סנכרון פעיל; נסה שוב לאחר סיומו');try{setConfigParam_('יתרת עו״ש נוכחית ידנית',value,'₪','עוגן מאומת ידנית; אינו יתרה חיה');setConfigParam_('תאריך ושעת יתרת עו״ש',new Date(),'תאריך/שעה','מועד אימות העוגן');ensureAutomaticBankBalanceFormula_();SpreadsheetApp.flush();refreshFinancialViewsV510_();SpreadsheetApp.flush();}finally{lock.releaseLock();}ui.alert('עודכן עוגן העו״ש',healthCheckV56_().summary,ui.ButtonSet.OK);}

function refreshForecastsV5(){const lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('סנכרון פעיל');try{validateRequiredSheets_();validateSyncSchema_();applyModelIntegrityFixes_();ensureAutomaticBankBalanceFormula_();refreshDuplicateFormulas_();SpreadsheetApp.flush();refreshFinancialViewsV510_();SpreadsheetApp.flush();const h=healthCheckV56_();logSync_({action:'Forecast Refresh '+V56.VERSION,status:h.status,records:0,message:'רענון הפניות ללא שינוי הנחות',syncState:'FORECAST_REFRESH',health:h.summary});getSpreadsheet_().toast(h.summary,'רואה חשבון',8);return h;}finally{lock.releaseLock();}}

function healthCheckV5(){const h=healthCheckV56_();SpreadsheetApp.getUi().alert('Health Check '+V56.VERSION,h.summary,SpreadsheetApp.getUi().ButtonSet.OK);return h;}

function runRuntimeSelfTestV57(){
  const tests=[];
  function test(name,fn){try{const detail=fn();tests.push({name:name,status:'PASS',detail:detail||''});}catch(e){tests.push({name:name,status:'FAIL',detail:String(e.message||e)});}}
  test('מבנה גיליונות',function(){validateRequiredSheets_();return 'כל גיליונות החובה קיימים';});
  test('מבנה סנכרון',function(){validateSyncSchema_();return 'כותרות Transactions ו-Budget תקינות';});
  test('מבנה מודל',function(){validateModelLayout_();return 'נקודות העיגון קיימות';});
  test('מניעת כפילויות',function(){const sh=getSheet_('TRANSACTIONS'),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,21).getValues():[],s=auditTransactions_(rows);if(s.duplicates)throw new Error(s.duplicates+' כפילויות');return rows.length+' עסקאות נבדקו';});
  test('תקינות עסקאות',function(){const sh=getSheet_('TRANSACTIONS'),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,21).getValues():[],s=auditTransactions_(rows);if(s.invalid)throw new Error(s.invalid+' עסקאות לא תקינות');return 'סכום, תאריך וכיוון תקינים';});
  test('כיסוי תחזית 30 יום',function(){const m=getForecast30DayMetrics_();if(m.covered!==30)throw new Error('כיסוי '+m.covered+'/30');return 'שפל '+formatMoney_(m.minimum)+' בתאריך '+m.minimumDate;});
  test('התאמת תזרים מתוכנן',function(){const r=getPlannedReconciliationV59_();return 'זכאים '+r.eligible+' | התאמות בטוחות '+r.matched+' | לבדיקה '+r.review;});
  test('מוח אחד — KPI תקציב',function(){const errors=[];validateCoreKpiViewParityV510_(getFinancialSnapshotV510_(),errors);if(errors.length)throw new Error(errors.join(' | '));return 'תקציב חודשי ודשבורד תואמים ל-Core';});
  test('עקביות KPI',function(){const h=healthCheckV56_();if(!h.ok)throw new Error(h.errors.join(' | '));return h.warnings.length?('אזהרות: '+h.warnings.length):'ללא אזהרות';});
  const failed=tests.filter(function(t){return t.status==='FAIL';});
  const summary=(failed.length?'🔴 ':'🟢 ')+(tests.length-failed.length)+'/'+tests.length+' בדיקות עברו'+(failed.length?'\n\n'+failed.map(function(t){return '• '+t.name+': '+t.detail;}).join('\n'):'');
  safeLogSync_({action:'Runtime Self Test '+V56.VERSION,status:failed.length?'ERROR':'SUCCESS',records:tests.length,message:summary,syncState:'SELF_TEST',health:summary});
  SpreadsheetApp.getUi().alert('בדיקות Runtime '+V56.VERSION,summary,SpreadsheetApp.getUi().ButtonSet.OK);
  return{ok:failed.length===0,tests:tests,summary:summary};
}

function healthCheckV56_(){
  const errors=[],warnings=[];let autoBalance=NaN;
  try{validateRequiredSheets_();validateSyncSchema_();validateModelLayout_();}catch(e){return healthResult_([String(e.message||e)],warnings,autoBalance);}
  const ss=getSpreadsheet_();if(ss.getSpreadsheetTimeZone()!==V56.TIMEZONE)errors.push('אזור הזמן בגיליון אינו Asia/Jerusalem');
  const anchor=getConfigParam_('תאריך ושעת יתרת עו״ש');const balance=numberOrNaN_(getConfigParam_('יתרת עו״ש נוכחית ידנית'));autoBalance=numberOrNaN_(getConfigParam_('יתרת עו״ש מחושבת אוטומטית'));
  if(!isValidDate_(anchor)||!isFinite(balance))errors.push('עוגן העו״ש חסר או אינו תקין');if(isValidDate_(anchor)&&anchor.getTime()>Date.now())errors.push('מועד עוגן העו״ש נמצא בעתיד');if(!isFinite(autoBalance))errors.push('יתרת עו״ש מחושבת אינה מספר תקין');
  const autoRow=findConfigRow_('יתרת עו״ש מחושבת אוטומטית',false);if(autoRow){const expected=bankBalanceFormula_('B'+findConfigRow_('יתרת עו״ש נוכחית ידנית',false),'B'+findConfigRow_('תאריך ושעת יתרת עו״ש',false));if(getSheet_('CONFIG').getRange(autoRow,2).getFormula()!==expected)errors.push('נוסחת העו״ש אינה תואמת לגרסה; נדרש setupV56');}
  const cash=getSheet_('CASHFLOW');const cashRows=cash.getRange(2,1,Math.max(1,cash.getLastRow()-1),7).getValues();const first=cashRows[0];
  if(!isValidDate_(first[0])||!isFinite(numberOrNaN_(first[1])))errors.push('נקודת פתיחת התזרים חסרה');else if(isValidDate_(anchor)&&dayKey_(first[0])!==dayKey_(anchor))errors.push('התזרים אינו מתחיל ביום עוגן העו״ש');if(isFinite(balance)&&isFinite(numberOrNaN_(first[1]))&&Math.abs(balance-Number(first[1]))>0.01)errors.push('יתרת פתיחת התזרים שונה מהעוגן');
  const end=endOfCashflow_(cashRows);const annual=getSheet_('ANNUAL_CASHFLOW');const opening=numberOrNaN_(annual.getRange('B4').getValue());if(!isFinite(end.value))errors.push('יתרת סוף חודש בתזרים חסרה');if(!isFinite(opening)||Math.abs(opening-end.value)>0.01)errors.push('פתיחת הגאנט אינה שווה לסוף החודש בתזרים');if(annual.getRange('B4').getFormula()!==endOfMonthFormula_())errors.push('מקור פתיחת הגאנט אינו הפניה ישירה לסוף החודש בתזרים');
  const annualRows=annual.getRange(16,1,Math.max(1,annual.getLastRow()-15),9).getValues();if(end.day&&(!isValidDate_(annualRows[0][0])||dayKey_(annualRows[0][0])!==addDaysKey_(end.day,1)))errors.push('קיים פער תאריכים בין סוף התזרים לתחילת הגאנט');const horizon=forecastWindow_(cashRows,annualRows,new Date());if(horizon.covered!==30)errors.push('תחזית 30 יום מכסה '+horizon.covered+' מתוך 30 ימים');
  const goalRow=findGoalRow_();const goal=numberOrNaN_(getSheet_('GOALS').getRange(goalRow,2).getValue());const targetRow=findConfigRow_('יעד כרית ביטחון',false);if(getSheet_('CONFIG').getRange(targetRow,2).getFormula()!=="='יעדים'!B"+goalRow)errors.push('יעד ההגדרות אינו מפנה למקור היחיד ביעדים');if(annual.getRange('B10').getFormula()!=="='יעדים'!B"+goalRow)errors.push('יעד הגאנט אינו מפנה ליעדים');
  const plan=getSheet_('FIVE_YEAR_PLAN');const c5=plan.getRange('C5').getFormula().replace(/\s/g,'');if(c5==='=B15+C15*12')errors.push('שנה 1 בתוכנית 5 השנים מתחילה ממאזן חודשי במקום מיתרת עו״ש');
  ['CASHFLOW','ANNUAL_CASHFLOW','BUDGET','FIVE_YEAR_PLAN','PLANNED_CASHFLOW'].forEach(function(key){const sh=getSheet_(key);const formulas=sh.getDataRange().getFormulas();for(let r=0;r<formulas.length;r++)for(let c=0;c<formulas[r].length;c++){if(/(?:'לוח מחוונים'|לוח מחוונים)!/.test(formulas[r][c]))errors.push('תלות בדשבורד: '+sh.getName()+'!'+columnToLetter_(c+1)+(r+1));}});
  const tx=getSheet_('TRANSACTIONS');const rows=tx.getLastRow()>1?tx.getRange(2,1,tx.getLastRow()-1,21).getValues():[];const stats=auditTransactions_(rows);if(stats.duplicates)errors.push('נמצאו '+stats.duplicates+' מזהי עסקה כפולים');if(stats.invalid)errors.push('נמצאו '+stats.invalid+' עסקאות עם סכום/כיוון/תאריך לא תקינים');if(stats.missingMonth)warnings.push(stats.missingMonth+' עסקאות ללא חודש תזרים; יש להריץ סנכרון 12 חודשים');if(stats.ccTotal>=20&&stats.ccIncome/stats.ccTotal>0.8)errors.push('רוב עסקאות האשראי מסווגות כהכנסה; נדרש לבדוק isIncome');if(stats.legacySeen)warnings.push(stats.legacySeen+' עסקאות עם firstSeenAt חסר או באותו יום של העסקה; זמן הקליטה ההיסטורי אינו מאומת');if(stats.noId)warnings.push(stats.noId+' עסקאות ללא transactionId; זיהוי חלופי עלול לאחד עסקאות דומות');
  const verify=getSheet_('VERIFICATION');const vr=verify.getLastRow()>1?verify.getRange(2,1,verify.getLastRow()-1,9).getDisplayValues():[];const active=summarizeVerification_(vr).active;if(active)warnings.push(active+' נושאי אימות פעילים בגיליון אימות נתונים');
  const snapshot=getFinancialSnapshotV510_();validateCoreKpiViewParityV510_(snapshot,errors);if(!String(getSheet_('DASHBOARD').getRange('A5').getValue()).includes('מחושבת'))warnings.push('כרטיס העו״ש אינו מסומן כמחושב');
  const reconciliation=getPlannedReconciliationV59_();if(reconciliation.review)warnings.push(reconciliation.review+' אירועי תזרים מתוכנן דורשים בדיקת התאמה ידנית');if(reconciliation.formulaDisagreements)warnings.push(reconciliation.formulaDisagreements+' פערים בין מנוע התאמות Core לנוסחאות K–M בשלב ה-Cutover');
  const errorCells=findFormulaErrors_();if(errorCells.length)errors.push('שגיאות נוסחה ('+errorCells.length+'): '+errorCells.slice(0,12).join(', '));
  const sync=getConfigParam_('תאריך רענון אחרון');if(!isValidDate_(sync)||sync.getTime()>Date.now())warnings.push('מועד סנכרון אחרון חסר או לא תקין');else if(Date.now()-sync.getTime()>V56.SYNC_STALE_HOURS*3600000)warnings.push('הסנכרון האחרון ישן מ-'+V56.SYNC_STALE_HOURS+' שעות');if(getConfigParam_('גרסת מערכת')!==V56.VERSION)warnings.push('גרסת Core המותקנת בהגדרות אינה '+V56.VERSION);if(getConfigParam_('גרסת דשבורד')!==V56.DASHBOARD_VERSION)warnings.push('גרסת הדשבורד דורשת התקנה: '+V56.DASHBOARD_VERSION);
  const triggerCount=getRiseupSyncTriggerCount_();if(triggerCount===0)warnings.push('טריגר סנכרון RiseUp אוטומטי אינו מותקן');else if(triggerCount>1)errors.push('נמצאו '+triggerCount+' טריגרי RiseUp כפולים; יש להריץ installRiseupSyncTriggerV5');
  warnings.push('יתרת העו״ש היא אומדן. עסקאות ביום העוגן, תיקונים ועסקאות שנמחקו ב-RiseUp דורשים התאמה לבנק.');return healthResult_(errors,warnings,autoBalance);
}

function checkDuplicatesV5(){const sh=getSheet_('TRANSACTIONS');const lr=sh.getLastRow();if(lr<2)return{duplicates:0,items:[]};const vals=sh.getRange(2,1,lr-1,21).getValues();const seen=Object.create(null),dup=[];vals.forEach(function(r,i){const key=transactionKeyFromRow_(r);if(!key)return;if(seen[key]!==undefined)dup.push({key:key,rows:[seen[key]+2,i+2]});else seen[key]=i;});SpreadsheetApp.getUi().alert('בדיקת כפילויות',dup.length?'נמצאו '+dup.length+' כפילויות.':'לא נמצאו כפילויות.',SpreadsheetApp.getUi().ButtonSet.OK);return{duplicates:dup.length,items:dup};}
function scanVerificationStatusV5(){const sh=getSheet_('VERIFICATION');const lr=sh.getLastRow();const rows=lr>1?sh.getRange(2,1,lr-1,9).getDisplayValues():[];const result=summarizeVerification_(rows);SpreadsheetApp.getUi().alert('סריקת אימות','נושאים פעילים: '+result.active+' מתוך '+result.total,SpreadsheetApp.getUi().ButtonSet.OK);return result;}
function showSystemStatusV5(){const h=healthCheckV56_();const sync=getConfigParam_('תאריך רענון אחרון');const anchor=getConfigParam_('תאריך ושעת יתרת עו״ש');const text='Core: '+String(getConfigParam_('גרסת מערכת')||'')+'\nDashboard: '+String(getConfigParam_('גרסת דשבורד')||'')+'\nסנכרון אחרון: '+formatDateTime_(sync)+'\nאימות עו״ש: '+formatDateTime_(anchor)+'\n\n'+h.summary;SpreadsheetApp.getUi().alert('סטטוס מערכת',text,SpreadsheetApp.getUi().ButtonSet.OK);return text;}
function openDashboardV5(){const ss=getSpreadsheet_(),sh=getSheet_('DASHBOARD');ss.setActiveSheet(sh);sh.getRange('A1').activate();}
function installRiseupSyncTriggerV5(){deleteV5Triggers();ScriptApp.newTrigger('syncRiseUpV5').timeBased().everyHours(V56.SYNC_INTERVAL_HOURS).create();const count=getRiseupSyncTriggerCount_();if(count!==1)throw new Error('התקנת טריגר RiseUp לא הסתיימה במצב תקין; נמצאו '+count+' טריגרים');setConfigParam_('תדירות סנכרון RiseUp',V56.SYNC_INTERVAL_HOURS,'שעות','טריגר אוטומטי מאומת; syncRiseUpV5');getSpreadsheet_().toast('טריגר RiseUp הותקן: כל '+V56.SYNC_INTERVAL_HOURS+' שעות','רואה חשבון',5);return{intervalHours:V56.SYNC_INTERVAL_HOURS,triggerCount:count};}
function installHourlyTriggerV5(){return installRiseupSyncTriggerV5();}
function deleteV5Triggers(){ScriptApp.getProjectTriggers().forEach(function(t){if(t.getHandlerFunction()==='syncRiseUpV5')ScriptApp.deleteTrigger(t);});}
function getRiseupSyncTriggerCount_(){if(typeof ScriptApp==='undefined'||!ScriptApp.getProjectTriggers)return-1;return ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='syncRiseUpV5';}).length;}

function applyModelIntegrityFixes_(){validateModelLayout_();const goalRow=findGoalRow_();const config=getSheet_('CONFIG');const targetRow=findConfigRow_('יעד כרית ביטחון',false);config.getRange(targetRow,2).setFormula("='יעדים'!B"+goalRow);const annual=getSheet_('ANNUAL_CASHFLOW');annual.getRange('B4').setFormula(endOfMonthFormula_());annual.getRange('B10').setFormula("='יעדים'!B"+goalRow);const plan=getSheet_('FIVE_YEAR_PLAN');const old=plan.getRange('C5').getFormula().replace(/\s/g,'');if(old==='=B15+C15*12')plan.getRange('C5').setFormula('=B5+C15*12');}

function ensureAutomaticBankBalanceFormula_(){const sh=getSheet_('CONFIG');const balanceRow=findConfigRow_('יתרת עו״ש נוכחית ידנית',false);const anchorRow=findConfigRow_('תאריך ושעת יתרת עו״ש',false);if(!balanceRow||!anchorRow)throw new Error('חסרים פרטי עוגן יתרת עו״ש בהגדרות');const row=findConfigRow_('יתרת עו״ש מחושבת אוטומטית',true);ensureGridSize_(sh,row,4);sh.getRange(row,1).setValue('יתרת עו״ש מחושבת אוטומטית');sh.getRange(row,2).setFormula(bankBalanceFormula_('B'+balanceRow,'B'+anchorRow));sh.getRange(row,2).setNumberFormat('#,##0.00 ₪');sh.getRange(row,3).setValue('₪');const note='אומדן: עוגן + תנועות בנק מיום שאחרי העוגן ועד היום, וכן תנועות ביום העוגן שנקלטו אחריו. firstSeenAt היסטורי אינו בהכרח אמין; נדרשת התאמה לבנק. עסקאות עתידיות אינן יתרה נוכחית.';sh.getRange(row,4).setValue(note);sh.getRange(row,2).setNote(note);}
function backfillFirstSeenAt_(){return{changed:0};}
function setupTransactionHeaders_(){const sh=getSheet_('TRANSACTIONS');ensureGridSize_(sh,1,V56.TRANSACTION_HEADERS.length);sh.getRange(1,1,1,V56.TRANSACTION_HEADERS.length).setValues([V56.TRANSACTION_HEADERS]);sh.setFrozenRows(1);}
function setupBudgetHeaders_(){const sh=getSheet_('BUDGET');ensureGridSize_(sh,1,V56.BUDGET_HEADERS.length);sh.getRange(1,1,1,V56.BUDGET_HEADERS.length).setValues([V56.BUDGET_HEADERS]);sh.setFrozenRows(1);}
function setupSyncLogHeaders_(){const sh=getSheet_('SYNC_LOG');const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0];const out=current.filter(function(h,i){return h!==''||i<current.length-1;});V56.LOG_HEADERS.forEach(function(h){if(out.indexOf(h)===-1)out.push(h);});ensureGridSize_(sh,1,out.length);sh.getRange(1,1,1,out.length).setValues([out]);sh.setFrozenRows(1);}

function upsertTransactions_(transactions){const sh=getSheet_('TRANSACTIONS'),lr=sh.getLastRow(),width=V56.TRANSACTION_HEADERS.length;const existing=lr>1?sh.getRange(2,1,lr-1,width).getValues():[];const index=Object.create(null);existing.forEach(function(r,i){const key=transactionKeyFromRow_(r);if(key)index[key]=i;});let inserted=0,updated=0,unchanged=0,duplicates=0;const seenApi=Object.create(null),now=new Date(),output=existing.map(function(r){return r.slice();});transactions.forEach(function(tx){const row=normalizeTransaction_(tx,now),key=transactionKeyFromRow_(row);if(!key)return;if(seenApi[key]){duplicates++;return;}seenApi[key]=true;if(index[key]===undefined){row[20]=now;index[key]=output.length;output.push(row);inserted++;return;}const i=index[key],old=output[i];row[20]=old[20]||'';if(rowsEquivalent_(old,row,19))unchanged++;else{output[i]=row;updated++;}});if(output.length&&(inserted||updated)){ensureGridSize_(sh,output.length+1,width);sh.getRange(2,1,output.length,width).setValues(output);}return{inserted:inserted,updated:updated,unchanged:unchanged,duplicates:duplicates};}

function normalizeTransaction_(tx,now){if(!tx||typeof tx!=='object'||Array.isArray(tx))throw new Error('עסקה אינה אובייקט תקין');const rawAmount=tx.amount??tx.transactionAmount,numericAmount=numberOrNaN_(rawAmount);if(!isFinite(numericAmount))throw new Error('סכום עסקה חסר או אינו מספר תקין');const amount=Math.abs(numericAmount),month=tx.cashflowDate||tx.cashflowMonth||tx.transactionBudgetDate||'';if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('חודש תזרים אינו תקין');let direction='';if(typeof tx.isIncome==='boolean')direction=tx.isIncome?'הכנסה':'הוצאה';else{direction=tx.direction||'';if(direction==='expense')direction='הוצאה';if(direction==='income')direction='הכנסה';if(direction!=='הכנסה'&&direction!=='הוצאה')throw new Error('כיוון עסקה חסר או לא מוכר; נדרש isIncome או direction תקין');}const date=parseTransactionDate_(tx.transactionDate||tx.date||tx.actualDate);if(!isValidDate_(date))throw new Error('תאריך עסקה חסר או אינו תקין');const billingRaw=tx.billingDate||tx.chargeDate,billing=parseTransactionDate_(billingRaw);if(billingRaw&&!isValidDate_(billing))throw new Error('תאריך חיוב אינו תקין');return[tx.transactionId||tx.id||'',date,month,tx.businessName||tx.description||'',tx.categoryLabel||tx.category||'',amount,direction,tx.sourceType||tx.accountType||'',tx.source||'',tx.accountNickname||tx.accountName||'',tx.accountNumberHash||'',billing,!!tx.isInstallment,tx.installmentNumber||'',tx.totalNumberOfInstallments??tx.totalNumberOfPayments??tx.totalInstallments??'',!!tx.isPostponed,tx.commitmentId||'',tx.actualType||'',tx.categoryType||'',now,''];}
function transactionFingerprintFromRow_(r){if(!r||!r.slice(0,19).some(function(v){return v!==''&&v!==null&&v!==undefined;}))return'';function day(v){return isValidDate_(v)?Utilities.formatDate(v,V56.TIMEZONE,'yyyy-MM-dd'):String(v||'');}return JSON.stringify([day(r[1]),r[3]||'',r[5]??'',r[6]||'',r[7]||'',r[8]||'',r[10]||'',day(r[11]),r[13]??'',r[14]??'']);}
function rowsEquivalent_(a,b,compareCols){for(let i=0;i<compareCols;i++){const av=a[i]instanceof Date?a[i].getTime():String(a[i]??''),bv=b[i]instanceof Date?b[i].getTime():String(b[i]??'');if(av!==bv)return false;}return true;}

function syncBudget_(month,response){if(!response||typeof response!=='object'||Array.isArray(response))throw new Error('תגובת Budget אינה תקינה');if(response.budgetDate&&response.budgetDate!==month)throw new Error('חודש התקציב אינו תואם לבקשה');const envelopes=Array.isArray(response.envelopes)?response.envelopes:(Array.isArray(response.budget)?response.budget:null);if(!envelopes)throw new Error('תגובת Budget אינה מכילה מערך תקציב תקין; הנתונים הקיימים נשמרו');const raw=stableJson_({month:month,envelopes:envelopes}),hash=sha256_(raw),previous=String(getConfigParam_('cashflowHash אחרון')||'');if(previous===hash)return false;const rows=envelopes.map(function(env){return[month,env.id||env.envelopeId||'',env.type||env.name||'',budgetAmount_(env.originalAmount??0),budgetAmount_(env.balancedAmount??env.amount??0),parseDateSafe_(env.balanceDate),parseDateSafe_(response.lastUpdatedAt||env.lastUpdatedAt),hash,JSON.stringify(env)];});const sh=getSheet_('BUDGET'),previousRows=Math.max(0,sh.getLastRow()-1);ensureGridSize_(sh,rows.length+1,V56.BUDGET_HEADERS.length);if(rows.length)sh.getRange(2,1,rows.length,V56.BUDGET_HEADERS.length).setValues(rows);if(previousRows>rows.length)sh.getRange(rows.length+2,1,previousRows-rows.length,V56.BUDGET_HEADERS.length).clearContent();setConfigParam_('cashflowHash אחרון',hash,'','SHA-256 של תגובת Budget האחרונה');return true;}

function riseupGet_(path,pat){let wait=V56.INITIAL_RETRY_MS;for(let attempt=1;attempt<=V56.MAX_RETRIES;attempt++){let res;try{res=UrlFetchApp.fetch(V56.API_BASE+path,{method:'get',headers:{Authorization:'Bearer '+pat,Accept:'application/json'},muteHttpExceptions:true});}catch(e){if(attempt===V56.MAX_RETRIES)throw new Error('תקלה ברשת בעת פנייה ל-RiseUp');Utilities.sleep(wait);wait*=2;continue;}const code=res.getResponseCode();const headers=res.getAllHeaders?res.getAllHeaders():{};if(code>=200&&code<300){let obj;try{obj=JSON.parse(res.getContentText());}catch(e){throw new Error('RiseUp החזיר JSON לא תקין');}if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Error('RiseUp החזיר מבנה תגובה לא תקין');let tokenRef='';Object.keys(headers).forEach(function(k){if(k.toLowerCase()==='x-riseup-token-ref')tokenRef=String(headers[k]);});obj._meta=Object.assign({},obj._meta,{tokenRef:tokenRef});return obj;}if(code===401)throw new Error('RiseUp PAT פג/בוטל (401).');if(code===403)throw new Error('RiseUp PAT חסר הרשאה מתאימה (403).');if(code===429){const retryAfter=riseupRetryAfterSeconds_(headers);throw new Error('RiseUp rate limit (429). הסנכרון נעצר ללא retry אוטומטי'+(retryAfter>0?'; ניתן לנסות שוב בעוד '+retryAfter+' שניות.':'.'));}if(code>=500){if(attempt<V56.MAX_RETRIES){Utilities.sleep(wait);wait*=2;}continue;}throw new Error('RiseUp API החזיר HTTP '+code);}throw new Error('RiseUp API לא הגיב לאחר מספר ניסיונות.');}
function riseupRetryAfterSeconds_(headers){if(!headers||typeof headers!=='object')return 0;let value='';Object.keys(headers).some(function(k){if(k.toLowerCase()==='retry-after'){value=String(headers[k]||'').trim();return true;}return false;});if(!value)return 0;const seconds=Number(value);if(isFinite(seconds)&&seconds>0)return Math.ceil(seconds);const dateMs=Date.parse(value);if(isFinite(dateMs))return Math.max(1,Math.ceil((dateMs-Date.now())/1000));return 0;}
function getSyncMonths_(){return syncMonthsAt_(new Date(),V56.SAFETY_MONTHS);}

function refreshDuplicateFormulas_(){const sh=getSheet_('TRANSACTIONS'),lr=sh.getLastRow(),width=Math.max(22,sh.getLastColumn());ensureGridSize_(sh,Math.max(lr,2),width);const headers=sh.getRange(1,1,1,width).getDisplayValues()[0];let col=headers.indexOf('סטטוס כפילות')+1;if(!col){col=headers[21]?width+1:22;ensureGridSize_(sh,Math.max(lr,2),col);sh.getRange(1,col).setValue('סטטוס כפילות');}if(lr<2)return;const rows=sh.getRange(2,1,lr-1,21).getValues(),counts=Object.create(null);rows.forEach(function(r){const k=transactionKeyFromRow_(r);if(k)counts[k]=(counts[k]||0)+1;});const out=rows.map(function(r){const k=transactionKeyFromRow_(r);return[!k?'':counts[k]>1?'⚠️ כפילות':'ייחודי'];});sh.getRange(2,col,out.length,1).setValues(out);}

function findFormulaErrors_(){
  const bad=[];
  const keys=['CASHFLOW','ANNUAL_CASHFLOW','BUDGET','MONTHLY_BUDGET','FIVE_YEAR_PLAN','PLANNED_CASHFLOW','CONFIG','GOALS','CREDIT_CARDS','DASHBOARD'];
  keys.forEach(function(key){
    const sh=getSheet_(key),lr=sh.getLastRow(),lc=sh.getLastColumn();
    if(!lr||!lc)return;
    const range=sh.getRange(1,1,lr,lc);
    const vals=range.getDisplayValues();
    const formulas=range.getFormulas();
    for(let r=0;r<formulas.length;r++)for(let c=0;c<formulas[r].length;c++){
      if(formulas[r][c]&&/^#(?:REF!|VALUE!|N\/A|DIV\/0!|NAME\?|NUM!|ERROR!|NULL!)/.test(vals[r][c]))bad.push(sh.getName()+'!'+columnToLetter_(c+1)+(r+1));
    }
  });
  return bad;
}

function validateRequiredSheets_(){const ss=getSpreadsheet_(),missing=[];Object.keys(V56.SHEET_NAMES).forEach(function(k){if(!ss.getSheetByName(V56.SHEET_NAMES[k]))missing.push(V56.SHEET_NAMES[k]);});if(missing.length)throw new Error('חסרים גיליונות: '+missing.join(', '));}
function formatSystemSheetsRTL_(){getSpreadsheet_().getSheets().forEach(function(sh){sh.setRightToLeft(true);const lr=sh.getLastRow(),lc=sh.getLastColumn();if(lr&&lc)sh.getRange(1,1,lr,lc).setHorizontalAlignment('right');});}
function setConfigParam_(name,value,unit,note){const sh=getSheet_('CONFIG'),row=findConfigRow_(name,true);ensureGridSize_(sh,row,4);sh.getRange(row,1,1,4).setValues([[name,value,unit||'',note||'']]);}
function getConfigParam_(name){const sh=getSheet_('CONFIG'),row=findConfigRow_(name,false);return row?sh.getRange(row,2).getValue():'';}
function findConfigRow_(name,create){const sh=getSheet_('CONFIG'),lr=Math.max(sh.getLastRow(),1),vals=sh.getRange(1,1,lr,1).getDisplayValues();for(let i=0;i<vals.length;i++)if(vals[i][0]===name)return i+1;if(!create)return 0;return lr+1;}
function getAutomaticBankBalance_(){const v=getConfigParam_('יתרת עו״ש מחושבת אוטומטית');return v===''?'':Number(v);}
function getLastNumericValue_(sheet,col,startRow){const lr=sheet.getLastRow();if(lr<startRow)return NaN;const rows=sheet.getRange(startRow,col,lr-startRow+1,1).getValues();for(let i=rows.length-1;i>=0;i--){const n=numberOrNaN_(rows[i][0]);if(isFinite(n))return n;}return NaN;}
function getSheet_(key){const name=V56.SHEET_NAMES[key]||key,sh=getSpreadsheet_().getSheetByName(name);if(!sh)throw new Error('לא נמצא גיליון: '+name);return sh;}
function getSpreadsheet_(){return SpreadsheetApp.openById(V56.SPREADSHEET_ID);}

function logSync_(x){const sh=getSheet_('SYNC_LOG');setupSyncLogHeaders_();const values=[x.time||new Date(),x.action||'',x.status||'',x.records||0,x.message||'',x.cashflowHash||getConfigParam_('cashflowHash אחרון')||'',x.riseupLastUpdatedAt||'',x.syncState||'',x.tokenRef||'',x.durationMs||'',x.inserted||0,x.updated||0,x.duplicates||0,x.balanceBefore??'',x.balanceAfter??'',x.health||''];const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];ensureGridSize_(sh,sh.getLastRow()+1,headers.length);sh.appendRow(headers.map(function(h){const i=V56.LOG_HEADERS.indexOf(h);return i<0?'':values[i];}));}
function showSyncToast_(m,h){getSpreadsheet_().toast('חדשות '+m.inserted+' | עודכנו '+m.updated+' | עו״ש '+formatMoney_(m.balanceAfter)+'\n'+(h.status==='SUCCESS'?'🟢 תקין':h.ok?'🟡 אזהרות':'🔴 דורש בדיקה'),'RiseUp Sync '+V56.VERSION,8);}
function sha256_(text){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8);return bytes.map(function(b){const v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');}
function parseDateSafe_(v){if(v===''||v===null||v===undefined)return'';if(v instanceof Date)return isValidDate_(v)?v:'';if(typeof v!=='string')return'';const d=new Date(v);return isValidDate_(d)?d:'';}
function formatMonth_(d){return Utilities.formatDate(d,V56.TIMEZONE,'yyyy-MM');}
function formatDateTime_(d){return isValidDate_(d)?Utilities.formatDate(d,V56.TIMEZONE,'dd/MM/yyyy HH:mm'):'לא ידוע';}
function formatMoney_(n){return isFinite(numberOrNaN_(n))?Number(n).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪':'לא זמין';}
function columnToLetter_(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}

function bankBalanceFormula_(balance,anchor){function sum(direction,sameDay){const base="SUMIFS('תנועות'!F2:F,'תנועות'!H2:H,\"checkingAccount\",'תנועות'!G2:G,\""+direction+'\",';const dates=sameDay?"'תנועות'!B2:B,\">=\"&INT("+anchor+"),'תנועות'!B2:B,\"<\"&INT("+anchor+")+1,'תנועות'!U2:U,\">\"&"+anchor+",":"'תנועות'!B2:B,\">=\"&INT("+anchor+")+1,";return base+dates+"'תנועות'!B2:B,\"<\"&TODAY()+1)";}return '=IF(OR(NOT(ISNUMBER('+balance+')),NOT(ISNUMBER('+anchor+'))),"",'+balance+'+'+sum('הכנסה',false)+'-'+sum('הוצאה',false)+'+'+sum('הכנסה',true)+'-'+sum('הוצאה',true)+')';}
function transactionKeyFromRow_(r){const id=String(r[0]??'').trim();return id?'id:'+id:(transactionFingerprintFromRow_(r)?'fp:'+transactionFingerprintFromRow_(r):'');}
function summarizeVerification_(rows){let active=0,total=0;rows.forEach(function(r){if(!r[0])return;total++;const lifecycle=String(r[8]||'').trim();if(/נסגר|הוחלף|לא פעיל/.test(lifecycle))return;if(lifecycle){if(/פעיל|דורש רענון/.test(lifecycle))active++;return;}const status=String(r[5]||'');if(!/לא פעיל|נסגר|הוחלף/.test(status)&&/פעיל|דורש|פער|חסר|לא אומת|חלקית/.test(status))active++;});return{active:active,total:total};}
function syncMonthsAt_(now,count){const current=formatMonth_(now).split('-').map(Number),out=[];for(let i=0;i<count;i++){const index=current[0]*12+current[1]-1-i;out.push(Math.floor(index/12)+'-'+String(index%12+1).padStart(2,'0'));}return out;}
function parseTransactionDate_(v){if(v instanceof Date)return isValidDate_(v)?v:'';if(!v||typeof v!=='string')return'';if(!/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(v))return'';const day=v.slice(0,10);try{const d=Utilities.parseDate(day,V56.TIMEZONE,'yyyy-MM-dd');return Utilities.formatDate(d,V56.TIMEZONE,'yyyy-MM-dd')===day?d:'';}catch(e){return'';}}
function isValidDate_(v){return v instanceof Date&&isFinite(v.getTime());}
function numberOrNaN_(value){if((typeof value!=='number'&&typeof value!=='string')||(typeof value==='string'&&value.trim()===''))return NaN;return Number(value);}
function requireTransactions_(response){if(!response||!Array.isArray(response.transactions))throw new Error('תגובת Transactions אינה תקינה; הסנכרון הופסק');return response.transactions;}
function withCashflowMonth_(transactions,month){return transactions.map(function(tx){if(!tx||typeof tx!=='object'||Array.isArray(tx))throw new Error('עסקה אינה אובייקט תקין');return Object.assign({},tx,{cashflowMonth:tx.cashflowDate||tx.cashflowMonth||tx.transactionBudgetDate||month});});}
function budgetAmount_(v){const n=numberOrNaN_(v);if(!isFinite(n))throw new Error('סכום תקציב אינו תקין; הנתונים הקיימים נשמרו');return n;}
function stableJson_(value){if(Array.isArray(value))return'['+value.map(stableJson_).join(',')+']';if(value&&typeof value==='object')return'{'+Object.keys(value).sort().filter(function(k){return value[k]!==undefined;}).map(function(k){return JSON.stringify(k)+':'+stableJson_(value[k]);}).join(',')+'}';return JSON.stringify(value);}
function ensureGridSize_(sh,rows,cols){if(sh.getMaxRows()<rows)sh.insertRowsAfter(sh.getMaxRows(),rows-sh.getMaxRows());if(sh.getMaxColumns()<cols)sh.insertColumnsAfter(sh.getMaxColumns(),cols-sh.getMaxColumns());}

function validateSyncSchema_(){[['TRANSACTIONS',V56.TRANSACTION_HEADERS],['BUDGET',V56.BUDGET_HEADERS]].forEach(function(pair){const sh=getSheet_(pair[0]),actual=sh.getRange(1,1,1,Math.min(sh.getMaxColumns(),pair[1].length)).getDisplayValues()[0];pair[1].forEach(function(h,i){if(actual[i]!==h&&!(sh.getLastRow()<=1&&!actual[i]))throw new Error('מבנה עמודות לא תואם: '+sh.getName()+'!'+columnToLetter_(i+1)+'1; צפוי '+h);});});}
function validateModelLayout_(){const checks=[['ANNUAL_CASHFLOW','A4','יתרת פתיחה'],['ANNUAL_CASHFLOW','A10','כרית'],['FIVE_YEAR_PLAN','A5','יתרת עו״ש'],['FIVE_YEAR_PLAN','A15','מאזן חודשי']];checks.forEach(function(x){if(!String(getSheet_(x[0]).getRange(x[1]).getValue()).includes(x[2]))throw new Error('מבנה המודל השתנה: '+x[0]+'!'+x[1]);});['יתרת עו״ש נוכחית ידנית','תאריך ושעת יתרת עו״ש','יעד כרית ביטחון','חודש ניתוח'].forEach(function(name){if(!findConfigRow_(name,false))throw new Error('חסרה הגדרה: '+name);});const row=findGoalRow_();if(!(numberOrNaN_(getSheet_('GOALS').getRange(row,2).getValue())>0))throw new Error('יעד כרית הביטחון אינו תקין');}
function findGoalRow_(){const sh=getSheet_('GOALS'),rows=sh.getRange(1,1,Math.max(1,sh.getLastRow()),1).getDisplayValues(),matches=[];rows.forEach(function(r,i){if(r[0]==='כרית ביטחון / חיסכון ראשון')matches.push(i+1);});if(matches.length!==1)throw new Error('נדרש יעד כרית ביטחון יחיד בשם כרית ביטחון / חיסכון ראשון');return matches[0];}
function endOfMonthFormula_(){return '=IFERROR(INDEX(FILTER(\'תזרים\'!G2:G,\'תזרים\'!A2:A=EOMONTH(\'תזרים\'!A2,0),ISNUMBER(\'תזרים\'!G2:G)),1),"")';}
function safeLogSync_(x){try{logSync_(x);}catch(e){console.error('כתיבת יומן סנכרון נכשלה; השגיאה המקורית נשמרת');}}
function healthResult_(errors,warnings,balance){const status=errors.length?'ERROR':warnings.length?'WARNING':'SUCCESS';let summary=(errors.length?'🔴 נמצאו תקלות':warnings.length?'🟡 הבדיקות הסתיימו עם אזהרות':'🟢 הבדיקות תקינות')+'\n\nיתרת עו״ש מחושבת: '+formatMoney_(balance);if(errors.length)summary+='\n\nתקלות:\n• '+errors.join('\n• ');if(warnings.length)summary+='\n\nאזהרות:\n• '+warnings.join('\n• ');return{ok:errors.length===0,status:status,errors:errors,warnings:warnings,summary:summary};}
function dayKey_(d){return isValidDate_(d)?Utilities.formatDate(d,V56.TIMEZONE,'yyyy-MM-dd'):'';}
function addDaysKey_(key,days){return new Date(Date.parse(key+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);}
function endOfCashflow_(rows){if(!rows.length||!isValidDate_(rows[0][0]))return{value:NaN,day:''};const month=dayKey_(rows[0][0]).slice(0,7),parts=month.split('-').map(Number),last=new Date(Date.UTC(parts[0],parts[1],0)).toISOString().slice(0,10),row=rows.find(function(r){return dayKey_(r[0])===last;});return{value:row?numberOrNaN_(row[6]):NaN,day:last};}
function forecastWindow_(cashRows,annualRows,now){const map=Object.create(null);annualRows.forEach(function(r){if(isValidDate_(r[0])&&isFinite(numberOrNaN_(r[8])))map[dayKey_(r[0])]=Number(r[8]);});cashRows.forEach(function(r){if(isValidDate_(r[0])&&isFinite(numberOrNaN_(r[6])))map[dayKey_(r[0])]=Number(r[6]);});const values=[];let minimum=Infinity,minimumDate='';for(let i=0;i<30;i++){const key=addDaysKey_(dayKey_(now),i);if(map[key]!==undefined){const value=map[key];values.push(value);if(value<minimum){minimum=value;minimumDate=key;}}}return{covered:values.length,minimum:values.length===30?minimum:NaN,minimumDate:values.length===30?minimumDate:'',values:values};}
function getForecast30DayMetrics_(){const cash=getSheet_('CASHFLOW');const annual=getSheet_('ANNUAL_CASHFLOW');const cashRows=cash.getRange(2,1,Math.max(1,cash.getLastRow()-1),7).getValues();const annualRows=annual.getRange(16,1,Math.max(1,annual.getLastRow()-15),9).getValues();return forecastWindow_(cashRows,annualRows,new Date());}

function getBudgetMetricsV510_(){
  const month=String(getConfigParam_('חודש ניתוח')||'').trim();if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('חודש ניתוח אינו תקין: '+month);
  const tx=getSheet_('TRANSACTIONS'),txRows=tx.getLastRow()>1?tx.getRange(2,1,tx.getLastRow()-1,21).getValues():[];
  let actualIncome=0,actualExpenses=0,actualFixed=0,actualVariable=0;
  txRows.forEach(function(r){if(String(r[2]||'')!==month)return;const amount=numberOrNaN_(r[5]);if(!isFinite(amount))return;const direction=String(r[6]||''),actualType=String(r[17]||'');if(direction==='הכנסה')actualIncome+=Number(amount);if(direction==='הוצאה'){actualExpenses+=Number(amount);if(actualType==='fixed')actualFixed+=Number(amount);if(actualType==='variable')actualVariable+=Number(amount);}});
  const budgetSheet=getSheet_('BUDGET'),budgetRows=budgetSheet.getLastRow()>1?budgetSheet.getRange(2,1,budgetSheet.getLastRow()-1,V56.BUDGET_HEADERS.length).getValues():[];
  let variableBudget=0,fixedBudget=0;
  budgetRows.forEach(function(r){if(String(r[0]||'')!==month)return;const amount=numberOrNaN_(r[3]);if(!isFinite(amount)||amount<=0)return;const type=String(r[2]||'');if(type==='trackingCategory')variableBudget+=Number(amount);if(type==='fixed')fixedBudget+=Number(amount);});
  const annual=getSheet_('ANNUAL_CASHFLOW'),salary=numberOrNaN_(annual.getRange('B5').getValue()),benefit=numberOrNaN_(annual.getRange('B7').getValue()),baseExpenses=numberOrNaN_(annual.getRange('B9').getValue());
  const plannedIncome=isFinite(salary)&&isFinite(benefit)?salary+benefit:NaN,plannedBalance=isFinite(plannedIncome)&&isFinite(baseExpenses)?plannedIncome-baseExpenses:NaN,actualBalance=actualIncome-actualExpenses,variableRemaining=variableBudget-actualVariable;
  const status=variableRemaining<0?'🔴 חריגה של '+Math.round(Math.abs(variableRemaining)).toLocaleString('he-IL')+' ₪ ממסגרת המשתנות':actualBalance<0?'🟡 המשתנות בתוך המסגרת, אבל המאזן החודשי עדיין שלילי':'🟢 התקציב החודשי בשליטה כרגע';
  return{month:month,actualIncome:actualIncome,actualExpenses:actualExpenses,actualFixed:actualFixed,actualVariable:actualVariable,variableBudget:variableBudget,variableRemaining:variableRemaining,fixedBudget:fixedBudget,actualBalance:actualBalance,plannedIncome:plannedIncome,plannedExpenses:baseExpenses,plannedBalance:plannedBalance,status:status};
}

function getCreditMetricsV510_(){const sh=getSheet_('CREDIT_CARDS'),rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,9).getValues():[];let chargeSum=0,limitSum=0,maxRatio=-Infinity,maxCard='לא זמין',eligibleCount=0;rows.forEach(function(r){const id=String(r[0]||'').trim(),name=String(r[2]||'').trim(),charge=numberOrNaN_(r[4]),limit=numberOrNaN_(r[6]),ratio=numberOrNaN_(r[7]),status=String(r[8]||'');if(!id||!(limit>0)||!isFinite(ratio)||/זהות.*אימות/.test(status))return;eligibleCount++;if(isFinite(charge)){chargeSum+=Number(charge);limitSum+=Number(limit);}if(Number(ratio)>maxRatio){maxRatio=Number(ratio);maxCard=name||id;}});const target=numberOrNaN_(getConfigParam_('יעד ניצול אשראי'));return{eligibleCards:eligibleCount,aggregateUtilizationPct:limitSum>0?chargeSum/limitSum*100:NaN,maxUtilizationPct:isFinite(maxRatio)?maxRatio*100:NaN,maxCardName:maxCard,targetUtilizationPct:isFinite(target)?target*100:NaN};}
function getSafetyBufferMetricsV510_(){const row=findGoalRow_(),sh=getSheet_('GOALS'),target=numberOrNaN_(sh.getRange(row,2).getValue()),current=numberOrNaN_(sh.getRange(row,3).getValue());return{target:target,current:current,gap:isFinite(target)&&isFinite(current)?Math.max(0,target-current):NaN};}

function getFinancialSnapshotV510_(){const cash=getSheet_('CASHFLOW'),annual=getSheet_('ANNUAL_CASHFLOW');const cashRows=cash.getRange(2,1,Math.max(1,cash.getLastRow()-1),7).getValues(),annualRows=annual.getRange(16,1,Math.max(1,annual.getLastRow()-15),9).getValues();const forecast=forecastWindow_(cashRows,annualRows,new Date()),end=endOfCashflow_(cashRows),currentBalance=numberOrNaN_(getConfigParam_('יתרת עו״ש מחושבת אוטומטית')),checkingFrame=numberOrNaN_(getConfigParam_('מסגרת עו״ש מאומתת'));let breachDate='',breachAmount=NaN;if(isFinite(checkingFrame)&&checkingFrame>0&&forecast.covered===30){for(let i=0;i<forecast.values.length;i++){const value=forecast.values[i];const date=addDaysKey_(dayKey_(new Date()),i);if(value<-checkingFrame){breachDate=date;breachAmount=value;break;}}}return{version:V56.VERSION,calculatedAt:new Date(),currentBalance:currentBalance,monthEnd:end.value,monthEndDate:end.day,low30:forecast.minimum,low30Date:forecast.minimumDate,coveredDays:forecast.covered,checkingFrame:checkingFrame,remainingFrameAtLow:isFinite(checkingFrame)&&checkingFrame>0&&isFinite(forecast.minimum)?checkingFrame+forecast.minimum:NaN,breachDate:breachDate,breachAmount:breachAmount,lastSync:getConfigParam_('תאריך רענון אחרון'),bankVerifiedAt:getConfigParam_('תאריך ושעת יתרת עו״ש'),budget:getBudgetMetricsV510_(),credit:getCreditMetricsV510_(),safetyBuffer:getSafetyBufferMetricsV510_()};}
function getFinancialSnapshotV58_(){return getFinancialSnapshotV510_();}

function refreshBudgetViewKpisV510_(optionalSnapshot){const s=optionalSnapshot||getFinancialSnapshotV510_(),b=s.budget,sh=getSheet_('MONTHLY_BUDGET');[['A5',b.actualIncome],['C5',b.actualExpenses],['E5',b.variableBudget],['G5',b.variableRemaining],['A8',b.actualFixed],['C8',b.actualVariable],['E8',b.fixedBudget],['G8',b.actualBalance]].forEach(function(x){sh.getRange(x[0]).setValue(x[1]).setNumberFormat('#,##0.00 ₪').setNote('KPI מחושב ב-Core '+V56.VERSION+' | חודש '+b.month);});sh.getRange('A9').setValue(b.status).setNote('סטטוס מחושב ב-Core '+V56.VERSION);return b;}
function refreshFinancialViewsV510_(){const snapshot=getFinancialSnapshotV510_();refreshBudgetViewKpisV510_(snapshot);if(typeof refreshDashboardForecastKpiV56==='function')refreshDashboardForecastKpiV56(null,snapshot);return snapshot;}
function coreKpiSameV510_(actual,expected){if(isFinite(numberOrNaN_(actual))&&isFinite(numberOrNaN_(expected)))return Math.abs(Number(actual)-Number(expected))<=0.01;return String(actual??'')===String(expected??'');}
function validateCoreKpiViewParityV510_(snapshot,errors){const b=snapshot.budget,sh=getSheet_('MONTHLY_BUDGET'),budgetChecks=[['A5',b.actualIncome],['C5',b.actualExpenses],['E5',b.variableBudget],['G5',b.variableRemaining],['A8',b.actualFixed],['C8',b.actualVariable],['E8',b.fixedBudget],['G8',b.actualBalance],['A9',b.status]];budgetChecks.forEach(function(x){const cell=sh.getRange(x[0]);if(!coreKpiSameV510_(cell.getValue(),x[1]))errors.push('תקציב חודשי אינו תואם Core: '+x[0]);if(cell.getFormula())errors.push('תקציב חודשי עדיין מחשב KPI בעצמו: '+x[0]);});const d=getSheet_('DASHBOARD'),checks=[['Z2',snapshot.currentBalance],['Z3',snapshot.monthEnd],['Z4',snapshot.low30],['Z5',snapshot.credit.aggregateUtilizationPct],['Z6',snapshot.safetyBuffer.target],['Z7',snapshot.safetyBuffer.current],['Z8',snapshot.safetyBuffer.gap],['Z9',snapshot.budget.plannedBalance],['Z12',snapshot.credit.maxUtilizationPct],['Z13',snapshot.credit.maxCardName],['Z14',snapshot.credit.targetUtilizationPct],['Z15',snapshot.checkingFrame],['Z16',snapshot.remainingFrameAtLow]];checks.forEach(function(x){const cell=d.getRange(x[0]);if(!coreKpiSameV510_(cell.getValue(),x[1]))errors.push('דשבורד אינו תואם Core: '+x[0]);if(cell.getFormula())errors.push('דשבורד עדיין מחשב KPI בעצמו: '+x[0]);});}

function runPlannedReconciliationV59(){const r=getPlannedReconciliationV59_();const text='זכאים לבדיקה: '+r.eligible+'\nהתאמות בטוחות: '+r.matched+'\nלבדיקה ידנית: '+r.review+'\nללא התאמה: '+r.unmatched+'\nפערים מול נוסחאות K–M: '+r.formulaDisagreements;SpreadsheetApp.getUi().alert('התאמת תזרים מתוכנן — Core '+V56.VERSION,text,SpreadsheetApp.getUi().ButtonSet.OK);return r;}
function getPlannedReconciliationV59_(){const planned=getSheet_('PLANNED_CASHFLOW'),txSheet=getSheet_('TRANSACTIONS'),plannedValues=planned.getDataRange().getValues(),txValues=txSheet.getDataRange().getValues();if(plannedValues.length<2||txValues.length<2)return{version:V56.VERSION,eligible:0,matched:0,review:0,unmatched:0,formulaDisagreements:0,rows:[]};const headers=headerMapV59_(txValues[0]);['transactionDate','businessName','amount','direction','sourceType'].forEach(function(h){if(headers[h]==null)throw new Error('חסרה עמודה בתנועות: '+h);});const txs=[];for(let i=1;i<txValues.length;i++){const row=txValues[i];if(String(row[headers.sourceType]||'').trim()!=='checkingAccount')continue;const date=plannedReconciliationDateV59_(row[headers.transactionDate]),amount=numberOrNaN_(row[headers.amount]);if(!date||!isFinite(amount))continue;txs.push({row:i+1,date:date,amount:Math.abs(amount),direction:String(row[headers.direction]||'').trim(),business:String(row[headers.businessName]||'').trim()});}let eligible=0,matched=0,review=0,unmatched=0,formulaDisagreements=0;const rows=[];for(let r=1;r<plannedValues.length;r++){const row=plannedValues[r],date=plannedReconciliationDateV59_(row[0]),type=String(row[1]||'').trim(),description=String(row[2]||'').trim(),amount=Math.abs(numberOrNaN_(row[3])),frequency=String(row[5]||'').trim(),paymentMethod=String(row[6]||'').trim(),included=row[8]===true,status=String(row[11]||'').trim(),formulaMatchCount=numberOrNaN_(row[10]);if(!date||!isFinite(amount)||amount<=0||!included||frequency==='חודשי'||type==='העברה פנימית'||/מזומן/.test(paymentMethod)||plannedReconciliationFinalStatusV59_(status)||['הוצאה','הכנסה','זיכוי'].indexOf(type)===-1)continue;eligible++;const expectedDirection=type==='הוצאה'?'הוצאה':'הכנסה',candidates=txs.filter(function(tx){return tx.direction===expectedDirection&&Math.abs(tx.amount-amount)<=V56.RECONCILIATION_AMOUNT_TOLERANCE&&Math.abs(plannedReconciliationDaysV59_(date,tx.date))<=V56.RECONCILIATION_WINDOW_DAYS;});const scored=candidates.map(function(tx){const exactDate=plannedReconciliationDaysV59_(date,tx.date)===0?2:0;return{tx:tx,score:exactDate+plannedReconciliationTextScoreV59_(description,tx.business)};}).sort(function(a,b){return b.score-a.score;});const best=scored[0],uniqueBest=!!best&&(scored.length===1||best.score>scored[1].score),highConfidence=!!best&&uniqueBest&&(best.score>=2||(candidates.length===1&&plannedReconciliationDaysV59_(date,best.tx.date)===0));if(highConfidence)matched++;else if(candidates.length)review++;else unmatched++;const formulaCount=isFinite(formulaMatchCount)?formulaMatchCount:0;if(formulaCount!==candidates.length)formulaDisagreements++;rows.push({row:r+1,date:dayKey_(date),type:type,description:description,amount:amount,status:status,candidates:candidates.length,highConfidence:highConfidence,formulaMatchCount:formulaCount,best:best?{row:best.tx.row,date:dayKey_(best.tx.date),amount:best.tx.amount,business:best.tx.business,score:best.score}:null});}return{version:V56.VERSION,eligible:eligible,matched:matched,review:review,unmatched:unmatched,formulaDisagreements:formulaDisagreements,rows:rows};}
function plannedReconciliationFinalStatusV59_(status){const s=String(status||'').trim();return /^(?:✅\s*)?(?:בוצע\s*—\s*מאומת אוטומטית|בוצע ידנית|מאומת ידנית|נסגר|בוטל)$/.test(s);}
function plannedReconciliationDateV59_(value){if(isValidDate_(value))return new Date(value.getFullYear(),value.getMonth(),value.getDate());if(value==null||value==='')return null;const s=String(value).trim();let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return null;}
function plannedReconciliationDaysV59_(a,b){return Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate()).getTime()-new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime())/86400000);}
function plannedReconciliationTextScoreV59_(a,b){const stop={'של':1,'את':1,'עם':1,'עבור':1,'בעמ':1,'בע׳מ':1,'בעמ״':1};const ta=plannedReconciliationNormalizeV59_(a).split(' ').filter(function(t){return t.length>2&&!stop[t];}),tb=plannedReconciliationNormalizeV59_(b).split(' ').filter(function(t){return t.length>2&&!stop[t];});let score=0;ta.forEach(function(t){if(tb.indexOf(t)!==-1)score++;});return score;}
function plannedReconciliationNormalizeV59_(value){return String(value||'').toLowerCase().replace(/["'׳״.,()\[\]{}:;\-–—_/\\]/g,' ').replace(/\s+/g,' ').trim();}
function headerMapV59_(headers){const map={};headers.forEach(function(h,i){map[String(h||'').trim()]=i;});return map;}
function auditTransactions_(rows){const result={duplicates:0,invalid:0,missingMonth:0,legacySeen:0,ccTotal:0,ccIncome:0,noId:0},seen=Object.create(null),validDirections=['הכנסה','הוצאה','העברה פנימית'];rows.forEach(function(r){const key=transactionKeyFromRow_(r);if(!key)return;if(seen[key])result.duplicates++;seen[key]=true;if(!String(r[0]||'').trim())result.noId++;if(!isValidDate_(r[1])||!isFinite(numberOrNaN_(r[5]))||Number(r[5])<0||validDirections.indexOf(String(r[6]||'').trim())===-1)result.invalid++;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(r[2]||'')))result.missingMonth++;if(!isValidDate_(r[20])||(isValidDate_(r[1])&&dayKey_(r[20])===dayKey_(r[1])))result.legacySeen++;if(r[7]==='creditCard'){result.ccTotal++;if(r[6]==='הכנסה')result.ccIncome++;}});return result;}