/**
 * ============================================================
 * רואה חשבון - מערכת פיננסית
 * RiseUp Sync V5.2
 * ============================================================
 *
 * כולל:
 * - תפריט "רואה חשבון"
 * - סנכרון RiseUp
 * - סנכרון 12 חודשים
 * - מניעת כפילויות
 * - עדכון Budget
 * - יתרת עו"ש מחושבת
 * - הזנת יתרת עו"ש מאומתת
 * - פיוס יתרה
 * - Health Check
 * - סריקת סטטוסי אימות
 * - רענון תחזיות
 * - יומן סנכרון
 * - טריגר שעתי
 * - יישור RTL
 * - 4 שעוני Gauge בדשבורד
 *
 * גרסה: V5.2
 * ============================================================
 */

const V5 = {
  VERSION: 'V5.2',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  API_BASE: 'https://input.riseup.co.il',
  SAFETY_MONTHS: 2,
  LARGE_TRANSACTION_ALERT: 2000,
  MAX_RETRIES: 4,
  INITIAL_RETRY_MS: 1000,
  SHEETS: {
    DASHBOARD: 1977013179,
    PLANNED_CASHFLOW: 1547466109,
    TRANSACTIONS: 1742321487,
    ANNUAL_CASHFLOW: 1072133063,
    BUDGET: 384115864,
    CASHFLOW: 1556837313,
    CREDIT_CARDS: 815890344,
    LOANS: 914307094,
    SAVINGS: 252819601,
    GOALS: 79691250,
    RULES: 778256791,
    CONFIG: 1840391247,
    SYNC_LOG: 1397640406,
    REFERENCE_DATA: 951439932,
    ASSETS: 830329847,
    VERIFICATION: 1292157954,
    FIXED_COMMITMENTS: 245410665,
    PAYMENTS_TRACKING: 129902509,
    HISTORY_12M: 1968192006,
    FINANCIAL_SOURCES: 259364329,
    OFFICIAL_DATA: 844330871,
    OFFICIAL_FUNDS: 721693875,
    OFFICIAL_API_CONFIG: 1237513642,
    FIVE_YEAR_PLAN: 1202266497
  },
  TRANSACTION_HEADERS: [
    'transactionId','transactionDate','cashflowMonth','businessName','categoryLabel','amount','direction','sourceType','source','accountNickname','accountNumberHash','billingDate','isInstallment','installmentNumber','totalInstallments','isPostponed','commitmentId','actualType','categoryType','lastSyncedAt'
  ],
  BUDGET_HEADERS: [
    'budgetDate','envelopeId','type','originalAmount','balancedAmount','balanceDate','lastUpdatedAt','cashflowHash','rawData'
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
      ui.createMenu('🎛 לוח מחוונים')
        .addItem('📊 מעבר ללוח מחוונים', 'openDashboardV5')
        .addItem('🎯 התקנת / רענון שעונים', 'installDashboardGaugesV5')
        .addItem('🗑 הסרת שעונים', 'uninstallDashboardGaugesV5')
    )
    .addSeparator()
    .addItem('🩺 בדיקת מערכת', 'healthCheckV5')
    .addItem('🔍 בדיקת כפילויות', 'checkDuplicatesV5')
    .addItem('✅ סריקת סטטוסי אימות', 'scanVerificationStatusV5')
    .addItem('ℹ️ סטטוס מערכת', 'showSystemStatusV5')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('⚙️ הגדרות מערכת')
        .addItem('🛠 התקנת / שדרוג V5.2', 'setupV5')
        .addItem('⏰ התקנת סנכרון שעתי', 'installHourlyTriggerV5')
        .addItem('🗑 מחיקת טריגר V5', 'deleteV5Triggers')
    )
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
    setConfigParam_('גרסת מערכת', V5.VERSION, '', 'RiseUp Sync V5.2');
    setConfigParam_('מקור עסקאות', 'get_transactions', '', 'RiseUp External API');
    setConfigParam_('מפתח upsert', 'transactionId + fingerprint fallback', '', 'transactionId מפתח ראשי');
    setConfigParam_('חלון סנכרון עסקאות', V5.SAFETY_MONTHS, 'חודשים', 'חודש נוכחי + חודש קודם');
    setConfigParam_('מצב מנוע תחזיות', 'AUTO', '', 'כל נתון חדש מחייב בדיקת השפעה על התחזיות');
    ensureAutomaticBankBalanceFormula_();
    formatSystemSheetsRTL_();
    refreshDuplicateFormulas_();
    installDashboardGaugesV5_(false);
    SpreadsheetApp.flush();
    const health = healthCheckV5_();
    logSync_({action:'V5 Setup',status:health.ok?'SUCCESS':'WARNING',records:0,message:'התקנת RiseUp Sync '+V5.VERSION,syncState:'SETUP',health:health.summary});
    getSpreadsheet_().toast('V5.2 הותקן בהצלחה','רואה חשבון',8);
    return health;
  } finally { lock.releaseLock(); }
}

