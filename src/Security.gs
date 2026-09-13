/**
 * ============================================================
 * רואה חשבון — Security Health Check V1.0.2
 * ============================================================
 * בדיקת אבטחה מקומית ושמרנית לפרויקט Apps Script.
 * - אינה מדפיסה או שומרת סודות.
 * - אינה קוראת את ערך ה-PAT מעבר לבדיקת קיום/פורמט בזיכרון.
 * - אינה מוסיפה הרשאות Drive/OAuth חדשות.
 * - בודקת טריגרים, דליפת סודות לגיליונות, HTTPS במקורות API ומצב רכיבי הליבה.
 *
 * V1.0.2:
 * - syncOfficialDataV4 הוסר מרשימת הטריגרים המוכרים לאחר שאומת כי הפונקציה אינה קיימת.
 * - הוסר גם מבדיקת כפילויות של handlers לגיטימיים.
 * ============================================================
 */

const SECURITY_V1 = {
  VERSION: 'V1.0.2',
  SECRET_PATTERNS: [
    /riseup_pat_[A-Za-z0-9_-]{16,}/i,
    /AIza[0-9A-Za-z_-]{20,}/,
    /(?:ghp|github_pat)_[0-9A-Za-z_]{20,}/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i
  ],
  SHEETS_TO_SCAN: [
    'הגדרות',
    'הגדרות API רשמי',
    'יומן סנכרון',
    'יומן אוטומציות',
    'התראות מערכת'
  ],
  KNOWN_TRIGGER_HANDLERS: [
    'syncRiseUpV5',
    'runAutomationEngineV1',
    'onOpenAccountantUIV1'
  ]
};

function setupSecurityV1() {
  const result = runSecurityHealthCheckV1();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    result.status === 'SUCCESS' ? 'בדיקת האבטחה תקינה' : 'בדיקת האבטחה הסתיימה עם ממצאים',
    'Security ' + SECURITY_V1.VERSION,
    8
  );
  return result;
}

function runSecurityHealthCheckV1() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('לא נמצא Spreadsheet פעיל.');

  const findings = [];
  const info = [];

  securityCheckRiseupPat_(findings, info);
  securityCheckTriggers_(findings, info);
  securityScanSheetsForSecrets_(ss, findings, info);
  securityCheckOfficialApiUrls_(ss, findings, info);
  securityCheckCoreVersions_(ss, findings, info);

  const high = findings.filter(function(f){ return f.severity === 'HIGH'; }).length;
  const medium = findings.filter(function(f){ return f.severity === 'MEDIUM'; }).length;
  const low = findings.filter(function(f){ return f.severity === 'LOW'; }).length;
  const status = high ? 'ERROR' : (medium || low ? 'WARNING' : 'SUCCESS');

  const summary = [
    'Security ' + SECURITY_V1.VERSION + ' | ' + status,
    'גבוה: ' + high + ' | בינוני: ' + medium + ' | נמוך: ' + low
  ];
  findings.forEach(function(f){
    summary.push((f.severity === 'HIGH' ? '🔴' : f.severity === 'MEDIUM' ? '🟡' : '🔵') + ' ' + f.title + ' — ' + f.detail);
  });
  if (!findings.length) summary.push('🟢 לא נמצאו ממצאי אבטחה בבדיקות הזמינות מתוך Apps Script.');

  const result = {
    version: SECURITY_V1.VERSION,
    status: status,
    checkedAt: new Date(),
    counts: {high: high, medium: medium, low: low},
    findings: findings,
    info: info,
    summary: summary.join('\n')
  };

  console.log(securitySafeSummary_(result));
  return result;
}

