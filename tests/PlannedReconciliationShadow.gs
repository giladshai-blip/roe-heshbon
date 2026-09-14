/**
 * Planned Reconciliation Shadow V0.2
 * Read-only validation for migrating planned-cashflow reconciliation into Core.
 * No triggers. No writes. No formula replacement.
 *
 * V0.2:
 * - Exposes the legacy status-filter bug: "טרם בוצע" was incorrectly treated as completed
 *   because the old engine used /בוצע|מאומת/.
 * - Compares legacy eligibility with intended eligibility.
 * - Keeps matching read-only and limited to checkingAccount, identical to the old engine.
 */

const PR_SHADOW_V02 = {
  VERSION: 'V0.2',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  MATCH_WINDOW_DAYS: 3,
  MATCH_AMOUNT_TOLERANCE: 1,
  PLANNED_SHEET: 'תזרים מתוכנן',
  TRANSACTIONS_SHEET: 'תנועות'
};

function runPlannedReconciliationShadowV02() {
  const ss = SpreadsheetApp.openById(PR_SHADOW_V02.SPREADSHEET_ID);
  const planned = ss.getSheetByName(PR_SHADOW_V02.PLANNED_SHEET);
  const txSheet = ss.getSheetByName(PR_SHADOW_V02.TRANSACTIONS_SHEET);
  if (!planned || !txSheet) throw new Error('חסרים גיליונות תזרים מתוכנן או תנועות.');

  const plannedValues = planned.getDataRange().getValues();
  const txValues = txSheet.getDataRange().getValues();
  if (plannedValues.length < 2 || txValues.length < 2) {
    return prShadowFinishV02_({legacyEligible:0,intendedEligible:0,matched:0,review:0,rows:[]});
  }

  const txHeaders = prShadowHeaderMapV02_(txValues[0]);
  ['transactionDate','businessName','amount','direction','sourceType'].forEach(function(h) {
    if (txHeaders[h] == null) throw new Error('חסרה עמודה בתנועות: ' + h);
  });

  const txs = [];
  for (let i = 1; i < txValues.length; i++) {
    const row = txValues[i];
    if (String(row[txHeaders.sourceType] || '') !== 'checkingAccount') continue;
    const date = prShadowDateV02_(row[txHeaders.transactionDate]);
    const amount = prShadowNumberV02_(row[txHeaders.amount]);
    if (!date || !isFinite(amount)) continue;
    txs.push({
      row: i + 1,
      date: date,
      amount: Math.abs(amount),
      direction: String(row[txHeaders.direction] || '').trim(),
      business: String(row[txHeaders.businessName] || '').trim()
    });
  }

  let legacyEligible = 0;
  let intendedEligible = 0;
  let matched = 0;
  let review = 0;
  const rows = [];

  for (let r = 1; r < plannedValues.length; r++) {
    const row = plannedValues[r];
    const date = prShadowDateV02_(row[0]);
    const type = String(row[1] || '').trim();
    const description = String(row[2] || '').trim();
    const amount = Math.abs(prShadowNumberV02_(row[3]));
    const frequency = String(row[5] || '').trim();
    const status = String(row[11] || '').trim();
    const includedEffective = prShadowNumberV02_(row[12]);

    if (!date || !isFinite(amount) || amount <= 0) continue;
    if (frequency === 'חודשי') continue;
    if (type === 'העברה פנימית') continue;
    if (includedEffective !== 1) continue;
    if (['הוצאה','הכנסה','זיכוי'].indexOf(type) === -1) continue;

    const legacyCompleted = /בוצע|מאומת/.test(status);
    if (!legacyCompleted) legacyEligible++;

    const intendedCompleted = prShadowIsActuallyCompletedV02_(status);
    if (intendedCompleted) continue;

    intendedEligible++;
    const expectedDirection = type === 'הוצאה' ? 'הוצאה' : 'הכנסה';
    const candidates = txs.filter(function(tx) {
      return tx.direction === expectedDirection &&
        Math.abs(tx.amount - amount) <= PR_SHADOW_V02.MATCH_AMOUNT_TOLERANCE &&
        Math.abs(prShadowDaysBetweenV02_(date, tx.date)) <= PR_SHADOW_V02.MATCH_WINDOW_DAYS;
    });

    const scored = candidates.map(function(tx) {
      const exactDate = prShadowDaysBetweenV02_(date, tx.date) === 0 ? 2 : 0;
      return {tx:tx,score:exactDate + prShadowTextOverlapScoreV02_(description,tx.business)};
    }).sort(function(a,b){ return b.score-a.score; });

    const best = scored[0] || null;
    const uniqueBest = !!best && (scored.length === 1 || best.score > scored[1].score);
    const highConfidence = !!best && uniqueBest && (best.score >= 2 || (candidates.length === 1 && prShadowDaysBetweenV02_(date,best.tx.date) === 0));
    if (highConfidence) matched++;
    else if (candidates.length) review++;

    rows.push({
      row:r+1,
      date:prShadowFormatDateV02_(date),
      type:type,
      description:description,
      amount:amount,
      status:status,
      legacyWouldSkip:legacyCompleted,
      candidates:candidates.length,
      highConfidence:highConfidence
    });
  }

  return prShadowFinishV02_({
    legacyEligible:legacyEligible,
    intendedEligible:intendedEligible,
    matched:matched,
    review:review,
    rows:rows
  });
}