function setRiseupPatV5(pat) {
  if (!pat || typeof pat !== 'string') throw new Error('PAT חסר.');
  pat = pat.trim();
  if (!pat.startsWith('riseup_pat_')) throw new Error('PAT אינו בפורמט RiseUp תקין.');
  PropertiesService.getScriptProperties().setProperty('RISEUP_PAT', pat);
  getSpreadsheet_().toast('PAT נשמר ב-Script Properties','רואה חשבון',5);
}
function clearRiseupPatV5(){ PropertiesService.getScriptProperties().deleteProperty('RISEUP_PAT'); }
function getRiseupPat_(){
  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');
  if (!pat) throw new Error('RISEUP_PAT אינו מוגדר.');
  if (!pat.startsWith('riseup_pat_')) throw new Error('RISEUP_PAT אינו בפורמט תקין.');
  return pat;
}

function syncRiseUpV5(){
  const startedAt=new Date(), startMs=Date.now(), lock=LockService.getScriptLock();
  if(!lock.tryLock(10000)){ logSync_({action:'RiseUp Sync V5',status:'SKIPPED',records:0,message:'סנכרון אחר כבר פעיל',syncState:'LOCKED'}); return null; }
  const metrics={inserted:0,updated:0,unchanged:0,duplicates:0,months:[],largeTransactions:[],budgetUpdated:false,tokenRef:'',riseupLastUpdatedAt:'',balanceBefore:'',balanceAfter:'',errors:[]};
  try{
    validateRequiredSheets_();
    const pat=getRiseupPat_();
    metrics.balanceBefore=getAutomaticBankBalance_();
    metrics.months=getSyncMonths_();
    let allTransactions=[];
    metrics.months.forEach(month=>{
      const response=riseupGet_('/api/external/transactions?cashflowMonth='+encodeURIComponent(month),pat);
      if(response&&response._meta&&response._meta.tokenRef) metrics.tokenRef=response._meta.tokenRef;
      const transactions=response&&Array.isArray(response.transactions)?response.transactions:[];
      allTransactions=allTransactions.concat(transactions);
    });
    const txResult=upsertTransactions_(allTransactions);
    metrics.inserted=txResult.inserted; metrics.updated=txResult.updated; metrics.unchanged=txResult.unchanged; metrics.duplicates=txResult.duplicates; metrics.largeTransactions=txResult.largeTransactions;
    const currentMonth=formatMonth_(new Date());
    const budgetResponse=riseupGet_('/api/external/budget/'+encodeURIComponent(currentMonth),pat);
    if(budgetResponse&&budgetResponse._meta&&budgetResponse._meta.tokenRef) metrics.tokenRef=budgetResponse._meta.tokenRef;
    if(budgetResponse&&budgetResponse.lastUpdatedAt) metrics.riseupLastUpdatedAt=new Date(budgetResponse.lastUpdatedAt);
    metrics.budgetUpdated=syncBudget_(currentMonth,budgetResponse);
    setConfigParam_('תאריך רענון אחרון',new Date(),'','RiseUp Sync V5.2');
    setConfigParam_('מצב hash',metrics.budgetUpdated?'UPDATED':'SKIPPED_UNCHANGED','','Budget hash');
    ensureAutomaticBankBalanceFormula_(); refreshDuplicateFormulas_(); SpreadsheetApp.flush();
    metrics.balanceAfter=getAutomaticBankBalance_();
    const health=healthCheckV5_();
    logSync_({time:startedAt,action:'RiseUp Sync V5',status:health.ok?'SUCCESS':'WARNING',records:allTransactions.length,message:'חודשים: '+metrics.months.join(', ')+' | חדשות: '+metrics.inserted+' | עודכנו: '+metrics.updated+' | ללא שינוי: '+metrics.unchanged+' | כפילויות: '+metrics.duplicates,tokenRef:metrics.tokenRef,riseupLastUpdatedAt:metrics.riseupLastUpdatedAt,syncState:metrics.budgetUpdated?'UPDATED':'SKIPPED_UNCHANGED',durationMs:Date.now()-startMs,inserted:metrics.inserted,updated:metrics.updated,duplicates:metrics.duplicates,balanceBefore:metrics.balanceBefore,balanceAfter:metrics.balanceAfter,health:health.summary});
    showSyncToast_(metrics,health);
    return {success:health.ok,metrics:metrics,health:health};
  }catch(err){
    metrics.errors.push(String(err&&err.message?err.message:err));
    logSync_({time:startedAt,action:'RiseUp Sync V5',status:'ERROR',records:0,message:metrics.errors.join(' | '),durationMs:Date.now()-startMs,inserted:metrics.inserted,updated:metrics.updated,duplicates:metrics.duplicates,balanceBefore:metrics.balanceBefore,balanceAfter:metrics.balanceAfter,health:'ERROR'});
    throw err;
  }finally{ lock.releaseLock(); }
}

