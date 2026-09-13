/**
 * רואה חשבון — Repair V5.6.2
 * תיקון ממוקד לכיוון עסקאות שנפגע ב-V5.6.
 * הקובץ אינו מחליף את Core; הוא כלי תיקון חד-פעמי בטוח להרצה.
 */

function repairDirectionsV562() {
  const ss = SpreadsheetApp.openById('1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM');
  const sh = ss.getSheetByName('תנועות');
  if (!sh) throw new Error('לא נמצא גיליון תנועות');

  const pat = PropertiesService.getScriptProperties().getProperty('RISEUP_PAT');
  if (!pat || !pat.startsWith('riseup_pat_')) throw new Error('RISEUP_PAT חסר או לא תקין');

  const now = new Date();
  const months = [0,1].map(function(i) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return Utilities.formatDate(d, 'Asia/Jerusalem', 'yyyy-MM');
  });

  const directionById = {};
  let apiCount = 0;

  months.forEach(function(month) {
    const url = 'https://input.riseup.co.il/api/external/transactions?cashflowMonth=' + encodeURIComponent(month);
    const res = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Bearer ' + pat,
        Accept: 'application/json'
      },
      muteHttpExceptions: true
    });

    const code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('RiseUp API ' + code + ': ' + res.getContentText().slice(0, 250));
    }

    const data = JSON.parse(res.getContentText() || '{}');
    const txs = Array.isArray(data.transactions) ? data.transactions : [];
    apiCount += txs.length;

    txs.forEach(function(tx) {
      const id = String(tx.transactionId || tx.id || '').trim();
      if (!id) return;
      directionById[id] = tx.isIncome === true ? 'הכנסה' : 'הוצאה';
    });
  });

  const lastRow = sh.getLastRow();
  if (lastRow < 2) throw new Error('אין עסקאות בגיליון');

  const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  const directions = sh.getRange(2, 7, lastRow - 1, 1).getValues();

  let changed = 0;
  let matched = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = String(ids[i][0] || '').trim();
    if (!id || !Object.prototype.hasOwnProperty.call(directionById, id)) continue;
    matched++;
    const correct = directionById[id];
    if (directions[i][0] !== correct) {
      directions[i][0] = correct;
      changed++;
    }
  }

  sh.getRange(2, 7, directions.length, 1).setValues(directions);
  SpreadsheetApp.flush();

  const log = ss.getSheetByName('יומן סנכרון');
  if (log) {
    log.appendRow([
      new Date(),
      'Repair V5.6.2',
      'SUCCESS',
      matched,
      'תיקון direction לפי tx.isIncome | API: ' + apiCount + ' | מותאמות: ' + matched + ' | תוקנו: ' + changed,
      '', '', 'REPAIR_DIRECTION', '', '', 0, changed, 0, '', '', 'דורש בדיקת תזרים לאחר התיקון'
    ]);
  }

  const config = ss.getSheetByName('הגדרות');
  if (config) {
    const values = config.getRange(1,1,Math.max(config.getLastRow(),1),4).getValues();
    for (let r = 0; r < values.length; r++) {
      if (values[r][0] === 'גרסת מערכת') {
        config.getRange(r+1,2).setValue('V5.6.2-repair');
        config.getRange(r+1,4).setValue('Repair direction לפי RiseUp isIncome; Core עדיין דורש תיקון קנוני');
        break;
      }
    }
  }

  Logger.log('Repair V5.6.2 complete. API=' + apiCount + ', matched=' + matched + ', changed=' + changed);
  return {apiCount: apiCount, matched: matched, changed: changed};
}

function probeV562() {
  Logger.log('probeV562 OK');
  return 'OK';
}