function prShadowIsActuallyCompletedV02_(status) {
  const s = String(status || '').trim();
  if (!s) return false;
  if (/טרם בוצע/.test(s)) return false;
  return /^(?:✅|בוצע\b|.*מאומת אוטומטית)/.test(s);
}

function prShadowFinishV02_(result) {
  const bugExposed = result.intendedEligible > result.legacyEligible;
  const summary = [
    'Planned Reconciliation Shadow ' + PR_SHADOW_V02.VERSION,
    bugExposed ? '🟡 LEGACY FILTER BUG CONFIRMED' : '🟢 NO LEGACY FILTER GAP',
    'Legacy eligible: ' + result.legacyEligible,
    'Intended eligible: ' + result.intendedEligible,
    'High-confidence matches now: ' + result.matched,
    'Needs review now: ' + result.review
  ].join('\n');
  result.version = PR_SHADOW_V02.VERSION;
  result.bugExposed = bugExposed;
  result.summary = summary;
  console.log(JSON.stringify(result));
  SpreadsheetApp.getUi().alert('Planned Reconciliation Shadow', summary, SpreadsheetApp.getUi().ButtonSet.OK);
  return result;
}

function prShadowHeaderMapV02_(headers) {
  const map = {};
  headers.forEach(function(h,i){ map[String(h || '').trim()] = i; });
  return map;
}

function prShadowTextOverlapScoreV02_(a,b) {
  const stop = {של:1,את:1,עם:1,על:1,ב:1,ל:1,ו:1,הוצאה:1,הכנסה:1,תשלום:1,חיוב:1};
  const ta = prShadowNormalizeTextV02_(a).split(' ').filter(function(t){return t.length>2&&!stop[t];});
  const tb = prShadowNormalizeTextV02_(b).split(' ').filter(function(t){return t.length>2&&!stop[t];});
  let score=0;
  ta.forEach(function(t){if(tb.indexOf(t)!==-1)score++;});
  return Math.min(score,3);
}

function prShadowNormalizeTextV02_(value) {
  return String(value == null ? '' : value).toLowerCase().replace(/[״"׳']/g,'').replace(/[^0-9a-zא-ת]+/g,' ').replace(/\s+/g,' ').trim();
}

function prShadowNumberV02_(value) {
  if (typeof value === 'number') return value;
  if (value == null || value === '') return NaN;
  const n = Number(String(value).replace(/[^0-9.\-]/g,''));
  return isFinite(n) ? n : NaN;
}

function prShadowDateV02_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return prShadowStartOfDayV02_(value);
  if (value == null || value === '') return null;
  const s = String(value).trim();
  let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
  m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
  const d=new Date(s);
  return isNaN(d.getTime())?null:prShadowStartOfDayV02_(d);
}

function prShadowStartOfDayV02_(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function prShadowDaysBetweenV02_(a,b){return Math.round((prShadowStartOfDayV02_(b).getTime()-prShadowStartOfDayV02_(a).getTime())/86400000);}
function prShadowFormatDateV02_(d){return Utilities.formatDate(d,PR_SHADOW_V02.TIMEZONE,'dd/MM/yyyy');}