function runV5Now(){
  const ui=SpreadsheetApp.getUi();
  try{
    const result=syncRiseUpV5();
    if(!result) return;
    ui.alert('הסנכרון הסתיים','חדשות: '+result.metrics.inserted+'\nעודכנו: '+result.metrics.updated+'\nיתרת עו״ש: '+formatMoney_(result.metrics.balanceAfter)+'\n\n'+result.health.summary,ui.ButtonSet.OK);
  }catch(e){ ui.alert('שגיאת סנכרון',String(e.message||e),ui.ButtonSet.OK); throw e; }
}

function syncRiseUpHistory12MonthsV5(){
  const ui=SpreadsheetApp.getUi();
  const answer=ui.alert('סנכרון 12 חודשים','הפעולה תמשוך את 12 החודשים האחרונים ותבצע upsert ללא כפילות.\n\nלהמשיך?',ui.ButtonSet.YES_NO);
  if(answer!==ui.Button.YES) return;
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(30000)){ ui.alert('סנכרון אחר כבר פעיל.'); return; }
  const startedAt=new Date();
  try{
    const pat=getRiseupPat_(); let allTransactions=[]; const monthStats=[];
    for(let i=0;i<12;i++){
      const d=new Date(new Date().getFullYear(),new Date().getMonth()-i,1); const month=formatMonth_(d);
      const response=riseupGet_('/api/external/transactions?cashflowMonth='+encodeURIComponent(month),pat);
      const transactions=response&&Array.isArray(response.transactions)?response.transactions:[];
      allTransactions=allTransactions.concat(transactions); monthStats.push(month+': '+transactions.length);
    }
    const result=upsertTransactions_(allTransactions); ensureAutomaticBankBalanceFormula_(); SpreadsheetApp.flush();
    logSync_({time:startedAt,action:'RiseUp History 12M V5',status:'SUCCESS',records:allTransactions.length,message:monthStats.join(' | '),syncState:'HISTORY_BACKFILL',inserted:result.inserted,updated:result.updated,duplicates:result.duplicates,balanceAfter:getAutomaticBankBalance_(),health:healthCheckV5_().summary});
    ui.alert('הסנכרון ההיסטורי הסתיים','סה״כ התקבלו: '+allTransactions.length+'\nחדשות: '+result.inserted+'\nעודכנו: '+result.updated+'\nללא שינוי: '+result.unchanged,ui.ButtonSet.OK);
  }finally{ lock.releaseLock(); }
}

function riseupGet_(path,pat){
  const url=V5.API_BASE+path; let delay=V5.INITIAL_RETRY_MS, lastError=null;
  for(let attempt=1;attempt<=V5.MAX_RETRIES;attempt++){
    try{
      const response=UrlFetchApp.fetch(url,{method:'get',headers:{Authorization:'Bearer '+pat,Accept:'application/json'},muteHttpExceptions:true,followRedirects:false});
      const status=response.getResponseCode(), text=response.getContentText();
      if(status>=200&&status<300) return text?JSON.parse(text):{};
      if(status===401) throw new Error('RiseUp החזיר 401. ה-PAT פג או בוטל.');
      if(status===403) throw new Error('RiseUp החזיר 403. אין הרשאה מתאימה.');
      if(status===429||status>=500){ lastError=new Error('RiseUp API '+status+': '+text.substring(0,250)); if(attempt<V5.MAX_RETRIES){Utilities.sleep(delay); delay*=2; continue;} }
      throw new Error('RiseUp API '+status+': '+text.substring(0,500));
    }catch(err){ lastError=err; if(attempt>=V5.MAX_RETRIES) break; Utilities.sleep(delay); delay*=2; }
  }
  throw (lastError||new Error('RiseUp API request failed.'));
}

function upsertTransactions_(transactions){
  const sheet=getSheetById_(V5.SHEETS.TRANSACTIONS), now=new Date(), lastRow=Math.max(sheet.getLastRow(),1); let existingValues=[];
  if(lastRow>=2) existingValues=sheet.getRange(2,1,lastRow-1,20).getValues();
  const index={}; existingValues.forEach((row,i)=>{const id=String(row[0]||'').trim(); if(id) index[id]=i;});
  let inserted=0,updated=0,unchanged=0,duplicates=0; const appendRows=[],updates=[],incomingSeen={},largeTransactions=[];
  transactions.forEach(tx=>{
    const id=getTransactionKey_(tx); if(incomingSeen[id]){duplicates++; return;} incomingSeen[id]=true;
    const row=normalizeTransactionRow_(tx,now,id);
    if(Number(row[5])>=V5.LARGE_TRANSACTION_ALERT) largeTransactions.push({id:id,businessName:row[3],amount:row[5],direction:row[6],sourceType:row[7]});
    if(Object.prototype.hasOwnProperty.call(index,id)){
      const oldRow=existingValues[index[id]];
      if(rowsEquivalent_(oldRow,row,19)) unchanged++; else {updates.push({rowNumber:index[id]+2,values:row}); updated++;}
    }else{ appendRows.push(row); inserted++; }
  });
  updates.forEach(op=>sheet.getRange(op.rowNumber,1,1,20).setValues([op.values]));
  if(appendRows.length>0){ const startRow=sheet.getLastRow()+1; sheet.getRange(startRow,1,appendRows.length,20).setValues(appendRows); }
  refreshDuplicateFormulas_();
  return {inserted:inserted,updated:updated,unchanged:unchanged,duplicates:duplicates,largeTransactions:largeTransactions};
}

