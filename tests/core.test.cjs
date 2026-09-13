const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const core=fs.readFileSync('src/Code.gs','utf8');
const dashboard=fs.readFileSync('src/Dashboard.gs','utf8');
function formatDate(d,tz,pattern){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
 if(pattern==='yyyy-MM')return `${parts.year}-${parts.month}`;
 if(pattern==='yyyy-MM-dd')return `${parts.year}-${parts.month}-${parts.day}`;
 return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
function parseDate(day,tz){
 let ms=Date.parse(day+'T00:00:00Z');
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',hourCycle:'h23'}).format(new Date(ms)));
 return new Date(ms-hour*3600000);
}
function col(s){return [...s].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0);}
class Sheet {
 constructor(name,rows=[],maxRows=1000,maxCols=26){this.name=name;this.rows=rows.map(r=>r.slice());this.maxRows=maxRows;this.maxCols=maxCols;this.writes=[];this.merges=[];}
 getName(){return this.name;}
 getLastRow(){return this.rows.reduce((n,r,i)=>r.some(v=>v!==''&&v!==undefined&&v!==null)?i+1:n,0);}
 getLastColumn(){return this.rows.reduce((n,r)=>Math.max(n,r.reduce((m,v,i)=>v!==''&&v!==undefined&&v!==null?i+1:m,0)),0);}
 getMaxRows(){return this.maxRows;}
 getMaxColumns(){return this.maxCols;}
 insertRowsAfter(_,n){this.maxRows+=n;}
 insertColumnsAfter(_,n){this.maxCols+=n;}
 getDataRange(){return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn()));}
 getRange(a,b,nr=1,nc=1){
  if(typeof a==='string'){const m=a.replace(/\$/g,'').match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);assert.ok(m,a);b=col(m[1]);a=+m[2];nr=m[4]?+m[4]-a+1:1;nc=m[3]?col(m[3])-b+1:1;}
  assert.ok(a+nr-1<=this.maxRows&&b+nc-1<=this.maxCols,`${this.name}: range exceeds grid`);
  return new Range(this,a,b,nr,nc);
 }
 appendRow(r){this.getRange(this.getLastRow()+1,1,1,r.length).setValues([r]);}
 getCharts(){return [];}
 clear(){this.rows=[];return this;}
}
for(const m of ['setFrozenRows','setFrozenColumns','setHiddenGridlines','setRightToLeft','showColumns','hideColumns','setColumnWidth','setRowHeight','setRowHeights','clearConditionalFormatRules','setConditionalFormatRules'])Sheet.prototype[m]=function(){return this;};
class Range {
 constructor(s,r,c,nr,nc){Object.assign(this,{s,r,c,nr,nc});}
 getRawValues(){return Array.from({length:this.nr},(_,i)=>Array.from({length:this.nc},(_,j)=>this.s.rows[this.r+i-1]?.[this.c+j-1]??''));}
 getValues(){return this.getRawValues().map((row,i)=>row.map((v,j)=>this.s.effective?.[`${this.r+i},${this.c+j}`]??v));}
 getDisplayValues(){return this.getValues().map(r=>r.map(String));}
 getValue(){return this.getValues()[0][0];}
 getFormulas(){return this.getRawValues().map(r=>r.map(v=>typeof v==='string'&&v.startsWith('=')?v:''));}
 getFormula(){return this.getFormulas()[0][0];}
 setValues(vals){assert.equal(vals.length,this.nr);for(let i=0;i<this.nr;i++){assert.equal(vals[i].length,this.nc);this.s.rows[this.r+i-1]??=[];for(let j=0;j<this.nc;j++)this.s.rows[this.r+i-1][this.c+j-1]=vals[i][j];}this.s.writes.push([this.r,this.c,this.nr,this.nc]);return this;}
 setValue(v){return this.setValues(Array.from({length:this.nr},()=>Array(this.nc).fill(v)));}
 setFormula(v){return this.setValue(v);}
 setFormulas(v){return this.setValues(v);}
 clearContent(){return this.setValue('');}
 getRow(){return this.r;}getColumn(){return this.c;}getNumRows(){return this.nr;}getNumColumns(){return this.nc;}getSheet(){return this.s;}
 getCell(r,c){return this.s.getRange(this.r+r-1,this.c+c-1);}
 merge(){const rect=[this.r,this.c,this.r+this.nr-1,this.c+this.nc-1];for(const m of this.s.merges)assert.ok(rect[2]<m[0]||rect[0]>m[2]||rect[3]<m[1]||rect[1]>m[3],'overlapping merged cells');this.s.merges.push(rect);return this;}
 breakApart(){this.s.merges=[];return this;}
}
for(const m of ['setNote','setNumberFormat','setFontSize','setFontWeight','setFontColor','setHorizontalAlignment','setVerticalAlignment','setBackground','setBorder','setWrap','activate'])Range.prototype[m]=function(){return this;};
function context(sheets=[]){
 const map=Object.fromEntries(sheets.map(s=>[s.name,s]));
 const ss={getSheetByName:n=>map[n]||null,getSheets:()=>Object.values(map),getSpreadsheetTimeZone:()=> 'Asia/Jerusalem',toast(){},setActiveSheet(){}};
 const c=vm.createContext({Date,console,Utilities:{formatDate,parseDate,sleep(){},computeDigest:(_,s)=>[...crypto.createHash('sha256').update(s).digest()],DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'}},SpreadsheetApp:{openById:()=>ss,flush(){},BorderStyle:{SOLID:1,SOLID_MEDIUM:2},newConditionalFormatRule(){const b={whenFormulaSatisfied(){return b;},setBackground(){return b;},setRanges(){return b;},build(){return {};}};return b;},getUi:()=>({alert(){},ButtonSet:{OK:'ok'}})}});
 vm.runInContext(core+'\n'+dashboard,c);return c;
}
function tx(extra={}){return {transactionId:'synthetic-1',transactionDate:'2026-09-10T00:00:00.000Z',billingDate:'2026-09-15T00:00:00.000Z',cashflowDate:'2026-09',amount:10,isIncome:false,sourceType:'creditCard',...extra};}
function headers(c){return vm.runInContext('V56.TRANSACTION_HEADERS',c);}
test('both Apps Script files compile together without duplicate functions',()=>{context();const names=[...core.matchAll(/^function (\w+)\(/gm),...dashboard.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);assert.equal(new Set(names).size,names.length);});
test('cashflowDate and installment aliases match documented API',()=>{const c=context(),r=c.normalizeTransaction_(tx({totalNumberOfInstallments:12,isInstallment:true}),new Date());assert.equal(r[2],'2026-09');assert.equal(r[14],12);});
test('legacy installment field is supported',()=>{const c=context();assert.equal(c.normalizeTransaction_(tx({totalNumberOfPayments:4}),new Date())[14],4);});
test('month fallback comes from request without overriding API allocation',()=>{const c=context();assert.equal(c.withCashflowMonth_([tx()], '2026-08')[0].cashflowMonth,'2026-09');assert.equal(c.withCashflowMonth_([tx({cashflowDate:null})], '2026-08')[0].cashflowMonth,'2026-08');});
test('income flag wins and zero amount stays zero',()=>{const c=context(),r=c.normalizeTransaction_(tx({amount:0,transactionAmount:100,isIncome:false,direction:'income'}),new Date());assert.equal(r[5],0);assert.equal(r[6],'הוצאה');});
test('unknown direction never inferred from positive amount',()=>{assert.throws(()=>context().normalizeTransaction_(tx({isIncome:undefined}),new Date()),/כיוון/);});
test('invalid or missing amounts are rejected',()=>{const c=context();for(const v of [undefined,null,'',true,{},'oops',Infinity])assert.throws(()=>c.normalizeTransaction_(tx({amount:v}),new Date()));});
test('date-only and UTC-midnight normalize to the same local day',()=>{const c=context();assert.equal(c.parseTransactionDate_('2026-09-10').getTime(),c.parseTransactionDate_('2026-09-10T00:00:00.000Z').getTime());assert.equal(formatDate(c.parseTransactionDate_('2026-09-10'),'Asia/Jerusalem','yyyy-MM-dd'),'2026-09-10');});
test('impossible dates and missing dates are rejected',()=>{const c=context();assert.throws(()=>c.normalizeTransaction_(tx({transactionDate:'2026-02-30'}),new Date()));assert.throws(()=>c.normalizeTransaction_(tx({transactionDate:''}),new Date()));assert.equal(c.parseDateSafe_(new Date(NaN)),'');});
test('Jerusalem month boundary independent of host timezone',()=>{const c=context();assert.deepEqual(Array.from(c.syncMonthsAt_(new Date('2026-12-31T22:30:00Z'),2)),['2027-01','2026-12']);});
test('blank and invalid balances do not display zero',()=>{const c=context();for(const v of ['',null,undefined,false,NaN])assert.equal(c.formatMoney_(v),'לא זמין');assert.match(c.formatMoney_(0),/0\.00/);});
test('all transactions validate before batch write',()=>{const c=context(),s=new Sheet('תנועות',[headers(c)]);c.getSheet_=()=>s;assert.throws(()=>c.upsertTransactions_([tx(),tx({transactionId:'bad',amount:'bad'})]));assert.equal(s.writes.length,0);});
test('upsert batches updates, preserves firstSeenAt and helper columns',()=>{const c=context(),old=c.normalizeTransaction_(tx(),new Date('2026-09-11'));old[20]=new Date('2026-09-10');old.push('helper');const s=new Sheet('תנועות',[headers(c),old]);c.getSheet_=()=>s;const r=c.upsertTransactions_([tx({amount:20})]);assert.equal(r.updated,1);assert.equal(s.rows[1][20].getTime(),old[20].getTime());assert.equal(s.rows[1][21],'helper');assert.equal(s.writes.length,1);});
test('unchanged upsert writes nothing',()=>{const c=context(),old=c.normalizeTransaction_(tx(),new Date());const s=new Sheet('תנועות',[headers(c),old]);c.getSheet_=()=>s;assert.equal(c.upsertTransactions_([tx()]).unchanged,1);assert.equal(s.writes.length,0);});
test('prototype-like IDs are safe and API duplicates collapse',()=>{const c=context(),s=new Sheet('תנועות',[headers(c)]);c.getSheet_=()=>s;const t=tx({transactionId:'__proto__'}),r=c.upsertTransactions_([t,t]);assert.equal(r.inserted,1);assert.equal(r.duplicates,1);});
test('upsert expands a full grid before append',()=>{const c=context(),s=new Sheet('תנועות',[headers(c)],1,21);c.getSheet_=()=>s;c.upsertTransactions_([tx()]);assert.equal(s.maxRows,2);});
test('blank transaction rows have no key; zero-valued fallback is stable',()=>{const c=context();assert.equal(c.transactionKeyFromRow_(Array(21).fill('')),'');const r=c.normalizeTransaction_(tx({transactionId:'',amount:0}),new Date());assert.match(c.transactionKeyFromRow_(r),/^fp:/);});
test('duplicate status uses IDs, does not overwrite U or unrelated helpers',()=>{const c=context(),r=c.normalizeTransaction_(tx(),new Date());r[20]=new Date();const h=Array.from(headers(c));h.push('סטטוס כפילות','custom');const s=new Sheet('תנועות',[h,[...r,'=IF(U2=1,"ייחודי","⚠️ כפילות")','keep'],[...r,'old','keep2']]);c.getSheet_=()=>s;c.refreshDuplicateFormulas_();assert.equal(s.rows[1][21],'⚠️ כפילות');assert.equal(s.rows[1][20],r[20]);assert.equal(s.rows[1][22],'keep');});
test('legacy observation times are never fabricated',()=>{const c=context();assert.equal(c.backfillFirstSeenAt_().changed,0);});
test('invalid budget responses do not mutate the sheet',()=>{const c=context();let writes=0;c.getSheet_=()=>{writes++;};for(const response of [null,{},[],{envelopes:{}},{envelopes:[],budgetDate:'2026-08'}])assert.throws(()=>c.syncBudget_('2026-09',response));assert.equal(writes,0);});
test('budget zero preserved, bad numeric input leaves existing data',()=>{const c=context(),s=new Sheet('תקציב',[['headers'],['old']]);let hash='';c.getSheet_=()=>s;c.getConfigParam_=()=>hash;c.setConfigParam_=(_,v)=>{hash=v;};assert.throws(()=>c.syncBudget_('2026-09',{envelopes:[{originalAmount:'bad'}]}));assert.equal(s.rows[1][0],'old');c.syncBudget_('2026-09',{envelopes:[{id:'synthetic',originalAmount:10,balancedAmount:0,amount:20}]});assert.equal(s.rows[1][4],0);});
test('budget hash ignores request metadata and key ordering',()=>{const c=context(),s=new Sheet('תקציב',[['headers']]);let hash='';c.getSheet_=()=>s;c.getConfigParam_=()=>hash;c.setConfigParam_=(_,v)=>{hash=v;};assert.equal(c.syncBudget_('2026-09',{envelopes:[{id:'a',originalAmount:10}],_meta:{tokenRef:'a'}}),true);assert.equal(c.syncBudget_('2026-09',{envelopes:[{originalAmount:10,id:'a'}],_meta:{tokenRef:'b'}}),false);});
test('budget writes replacement before clearing stale tail',()=>{const c=context(),s=new Sheet('תקציב',[['h'],['old1'],['old2']]);c.getSheet_=()=>s;c.getConfigParam_=()=>'';c.setConfigParam_=()=>{};c.syncBudget_('2026-09',{envelopes:[{id:'new'}]});assert.deepEqual(s.writes.map(w=>w[0]),[2,3]);});
test('log headers stay in place and values map to header names',()=>{const c=context(),s=new Sheet('יומן סנכרון',[['פעולה','legacy','זמן'],['old','keep','oldtime']]);c.getSheet_=()=>s;c.getConfigParam_=()=>'';c.logSync_({action:'test',status:'WARNING',balanceBefore:0});assert.equal(s.rows[1][1],'keep');assert.equal(s.rows[2][0],'test');assert.equal(s.rows[2][1],'');assert.equal(s.rows[2][s.rows[0].indexOf('יתרה לפני')],0);});
test('verification lifecycle overrides historical discrepancy text',()=>{const c=context();const rows=[['a','','','','','פער מהותי','','','נסגר / מעקב'],['b','','','','','מאומת','','','פעיל'],['c','','','','','חסר','','','הוחלף'],['d','','','','','לא פעיל','','','']];assert.equal(c.summarizeVerification_(rows).active,1);});
test('bank formula follows named rows and excludes future dates',()=>{const c=context(),f=c.bankBalanceFormula_('B17','B22');assert.ok(f.includes('B17+SUMIFS'));assert.equal((f.match(/TODAY\(\)\+1/g)||[]).length,4);assert.equal((f.match(/U2:U/g)||[]).length,2);assert.ok(f.includes('INT(B22)+1'));assert.ok(!f.includes('B9'));});
test('bank formula is registered under the config name when newly added',()=>{const c=context(),s=new Sheet('הגדרות',[['יתרת עו״ש נוכחית ידנית',0],['תאריך ושעת יתרת עו״ש',new Date()]]);c.getSheet_=()=>s;c.ensureAutomaticBankBalanceFormula_();assert.equal(s.rows[2][0],'יתרת עו״ש מחושבת אוטומטית');assert.match(s.rows[2][1],/B1\+SUMIFS/);});
test('30-day window spans month end and refuses incomplete coverage',()=>{const c=context(),cash=[],annual=[];for(let i=0;i<30;i++){const date=new Date(`2026-09-13T12:00:00Z`);date.setUTCDate(date.getUTCDate()+i);if(i<18)cash.push([date,'','','','','',100-i]);else annual.push([date,'','','','','','','',100-i]);}assert.equal(c.forecastWindow_(cash,annual,new Date('2026-09-13T10:00Z')).minimum,71);annual.pop();assert.ok(Number.isNaN(c.forecastWindow_(cash,annual,new Date('2026-09-13T10:00Z')).minimum));});
test('end-of-month excludes trailing summaries and missing values',()=>{const c=context(),rows=[[new Date('2026-09-13T12:00Z'),'','','','','',10],[new Date('2026-09-30T12:00Z'),'','','','','',20],['summary','','','','','',999]];assert.equal(c.endOfCashflow_(rows).value,20);rows[1][6]='';assert.ok(Number.isNaN(c.endOfCashflow_(rows).value));});
test('model repair changes only observed broken formula and source links',()=>{const c=context(),p=new Sheet('תוכנית 5 שנים'),a=new Sheet('גאנט תזרים שנתי'),s=new Sheet('הגדרות');p.getRange('C5').setFormula('=B15+C15*12');p.getRange('C7').setValue(500);p.getRange('C14').setFormula('=custom_assumption');c.validateModelLayout_=()=>{};c.findGoalRow_=()=>2;c.findConfigRow_=()=>5;c.getSheet_=k=>({FIVE_YEAR_PLAN:p,ANNUAL_CASHFLOW:a,CONFIG:s}[k]);c.applyModelIntegrityFixes_();assert.equal(p.getRange('C5').getFormula(),'=B5+C15*12');assert.equal(p.getRange('C7').getValue(),500);assert.equal(p.getRange('C14').getFormula(),'=custom_assumption');p.getRange('C5').setFormula('=B5+custom');c.applyModelIntegrityFixes_();assert.equal(p.getRange('C5').getFormula(),'=B5+custom');});
test('missing sheets return structured health failure',()=>{const h=context().healthCheckV56_();assert.equal(h.ok,false);assert.equal(h.status,'ERROR');});
test('warnings are not labelled green success',()=>{const h=context().healthResult_([],['pending'],0);assert.equal(h.status,'WARNING');assert.match(h.summary,/🟡/);});
test('HTTP retries transient failures but never logs response bodies',()=>{const c=context();let n=0,sleeps=0;c.Utilities.sleep=()=>{sleeps++;};c.UrlFetchApp={fetch:()=>({getResponseCode:()=>++n<3?500:200,getContentText:()=>'{"transactions":[]}',getAllHeaders:()=>({'X-RISEUP-TOKEN-REF':'ref'})})};assert.equal(c.riseupGet_('/path','dummy')._meta.tokenRef,'ref');assert.equal(sleeps,2);c.UrlFetchApp.fetch=()=>({getResponseCode:()=>400,getContentText:()=> 'private'});assert.throws(()=>c.riseupGet_('/path','dummy'),e=>e.message.includes('400')&&!e.message.includes('private'));});
test('dashboard helper label uses same filter as maximum ratio',()=>{const c=context(),s=new Sheet('לוח מחוונים');c.findGoalRow_=()=>2;c.buildDashboardV56HelperData_(s);const max=s.getRange('Z12').getFormula(),label=s.getRange('Z13').getFormula();assert.ok(label.includes(max.slice('=IFERROR('.length,-',"לא זמין")'.length).replace('*100','')));assert.ok(label.includes("FILTER('כרטיסי אשראי'!C2:C"));assert.ok(!s.getRange('Z5').getFormula().includes('MIN(100'));assert.ok(s.getRange('Z14').getFormula().includes('יעד ניצול אשראי'));});
test('30-day dashboard helper requires complete coverage and has no huge sentinel',()=>{const f=context().forecastMinimumFormula_();assert.ok(f.includes('=30'));assert.ok(f.includes('TODAY()+30'));assert.ok(!f.includes('1E+99'));});
test('dashboard reinstall handles existing merges and records its own version',()=>{const s=new Sheet('לוח מחוונים'),c=context([s]);c.findGoalRow_=()=>2;const versions=[];c.setConfigParam_=(...x)=>versions.push(x);c.installDashboardV56();c.installDashboardV56();assert.equal(versions.length,2);assert.equal(versions[1][1],'V5.6.1');assert.ok(s.getRange('F19').getFormula().includes('$Z$14'));});
test('schema guard refuses shifted columns before repair',()=>{const c=context(),s=new Sheet('תנועות',[['wrong'],['existing']]);c.getSheet_=()=>s;assert.throws(()=>c.validateSyncSchema_(),/מבנה עמודות/);assert.equal(s.writes.length,0);});
test('missing budget id row null cannot erase existing budget',()=>{const c=context(),s=new Sheet('תקציב',[['h'],['existing']]);c.getSheet_=()=>s;c.getConfigParam_=()=>'';assert.throws(()=>c.syncBudget_('2026-09',{envelopes:[null]}));assert.equal(s.writes.length,0);});
test('last retry does not sleep; malformed success body is rejected',()=>{const c=context();let sleeps=0;c.Utilities.sleep=()=>sleeps++;c.UrlFetchApp={fetch:()=>({getResponseCode:()=>503})};assert.throws(()=>c.riseupGet_('/path','dummy'));assert.equal(sleeps,3);c.UrlFetchApp.fetch=()=>({getResponseCode:()=>200,getContentText:()=> 'null'});assert.throws(()=>c.riseupGet_('/path','dummy'));});
test('healthy structural fixture traverses full health check and reports only warnings',()=>{
 const initial=context();const names=vm.runInContext('Object.values(V56.SHEET_NAMES)',initial);const sheets=Array.from(names,n=>new Sheet(n));const c=context(sheets),byName=Object.fromEntries(sheets.map(s=>[s.name,s]));
 const put=(name,a,v,e)=>{const s=byName[name];const r=s.getRange(a);r.setValue(v);if(e!==undefined){s.effective??={};s.effective[`${r.r},${r.c}`]=e;}};
 byName['תנועות'].rows=[Array.from(headers(c))];byName['תקציב'].rows=[Array.from(vm.runInContext('V56.BUDGET_HEADERS',c))];
 const now=new Date(),today=c.dayKey_(now),anchor=c.parseTransactionDate_(today);
 const cfg=byName['הגדרות'];cfg.rows=[['יתרת עו״ש נוכחית ידנית',100],['תאריך ושעת יתרת עו״ש',anchor],['יעד כרית ביטחון',"='יעדים'!B2"],['יתרת עו״ש מחושבת אוטומטית',c.bankBalanceFormula_('B1','B2')],['תאריך רענון אחרון',now],['גרסת מערכת','V5.6.3'],['גרסת דשבורד','V5.6.1']];cfg.effective={'3,2':200,'4,2':100};
 put('יעדים','A2','כרית ביטחון / חיסכון ראשון');put('יעדים','B2',200);
 put('תוכנית 5 שנים','A5','יתרת עו״ש');put('תוכנית 5 שנים','A15','מאזן חודשי');put('תוכנית 5 שנים','C5','=B5+C15*12');
 put('גאנט תזרים שנתי','A4','יתרת פתיחה');put('גאנט תזרים שנתי','A10','כרית');put('גאנט תזרים שנתי','B4',c.endOfMonthFormula_(),100);put('גאנט תזרים שנתי','B10',"='יעדים'!B2",200);
 const end=c.endOfCashflow_([[anchor]]).day;let cr=2,ar=16;
 for(let i=0;i<65;i++){const day=c.addDaysKey_(today,i);const date=c.parseTransactionDate_(day);if(day<=end){put('תזרים',`A${cr}`,date);put('תזרים',`B${cr}`,100);put('תזרים',`G${cr++}`,100);}else{put('גאנט תזרים שנתי',`A${ar}`,date);put('גאנט תזרים שנתי',`I${ar++}`,100);}}
 for(const [cell,value] of [['A5','יתרת עו״ש מחושבת'],['Z2',100],['Z3',100],['Z4',100],['Z6',200]])put('לוח מחוונים',cell,value);
 const h=c.healthCheckV56_();assert.deepEqual(Array.from(h.errors),[]);assert.equal(h.status,'WARNING');
 put('לוח מחוונים','Z4',999);assert.ok(c.healthCheckV56_().errors.some(e=>e.includes('Z4')));
});