function showSecurityHealthCheckV1() {
  const result = runSecurityHealthCheckV1();
  SpreadsheetApp.getUi().alert(
    'בדיקת אבטחה ' + SECURITY_V1.VERSION,
    result.summary,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return result;
}

function securityCheckRiseupPat_(findings, info) {
  let pat = '';
  try {
    pat = String(PropertiesService.getScriptProperties().getProperty('RISEUP_PAT') || '');
  } catch (e) {
    findings.push({severity:'HIGH',title:'לא ניתן לקרוא Script Properties',detail:'לא ניתן לאמת שקיים PAT מאובטח.'});
    return;
  }

  if (!pat) {
    findings.push({severity:'HIGH',title:'RISEUP_PAT חסר',detail:'הסנכרון לא יוכל להזדהות מול RiseUp.'});
    return;
  }
  if (!/^riseup_pat_[A-Za-z0-9_-]{16,}$/.test(pat)) {
    findings.push({severity:'HIGH',title:'RISEUP_PAT בפורמט לא צפוי',detail:'יש להחליף את הטוקן ולא לשמור אותו בגיליון או בקוד.'});
    return;
  }
  info.push('RISEUP_PAT קיים ב-Script Properties ובפורמט צפוי; ערכו לא נרשם בלוג.');
  pat = '';
}

function securityCheckTriggers_(findings, info) {
  let triggers = [];
  try { triggers = ScriptApp.getProjectTriggers(); }
  catch (e) {
    findings.push({severity:'MEDIUM',title:'בדיקת טריגרים נכשלה',detail:'לא ניתן לאמת את רשימת הטריגרים.'});
    return;
  }

  const counts = {};
  triggers.forEach(function(t){
    const handler = String(t.getHandlerFunction() || '');
    counts[handler] = (counts[handler] || 0) + 1;
    if (SECURITY_V1.KNOWN_TRIGGER_HANDLERS.indexOf(handler) === -1) {
      findings.push({severity:'LOW',title:'טריגר לא מוכר',detail:'נמצא handler: ' + securitySafeText_(handler)});
    }
  });

  ['syncRiseUpV5','runAutomationEngineV1','onOpenAccountantUIV1'].forEach(function(handler){
    const count = counts[handler] || 0;
    if (count > 1) findings.push({severity:'MEDIUM',title:'טריגר כפול',detail:handler + ' מופיע ' + count + ' פעמים.'});
  });

  if ((counts.syncRiseUpV5 || 0) !== 1) {
    findings.push({severity:'MEDIUM',title:'טריגר RiseUp אינו יחיד',detail:'צפוי טריגר אחד ל-syncRiseUpV5; בפועל: ' + (counts.syncRiseUpV5 || 0)});
  }
  info.push('מספר טריגרים מותקנים שנבדקו: ' + triggers.length);
}

function securityScanSheetsForSecrets_(ss, findings, info) {
  let scanned = 0;
  SECURITY_V1.SHEETS_TO_SCAN.forEach(function(name){
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const lr = Math.min(sh.getLastRow(), 1000);
    const lc = Math.min(sh.getLastColumn(), 26);
    if (!lr || !lc) return;
    const values = sh.getRange(1,1,lr,lc).getDisplayValues();
    scanned += lr * lc;
    for (let r=0; r<values.length; r++) {
      for (let c=0; c<values[r].length; c++) {
        const text = String(values[r][c] || '');
        if (!text) continue;
        for (let p=0; p<SECURITY_V1.SECRET_PATTERNS.length; p++) {
          if (SECURITY_V1.SECRET_PATTERNS[p].test(text)) {
            findings.push({
              severity:'HIGH',
              title:'חשד לסוד שנשמר בגיליון',
              detail:name + '!' + securityColumnLetter_(c+1) + (r+1) + ' מכיל תבנית שנראית כמו credential. הערך עצמו לא נרשם.'
            });
            break;
          }
        }
      }
    }
  });
  info.push('נסרקו עד ' + scanned + ' תאים בגיליונות מערכת רגישים ללא שמירת תוכן בלוג.');
}

function securityCheckOfficialApiUrls_(ss, findings, info) {
  const sh = ss.getSheetByName('הגדרות API רשמי');
  if (!sh || sh.getLastRow() < 2) return;
  const rows = sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  let checked = 0;
  rows.forEach(function(row){
    const key = String(row[0] || '').trim();
    const value = String(row[1] || '').trim();
    if (!value || !/^https?:\/\//i.test(value)) return;
    checked++;
    if (!/^https:\/\//i.test(value)) {
      findings.push({severity:'MEDIUM',title:'מקור API ללא HTTPS',detail:key + ' אינו משתמש ב-HTTPS.'});
    }
  });
  info.push('נבדקו ' + checked + ' כתובות מקור רשמיות לשימוש ב-HTTPS.');
}

function securityCheckCoreVersions_(ss, findings, info) {
  const sh = ss.getSheetByName('הגדרות');
  if (!sh || sh.getLastRow() < 1) return;
  const rows = sh.getRange(1,1,sh.getLastRow(),2).getDisplayValues();
  const map = {};
  rows.forEach(function(r){ if (r[0]) map[String(r[0]).trim()] = String(r[1] || '').trim(); });
  if (!map['גרסת מערכת']) findings.push({severity:'LOW',title:'גרסת Core חסרה',detail:'לא ניתן לאמת איזו גרסת Core מותקנת.'});
  if (!map['גרסת דשבורד']) findings.push({severity:'LOW',title:'גרסת Dashboard חסרה',detail:'לא ניתן לאמת איזו גרסת Dashboard מותקנת.'});
  if (map['תדירות סנכרון RiseUp'] && Number(map['תדירות סנכרון RiseUp']) < 2) {
    findings.push({severity:'LOW',title:'תדירות סנכרון גבוהה',detail:'מומלץ לא להפעיל RiseUp בתדירות גבוהה מהנדרש.'});
  }
  info.push('Core: ' + (map['גרסת מערכת'] || 'לא ידוע') + ' | Dashboard: ' + (map['גרסת דשבורד'] || 'לא ידוע'));
}

function securitySafeSummary_(result) {
  return JSON.stringify({
    version: result.version,
    status: result.status,
    counts: result.counts,
    findings: result.findings.map(function(f){return {severity:f.severity,title:f.title,detail:securitySafeText_(f.detail)};})
  });
}

function securitySafeText_(value) {
  let text = String(value == null ? '' : value);
  SECURITY_V1.SECRET_PATTERNS.forEach(function(pattern){ text = text.replace(pattern, '[REDACTED]'); });
  return text.slice(0,500);
}

function securityColumnLetter_(n) {
  let s='';
  while(n){ n--; s=String.fromCharCode(65+n%26)+s; n=Math.floor(n/26); }
  return s;
}