function normalizeTransactionRow_(tx,syncedAt,forcedId){
  const isIncome=tx.isIncome===true, amount=Math.abs(Number(tx.amount||0));
  const totalInstallments=tx.totalNumberOfInstallments!=null?tx.totalNumberOfInstallments:(tx.totalNumberOfPayments!=null?tx.totalNumberOfPayments:'');
  return [forcedId,isoToDate_(tx.transactionDate),tx.cashflowDate||tx.cashflowMonth||'',tx.businessName||'',tx.categoryLabel||'',amount,isIncome?'הכנסה':'הוצאה',tx.sourceType||'',tx.source||'',tx.accountNickname||'',tx.accountNumberHash||'',isoToDate_(tx.billingDate),tx.isInstallment===true,tx.installmentNumber!=null?tx.installmentNumber:'',totalInstallments,tx.isPostponed===true,tx.commitmentId||'',tx.actualType||'',tx.categoryType||'',syncedAt];
}

function getTransactionKey_(tx){
  if(tx.transactionId) return String(tx.transactionId);
  const raw=[tx.transactionDate||'',tx.businessName||'',Math.abs(Number(tx.amount||0)).toFixed(2),tx.isIncome?'I':'E',tx.sourceType||'',tx.source||'',tx.accountNumberHash||'',tx.billingDate||''].join('|');
  return 'fp_'+sha256_(raw).substring(0,32);
}

function rowsEquivalent_(oldRow,newRow,compareColumns){ for(let i=0;i<compareColumns;i++){ if(normalizeCompareValue_(oldRow[i])!==normalizeCompareValue_(newRow[i])) return false; } return true; }
function normalizeCompareValue_(value){ if(value instanceof Date) return String(value.getTime()); if(typeof value==='number') return String(Math.round(value*10000)/10000); if(value===null||value===undefined) return ''; return String(value); }

function refreshDuplicateFormulas_(){
  const sheet=getSheetById_(V5.SHEETS.TRANSACTIONS), lastRow=sheet.getLastRow(); if(lastRow<2) return;
  sheet.getRange(2,21,lastRow-1,1).setFormulaR1C1('=COUNTIF(C1,RC1)');
  sheet.getRange(2,22,lastRow-1,1).setFormulaR1C1('=IF(RC[-1]=1,"ייחודי","⚠️ כפילות")');
}

function checkDuplicatesV5(){
  const sheet=getSheetById_(V5.SHEETS.TRANSACTIONS), lastRow=sheet.getLastRow();
  if(lastRow<2){SpreadsheetApp.getUi().alert('אין עסקאות לבדיקה.'); return;}
  const ids=sheet.getRange(2,1,lastRow-1,1).getValues().flat(), count={};
  ids.forEach(id=>{id=String(id||'').trim(); if(!id)return; count[id]=(count[id]||0)+1;});
  const duplicates=Object.keys(count).filter(id=>count[id]>1);
  SpreadsheetApp.getUi().alert('בדיקת כפילויות',duplicates.length===0?'✅ לא נמצאו כפילויות.':'⚠️ נמצאו '+duplicates.length+' מזהים כפולים.',SpreadsheetApp.getUi().ButtonSet.OK);
}

function syncBudget_(month,response){
  if(!response) return false;
  const hash=sha256_(stableStringify_(response)), oldHash=String(getConfigValue_('cashflowHash אחרון')||''); if(oldHash===hash) return false;
  const sheet=getSheetById_(V5.SHEETS.BUDGET), lastUpdatedAt=response.lastUpdatedAt?new Date(response.lastUpdatedAt):new Date(), envelopes=Array.isArray(response.envelopes)?response.envelopes:[];
  const newRows=envelopes.map(env=>[response.budgetDate||month,env.id||'',env.type||'',Number(env.originalAmount||0),Number(env.balancedAmount||0),isoToDate_(env.balanceDate),lastUpdatedAt,hash,JSON.stringify(env)]);
  const existingLastRow=sheet.getLastRow(); let preservedRows=[];
  if(existingLastRow>=2){ const existing=sheet.getRange(2,1,existingLastRow-1,9).getValues(); preservedRows=existing.filter(row=>String(row[0]||'')!==String(response.budgetDate||month)); }
  const finalRows=preservedRows.concat(newRows); if(sheet.getLastRow()>1) sheet.getRange(2,1,sheet.getLastRow()-1,9).clearContent(); if(finalRows.length>0) sheet.getRange(2,1,finalRows.length,9).setValues(finalRows);
  setConfigParam_('cashflowHash אחרון',hash,'','SHA-256 של Budget האחרון'); return true;
}

