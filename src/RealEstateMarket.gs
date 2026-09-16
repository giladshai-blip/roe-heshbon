/** RealEstateMarket.gs — dev-1.11.0
 * Official-source apartment comparables pipeline.
 * Reads private property details only at runtime from the active spreadsheet.
 * Source: GovMap public real-estate endpoints. No commercial listing source is used.
 */
const RE111={VERSION:'dev-1.11.0',BUILD:'RE-V1.0.0',TZ:'Asia/Jerusalem',ASSETS:'נכסים',PLAN:'תוכנית 5 שנים',DATA:'נדל״ן רשמי',BASE:'https://www.govmap.gov.il/api',MIN:3,MAX:30,MONTHS:36};

function refreshRealEstateComparablesV111(){
  const lock=LockService.getScriptLock(); if(!lock.tryLock(20000)) throw new Error('רענון נדל״ן אחר כבר פעיל.');
  try{
    const ss=SpreadsheetApp.getActiveSpreadsheet();
    const subject=reSubject_(ss), rate=reYear1Rate_(ss), loc=reResolve_(subject.address);
    const deals=reDeals_(loc), comps=reFilter_(deals,subject,new Date()), est=reEstimate_(comps,subject,rate,new Date());
    reWriteData_(reDataSheet_(ss),subject,loc,comps,est);
    SpreadsheetApp.flush();
    if(est.usable){ reWritePlan_(ss,est); SpreadsheetApp.flush(); const rb=reReadback_(ss); if(Math.abs(rb-est.year1)>1) throw new Error('Readback נכשל.'); }
    reLog_(ss,est.usable?'SUCCESS':'PARTIAL','עסקאות '+comps.length+' | אמינות '+est.confidence+' | שנה 1 '+(est.year1||''));
    return est;
  }catch(e){ try{reLog_(SpreadsheetApp.getActiveSpreadsheet(),'ERROR',String(e.message||e));}catch(x){} throw e; }
  finally{lock.releaseLock();}
}