function promptVerifiedBankBalanceV5(){
  const ui=SpreadsheetApp.getUi();
  const result=ui.prompt('🏦 עדכון יתרת עו״ש מאומתת','הכנס את יתרת העו״ש כפי שמופיעה בבנק.\nלדוגמה: -2396.69',ui.ButtonSet.OK_CANCEL); if(result.getSelectedButton()!==ui.Button.OK)return;
  const cleaned=result.getResponseText().replace(/,/g,'').replace(/₪/g,'').trim(), balance=Number(cleaned); if(isNaN(balance)){ui.alert('הסכום אינו תקין.'); return;}
  const source=ui.prompt('מקור האימות','לדוגמה: אפליקציית לאומי',ui.ButtonSet.OK_CANCEL); if(source.getSelectedButton()!==ui.Button.OK)return;
  const data=setVerifiedBankBalanceV5(balance,new Date(),source.getResponseText()||'אימות ידני');
  ui.alert('יתרת העו״ש עודכנה','יתרה מאומתת: '+formatMoney_(balance)+'\nפער פיוס: '+(data.reconciliationGap===''?'לא ניתן לחשב':formatMoney_(data.reconciliationGap)),ui.ButtonSet.OK);
}

function setVerifiedBankBalanceV5(balance,observedAt,sourceNote){
  if(balance===''||balance===null||isNaN(Number(balance))) throw new Error('יתרה לא תקינה.'); if(!(observedAt instanceof Date)) observedAt=observedAt?new Date(observedAt):new Date();
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try{
    const calculatedBefore=getAutomaticBankBalance_();
    setConfigParam_('יתרת עו״ש נוכחית ידנית',Number(balance),'₪','מאומת: '+sourceNote);
    setConfigParam_('תאריך ושעת יתרת עו״ש',observedAt,'תאריך/שעה','מועד עוגן יתרה');
    ensureAutomaticBankBalanceFormula_(); SpreadsheetApp.flush();
    const calculatedAfter=getAutomaticBankBalance_(), reconciliationGap=(calculatedBefore===''||calculatedBefore===null)?'':Number(balance)-Number(calculatedBefore);
    logSync_({action:'Bank Reconciliation',status:'SUCCESS',records:0,message:'עודכנה יתרת עו"ש מאומתת',syncState:'RECONCILED',balanceBefore:calculatedBefore,balanceAfter:calculatedAfter,health:'יתרה אומתה'});
    return {verifiedBalance:Number(balance),calculatedBefore:calculatedBefore,reconciliationGap:reconciliationGap,calculatedAfter:calculatedAfter};
  }finally{lock.releaseLock();}
}

function ensureAutomaticBankBalanceFormula_(){
  const sheet=getSheetById_(V5.SHEETS.CONFIG), anchorRow=findConfigRow_('יתרת עו״ש נוכחית ידנית'), anchorTimeRow=findConfigRow_('תאריך ושעת יתרת עו״ש'); let autoRow=findConfigRow_('יתרת עו״ש מחושבת אוטומטית');
  if(!autoRow){ autoRow=sheet.getLastRow()+1; sheet.getRange(autoRow,1,1,4).setValues([['יתרת עו״ש מחושבת אוטומטית','','₪','עוגן מאומת + תנועות checkingAccount חדשות']]); }
  if(!anchorRow||!anchorTimeRow) throw new Error('חסרים פרטי עוגן יתרת עו"ש.');
  const formula='=IF(OR(B'+anchorRow+'="",B'+anchorTimeRow+'=""),"",B'+anchorRow+'+SUMIFS(\'תנועות\'!F:F,\'תנועות\'!H:H,"checkingAccount",\'תנועות\'!G:G,"הכנסה",\'תנועות\'!B:B,">"&B'+anchorTimeRow+')-SUMIFS(\'תנועות\'!F:F,\'תנועות\'!H:H,"checkingAccount",\'תנועות\'!G:G,"הוצאה",\'תנועות\'!B:B,">"&B'+anchorTimeRow+'))';
  sheet.getRange(autoRow,2).setFormula(formula);
}
function getAutomaticBankBalance_(){ const row=findConfigRow_('יתרת עו״ש מחושבת אוטומטית'); if(!row)return ''; return getSheetById_(V5.SHEETS.CONFIG).getRange(row,2).getValue(); }