function installRealEstateComparablesTriggerV111(){
  const h='refreshRealEstateComparablesV111'; ScriptApp.getProjectTriggers().forEach(t=>{if(t.getHandlerFunction()===h)ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger(h).timeBased().everyDays(1).atHour(5).nearMinute(30).inTimezone(RE111.TZ).create();
  return {installed:true,handler:h};
}
function setupRealEstateComparablesV111(){return {trigger:installRealEstateComparablesTriggerV111(),firstRun:refreshRealEstateComparablesV111()};}

function reSubject_(ss){
  const sh=ss.getSheetByName(RE111.ASSETS); if(!sh)throw new Error('חסר גיליון נכסים.');
  const a=sh.getRange(1,1,Math.max(2,sh.getLastRow()),9).getDisplayValues(); let r=null;
  for(let i=1;i<a.length;i++)if(String(a[i][1]).indexOf('נדל')>=0){r=a[i];break;} if(!r)throw new Error('לא נמצא נכס מגורים.');
  const note=String(r[8]||''), address=note.split(';')[0].trim(), value=reNum_(r[2]);
  const areaM=note.match(/([0-9]+(?:[.,][0-9]+)?)\s*מ[״"']?ר/), roomsM=note.match(/([0-9]+(?:[.,][0-9]+)?)\s*חדר/), floorM=note.match(/קומה\s*([0-9]+)/);
  const area=areaM?reNum_(areaM[1]):NaN; if(!address||!area||!value)throw new Error('מאפייני הנכס אינם מספיקים.');
  return {address:address,area:area,rooms:roomsM?reNum_(roomsM[1]):null,floor:floorM?Number(floorM[1]):null,base:value};
}
function reYear1Rate_(ss){
  const sh=ss.getSheetByName(RE111.PLAN), a=sh.getRange(1,1,Math.max(43,sh.getLastRow()),2).getValues();
  for(let i=0;i<a.length;i++)if(String(a[i][0]).trim()==='תחזית אנליטית לשנה 1'){const x=Number(a[i][1]);if(isFinite(x)&&x>=-.2&&x<=.2)return x;}
  throw new Error('שיעור תחזית שנה 1 חסר.');
}
function reResolve_(address){
  const u=RE111.BASE+'/search-service/autocomplete', d=reFetch_(u,{method:'post',contentType:'application/json',payload:JSON.stringify({searchText:address,language:'he',isAccurate:false,maxResults:8}),muteHttpExceptions:true});
  const rows=(d&&d.results)||[]; if(!rows.length)throw new Error('GovMap לא פתר את הכתובת.'); let x=rows.find(r=>String(r.type).toLowerCase()==='address'&&r.shape)||rows[0];
  const m=String(x.shape||'').match(/POINT\s*\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i); if(!m)throw new Error('קואורדינטות GovMap לא תקינות.');
  return {text:x.text||address,x:Number(m[1]),y:Number(m[2])};
}
function reDeals_(loc){
  const radii=[75,250,750,1500], polys=[]; for(let j=0;j<radii.length&&polys.length<8;j++){
    let z; try{z=reFetch_(RE111.BASE+'/real-estate/deals/'+encodeURIComponent(loc.x+','+loc.y)+'/'+radii[j],{method:'get',muteHttpExceptions:true});}catch(e){z=[];}
    const rr=Array.isArray(z)?z:(z&&z.data)||[]; rr.forEach(p=>{const id=p.polygon_id||p.polygonId||p.id;if(id&&!polys.some(q=>String(q.id)===String(id)))polys.push({id:id});});
  }
  if(!polys.length)throw new Error('לא נמצאו מתחמי עסקאות GovMap.');
  const end=Utilities.formatDate(new Date(),RE111.TZ,'yyyy-MM'), start=Utilities.formatDate(new Date(new Date().getFullYear(),new Date().getMonth()-RE111.MONTHS,1),RE111.TZ,'yyyy-MM'); let all=[];
  polys.slice(0,8).forEach(p=>{try{const z=reFetch_(RE111.BASE+'/real-estate/street-deals/'+encodeURIComponent(p.id)+'?limit=200&dealType=2&startDate='+start+'&endDate='+end,{method:'get',muteHttpExceptions:true});const rr=Array.isArray(z)?z:(z&&z.data)||[];all=all.concat(rr);}catch(e){}});
  const seen={}, out=[]; all.forEach(d=>{const k=String(d.objectid||d.id||'')+'|'+String(d.dealDate||'')+'|'+String(d.dealAmount||'');if(!seen[k]){seen[k]=1;out.push(d);}}); return out;
}
function reFilter_(rows,s,now){
  const out=[]; (rows||[]).forEach(d=>{const price=reFirstNum_(d,['dealAmount','price']),area=reFirstNum_(d,['assetArea','area']),rooms=reFirstNum_(d,['assetRoomNum','rooms']),floor=reFirstNum_(d,['floorNumber','floorNum']),date=new Date(d.dealDate||d.date||'');
    if(!price||!area||isNaN(date.getTime())||price<250000||price>15000000)return; const ar=area/s.area;if(ar<.7||ar>1.4)return;if(s.rooms&&rooms&&Math.abs(rooms-s.rooms)>1.5)return;if(s.floor!==null&&floor!==null&&Math.abs(floor-s.floor)>5)return;
    const months=Math.max(0,(now.getFullYear()-date.getFullYear())*12+now.getMonth()-date.getMonth()), score=25*(1-Math.abs(area-s.area)/s.area)+(s.rooms&&rooms?18*(1-Math.abs(rooms-s.rooms)/1.5):8)+Math.max(0,12*(1-Math.min(months,36)/36));
    out.push({id:d.objectid||d.id||'',date:date,price:price,area:area,rooms:rooms,floor:floor,ppsm:price/area,street:d.streetNameHeb||d.streetName||'',house:d.houseNumber||d.houseNum||'',city:d.settlementNameHeb||'',score:Math.round(score*100)/100});
  }); out.sort((a,b)=>b.score-a.score||b.date-a.date); return out.slice(0,RE111.MAX);
}
function reEstimate_(c,s,rate,now){
  if(!c||c.length<RE111.MIN)return {usable:false,confidence:'נמוכה',reason:'פחות מ-3 עסקאות מתאימות; המודל לא נדרס.'};
  const x=c.slice(0,Math.min(12,c.length)), arr=x.map(v=>v.ppsm).sort((a,b)=>a-b), med=reMedian_(arr), dev=reMedian_(x.map(v=>Math.abs(v.ppsm-med)/med)), newest=Math.min.apply(null,x.map(v=>Math.floor((now-v.date)/86400000)));
  const conf=x.length>=8&&dev<=.12&&newest<=240?'גבוהה':x.length>=5&&dev<=.20&&newest<=540?'בינונית':'בינונית-נמוכה', current=Math.round(med*s.area), year1=Math.round(current*(1+rate));
  return {usable:true,confidence:conf,count:x.length,medianPpsm:med,dispersion:dev,current:current,rate:rate,year1:year1,reason:'מבוסס '+x.length+' עסקאות GovMap מתאימות.'};
}
function reDataSheet_(ss){let sh=ss.getSheetByName(RE111.DATA);if(!sh)sh=ss.insertSheet(RE111.DATA);sh.hideSheet();return sh;}
function reWriteData_(sh,s,l,c,e){sh.clearContents(); const meta=[['שדה','ערך'],['גרסה',RE111.VERSION],['מקור','GovMap — המרכז למיפוי ישראל'],['כתובת שנפתרה',l.text],['רענון',new Date()],['שווי בסיס',s.base],['עסקאות מתאימות',c.length],['אמינות',e.confidence],['שווי השוואתי',e.current||''],['תחזית שנה 1',e.year1||''],['הערה',e.reason]];sh.getRange(1,1,meta.length,2).setValues(meta);const h=['id','תאריך','מחיר','שטח','חדרים','קומה','₪ למ״ר','רחוב','מספר','עיר','score'];sh.getRange(13,1,1,h.length).setValues([h]);if(c.length)sh.getRange(14,1,c.length,h.length).setValues(c.map(v=>[v.id,v.date,v.price,v.area,v.rooms||'',v.floor===null?'':v.floor,v.ppsm,v.street,v.house,v.city,v.score]));}
function reWritePlan_(ss,e){const sh=ss.getSheetByName(RE111.PLAN),a=sh.getRange(1,1,Math.max(43,sh.getLastRow()),1).getDisplayValues();let sr=-1,ar=-1;for(let i=0;i<a.length;i++){if(a[i][0]==='שווי דירה — תרחיש')sr=i+1;if(a[i][0]==='תחזית אנליטית לשנה 1')ar=i+1;}if(sr<1||ar<1)throw new Error('שורות יעד חסרות.');sh.getRange(ar,4).setValue(e.year1).setNumberFormat('#,##0.00 ₪');sh.getRange(ar,7).setValue(e.confidence);sh.getRange(ar,8).setValue('נכנס לחישוב שנה 1 — עסקאות GovMap');sh.getRange(ar,9).setValue('שווי השוואתי '+e.current+' ₪; '+e.count+' עסקאות; חציון '+Math.round(e.medianPpsm)+' ₪/מ״ר.');sh.getRange(sr,3).setFormula('=$D$'+ar).setNumberFormat('#,##0.00 ₪');sh.getRange(sr,8).setValue('תחזית שוק שנה 1 — עסקאות מוסדיות + הנחת מאקרו');}
function reReadback_(ss){const sh=ss.getSheetByName(RE111.PLAN),a=sh.getRange(1,1,Math.max(43,sh.getLastRow()),3).getValues();for(let i=0;i<a.length;i++)if(String(a[i][0]).trim()==='שווי דירה — תרחיש')return Number(a[i][2]);throw new Error('Readback חסר.');}
function reFetch_(u,o){let last;for(let i=0;i<3;i++)try{const r=UrlFetchApp.fetch(u,o||{}),code=r.getResponseCode();if(code<200||code>=300)throw new Error('HTTP '+code);return JSON.parse(r.getContentText('UTF-8').replace(/^\uFEFF/,''));}catch(e){last=e;if(i<2)Utilities.sleep(750*Math.pow(2,i));}throw last;}
function reFirstNum_(o,k){for(let i=0;i<k.length;i++)if(o&&o[k[i]]!==undefined&&o[k[i]]!==''){const n=reNum_(o[k[i]]);if(isFinite(n))return n;}return null;}
function reNum_(v){if(typeof v==='number')return v;const s=String(v==null?'':v).replace(/,/g,'').replace(/[^0-9.\-]/g,'');return s?Number(s):NaN;}
function reMedian_(a){if(!a.length)return null;const x=a.slice().sort((m,n)=>m-n),i=Math.floor(x.length/2);return x.length%2?x[i]:(x[i-1]+x[i])/2;}
function reLog_(ss,status,msg){const sh=ss.getSheetByName('יומן אוטומציות')||ss.getSheetByName('יומן סנכרון');if(sh)sh.appendRow([new Date(),'Real Estate Comparables '+RE111.BUILD,status,0,msg]);}