function refreshForecastsV5(){
  ensureAutomaticBankBalanceFormula_(); SpreadsheetApp.flush(); Utilities.sleep(500); SpreadsheetApp.flush(); setConfigParam_('רענון תחזיות אחרון',new Date(),'','רענון ידני'); const health=healthCheckV5_(); getSpreadsheet_().toast('התחזיות רועננו','רואה חשבון',5); SpreadsheetApp.getUi().alert('רענון תחזיות',health.summary,SpreadsheetApp.getUi().ButtonSet.OK);
}

function installDashboardGaugesV5(){ installDashboardGaugesV5_(true); }
function installDashboardGaugesV5_(showMessage){
  const sheet=getSheetById_(V5.SHEETS.DASHBOARD); removeDashboardGaugeChartsV5_(); buildGaugeHelperDataV5_(); createCreditExposureGaugeV5_(sheet); createEmergencyFundGaugeV5_(sheet); createMonthlyBalanceGaugeV5_(sheet); createThirtyDayLowGaugeV5_(sheet); SpreadsheetApp.flush(); if(showMessage!==false) getSpreadsheet_().toast('4 שעונים נוספו ללוח המחוונים','🎛 רואה חשבון',8);
}
function buildGaugeHelperDataV5_(){
  const sheet=getSheetById_(V5.SHEETS.DASHBOARD); sheet.getRange('Y1:Z20').clearContent();
  sheet.getRange('Y2:Z3').setValues([['מדד','ערך'],['חשיפת אשראי','']]); sheet.getRange('Z3').setFormula('=IFERROR(MAX(0,MIN(100,$B$27*100)),0)');
  sheet.getRange('Y5:Z6').setValues([['מדד','ערך'],['כרית ביטחון','']]); sheet.getRange('Z6').setFormula('=IFERROR(MAX(0,MIN(100,$B$21/\'הגדרות\'!$B$5*100)),0)');
  sheet.getRange('Y8:Z9').setValues([['מדד','ערך'],['מאזן חודשי','']]); sheet.getRange('Z9').setFormula('=IFERROR($B$23,0)');
  sheet.getRange('Y11:Z12').setValues([['מדד','ערך'],['שפל 30 יום','']]); sheet.getRange('Z12').setFormula('=IFERROR($B$17,0)');
}
function createCreditExposureGaugeV5_(sheet){ const chart=sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y2:Z3')).setPosition(2,12,0,0).setOption('title','💳 חשיפת אשראי').setOption('min',0).setOption('max',100).setOption('greenFrom',0).setOption('greenTo',30).setOption('yellowFrom',30).setOption('yellowTo',50).setOption('redFrom',50).setOption('redTo',100).setOption('minorTicks',5).setOption('width',350).setOption('height',220).build(); sheet.insertChart(chart); }
function createEmergencyFundGaugeV5_(sheet){ const chart=sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y5:Z6')).setPosition(2,18,0,0).setOption('title','🛟 כרית ביטחון').setOption('min',0).setOption('max',100).setOption('redFrom',0).setOption('redTo',25).setOption('yellowFrom',25).setOption('yellowTo',70).setOption('greenFrom',70).setOption('greenTo',100).setOption('minorTicks',5).setOption('width',350).setOption('height',220).build(); sheet.insertChart(chart); }
function createMonthlyBalanceGaugeV5_(sheet){ const chart=sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y8:Z9')).setPosition(15,12,0,0).setOption('title','📊 מאזן חודשי').setOption('min',-5000).setOption('max',5000).setOption('redFrom',-5000).setOption('redTo',0).setOption('yellowFrom',0).setOption('yellowTo',1500).setOption('greenFrom',1500).setOption('greenTo',5000).setOption('minorTicks',5).setOption('width',350).setOption('height',220).build(); sheet.insertChart(chart); }
function createThirtyDayLowGaugeV5_(sheet){ const chart=sheet.newChart().setChartType(Charts.ChartType.GAUGE).addRange(sheet.getRange('Y11:Z12')).setPosition(15,18,0,0).setOption('title','📉 שפל צפוי — 30 יום').setOption('min',-40000).setOption('max',30000).setOption('redFrom',-40000).setOption('redTo',0).setOption('yellowFrom',0).setOption('yellowTo',20000).setOption('greenFrom',20000).setOption('greenTo',30000).setOption('minorTicks',5).setOption('width',350).setOption('height',220).build(); sheet.insertChart(chart); }
function removeDashboardGaugeChartsV5_(){ const sheet=getSheetById_(V5.SHEETS.DASHBOARD); sheet.getCharts().forEach(chart=>{ const info=chart.getContainerInfo(); if(info.getAnchorColumn()>=12) sheet.removeChart(chart); }); }
function uninstallDashboardGaugesV5(){ const sheet=getSheetById_(V5.SHEETS.DASHBOARD); removeDashboardGaugeChartsV5_(); sheet.getRange('Y1:Z20').clearContent(); getSpreadsheet_().toast('השעונים הוסרו','רואה חשבון',5); }

function scanVerificationStatusV5(){
  const sheet=getSheetById_(V5.SHEETS.VERIFICATION), lastRow=sheet.getLastRow(); if(lastRow<2){SpreadsheetApp.getUi().alert('אין נתוני אימות.'); return;}
  const values=sheet.getRange(2,1,lastRow-1,Math.min(sheet.getLastColumn(),10)).getDisplayValues(), patterns=['דורש רענון','לא מאומת','סותר','פתוח','חסר','חלקי','טרם אומת'], openRows=[];
  values.forEach((row,index)=>{ const text=row.join(' | '); if(patterns.some(pattern=>text.indexOf(pattern)!==-1)) openRows.push(index+2); });
  SpreadsheetApp.getUi().alert('סריקת אימות',openRows.length===0?'✅ לא נמצאו פריטים פתוחים.':'נמצאו '+openRows.length+' פריטים הדורשים טיפול או רענון.',SpreadsheetApp.getUi().ButtonSet.OK); return openRows;
}

function healthCheckV5(){ const result=healthCheckV5_(); SpreadsheetApp.getUi().alert(result.ok?'🟢 Health Check תקין':'🟡 Health Check',result.summary,SpreadsheetApp.getUi().ButtonSet.OK); return result; }
function healthCheckV5_(){
  const issues=[]; try{validateRequiredSheets_();}catch(e){issues.push(String(e.message||e));}
  const pat=PropertiesService.getScriptProperties().getProperty('RISEUP_PAT'); if(!pat||!pat.startsWith('riseup_pat_')) issues.push('PAT חסר או לא תקין');
  const balance=getAutomaticBankBalance_(); if(balance===''||balance===null||isNaN(Number(balance))) issues.push('אין יתרת עו"ש מחושבת תקינה');
  const formulaErrors=findFormulaErrors_(); if(formulaErrors.length>0) issues.push('נמצאו '+formulaErrors.length+' שגיאות נוסחה');
  const ok=issues.length===0; return {ok:ok,issues:issues,balance:balance,formulaErrors:formulaErrors,summary:ok?'🟢 המערכת תקינה\n\nיתרת עו״ש מחושבת: '+formatMoney_(balance):'🟡 נמצאו נקודות לבדיקה:\n\n• '+issues.join('\n• ')};
}
function findFormulaErrors_(){
  const ids=[V5.SHEETS.DASHBOARD,V5.SHEETS.ANNUAL_CASHFLOW,V5.SHEETS.FIVE_YEAR_PLAN,V5.SHEETS.CONFIG], errors=[], pattern=/#REF!|#N\/A|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#ERROR!/;
  ids.forEach(id=>{ const sheet=getSheetById_(id), rows=Math.min(Math.max(sheet.getLastRow(),1),500), cols=Math.min(Math.max(sheet.getLastColumn(),1),30), values=sheet.getRange(1,1,rows,cols).getDisplayValues(); values.forEach((row,r)=>row.forEach((value,c)=>{if(pattern.test(String(value))) errors.push({sheet:sheet.getName(),cell:columnToLetter_(c+1)+(r+1),value:value});})); }); return errors;
}

function openDashboardV5(){ const ss=getSpreadsheet_(), sheet=getSheetById_(V5.SHEETS.DASHBOARD); ss.setActiveSheet(sheet); sheet.getRange('A1').activate(); }
function showSystemStatusV5(){ const health=healthCheckV5_(); SpreadsheetApp.getUi().alert('סטטוס מערכת','גרסה: '+V5.VERSION+'\nPAT: '+(PropertiesService.getScriptProperties().getProperty('RISEUP_PAT')?'✅ מוגדר':'❌ חסר')+'\nיתרת עו"ש: '+formatMoney_(getAutomaticBankBalance_())+'\n\n'+health.summary,SpreadsheetApp.getUi().ButtonSet.OK); }

function setupSyncLogHeaders_(){ const sheet=getSheetById_(V5.SHEETS.SYNC_LOG), headers=['זמן','פעולה','סטטוס','מספר רשומות','הודעה','cashflowHash','RiseUp lastUpdatedAt','מצב סנכרון','X-Riseup-Token-Ref','משך_ms','חדשות','עודכנו','כפילויות','יתרה לפני','יתרה אחרי','Health Check']; sheet.getRange(1,1,1,headers.length).setValues([headers]); }
function logSync_(data){ const sheet=getSheetById_(V5.SHEETS.SYNC_LOG); sheet.appendRow([data.time||new Date(),data.action||'',data.status||'',data.records||0,data.message||'',getConfigValue_('cashflowHash אחרון')||'',data.riseupLastUpdatedAt||'',data.syncState||'',data.tokenRef||'',data.durationMs||'',data.inserted||0,data.updated||0,data.duplicates||0,data.balanceBefore===undefined?'':data.balanceBefore,data.balanceAfter===undefined?'':data.balanceAfter,data.health||'']); }

function findConfigRow_(name){ const sheet=getSheetById_(V5.SHEETS.CONFIG), lastRow=sheet.getLastRow(); if(lastRow<1)return null; const values=sheet.getRange(1,1,lastRow,1).getDisplayValues(); for(let i=0;i<values.length;i++){if(String(values[i][0]||'').trim()===name)return i+1;} return null; }
function getConfigValue_(name){ const row=findConfigRow_(name); if(!row)return null; return getSheetById_(V5.SHEETS.CONFIG).getRange(row,2).getValue(); }
function setConfigParam_(name,value,unit,note){ const sheet=getSheetById_(V5.SHEETS.CONFIG); let row=findConfigRow_(name); if(!row){row=sheet.getLastRow()+1; sheet.getRange(row,1).setValue(name);} sheet.getRange(row,2).setValue(value); if(unit!==undefined) sheet.getRange(row,3).setValue(unit||''); if(note!==undefined) sheet.getRange(row,4).setValue(note||''); }

function getSpreadsheet_(){ return SpreadsheetApp.openById(V5.SPREADSHEET_ID); }
function getSheetById_(sheetId){ const sheets=getSpreadsheet_().getSheets(); for(let i=0;i<sheets.length;i++){ if(sheets[i].getSheetId()===sheetId)return sheets[i]; } throw new Error('Sheet ID לא נמצא: '+sheetId); }
function validateRequiredSheets_(){ Object.keys(V5.SHEETS).forEach(key=>getSheetById_(V5.SHEETS[key])); }

function setupTransactionHeaders_(){ const sheet=getSheetById_(V5.SHEETS.TRANSACTIONS); sheet.getRange(1,1,1,V5.TRANSACTION_HEADERS.length).setValues([V5.TRANSACTION_HEADERS]); sheet.getRange(1,21).setValue('מספר מופעים transactionId'); sheet.getRange(1,22).setValue('סטטוס כפילות'); }
function setupBudgetHeaders_(){ const sheet=getSheetById_(V5.SHEETS.BUDGET); sheet.getRange(1,1,1,V5.BUDGET_HEADERS.length).setValues([V5.BUDGET_HEADERS]); }

function formatSystemSheetsRTL_(){ getSpreadsheet_().getSheets().forEach(sheet=>{ try{ sheet.setRightToLeft(true); sheet.getRange(1,1,sheet.getMaxRows(),sheet.getMaxColumns()).setHorizontalAlignment('right'); }catch(e){ console.log('RTL warning: '+sheet.getName()); } }); }

function getSyncMonths_(){ const months=[], today=new Date(); for(let i=0;i<V5.SAFETY_MONTHS;i++){ const d=new Date(today.getFullYear(),today.getMonth()-i,1); months.push(formatMonth_(d)); } return months; }
function formatMonth_(date){ return Utilities.formatDate(date,V5.TIMEZONE,'yyyy-MM'); }
function isoToDate_(value){ if(!value)return ''; if(value instanceof Date)return value; const d=new Date(value); return isNaN(d.getTime())?value:d; }

function sha256_(value){ const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8); return digest.map(byte=>{const v=(byte+256)%256; return ('0'+v.toString(16)).slice(-2);}).join(''); }
function stableStringify_(obj){ if(obj===null||typeof obj!=='object') return JSON.stringify(obj); if(Array.isArray(obj)) return '['+obj.map(stableStringify_).join(',')+']'; const keys=Object.keys(obj).sort(); return '{'+keys.map(key=>JSON.stringify(key)+':'+stableStringify_(obj[key])).join(',')+'}'; }

function installHourlyTriggerV5(){ deleteV5Triggers(); ScriptApp.newTrigger('syncRiseUpV5').timeBased().everyHours(1).create(); SpreadsheetApp.getUi().alert('✅ טריגר סנכרון שעתי הותקן.'); }
function deleteV5Triggers(){ let deleted=0; ScriptApp.getProjectTriggers().forEach(trigger=>{ if(trigger.getHandlerFunction()==='syncRiseUpV5'){ ScriptApp.deleteTrigger(trigger); deleted++; } }); return deleted; }

function columnToLetter_(column){ let letter=''; while(column>0){ const temp=(column-1)%26; letter=String.fromCharCode(temp+65)+letter; column=(column-temp-1)/26; } return letter; }
function formatMoney_(value){ if(value===''||value===null||value===undefined||isNaN(Number(value))) return 'לא ידוע'; return Number(value).toLocaleString('he-IL',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₪'; }
function showSyncToast_(metrics,health){ getSpreadsheet_().toast('חדשות: '+metrics.inserted+' | עודכנו: '+metrics.updated+' | יתרה: '+formatMoney_(metrics.balanceAfter)+' | '+(health.ok?'🟢 תקין':'🟡 בדיקה'),'RiseUp Sync V5.2',10); }
