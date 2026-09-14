/**
 * Planned Reconciliation Shadow V0.1
 * Read-only validation for migrating planned-cashflow reconciliation into Core.
 * No triggers. No writes. No alerts. No formula replacement.
 */

const PR_SHADOW_V01 = {
  VERSION: 'V0.1',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  MATCH_WINDOW_DAYS: 3,
  MATCH_AMOUNT_TOLERANCE: 1,
  PLANNED_SHEET: 'תזרים מתוכנן',
  TRANSACTIONS_SHEET: 'תנועות'
};

function runPlannedReconciliationShadowV01() {
  const ss = SpreadsheetApp.openById(PR_SHADOW_V01.SPREADSHEET_ID);
  const planned = ss.getSheetByName(PR_SHADOW_V01.PLANNED_SHEET);
  const txSheet = ss.getSheetByName(PR_SHADOW_V01.TRANSACTIONS_SHEET);
  if (!planned || !txSheet) throw new Error('חסרים גיליונות תזרים מתוכנן או תנועות.');

  const plannedValues = planned.getDataRange().getValues();
  const txValues = txSheet.getDataRange().getValues();
  if (plannedValues.length < 2 || txValues.length < 2) {
    return prShadowFinish_({eligible:0,matchedFormula:0,matchedIndependent:0,mismatches:[],rows:[]});
  }

  const txHeaders = prShadowHeaderMap_(txValues[0]);
  ['transactionDate','businessName','amount','direction','sourceType'].forEach(function(h) {
    if (txHeaders[h] == null) throw new Error('חסרה עמודה בתנועות: ' + h);
  });

  const txs = [];
  for (let i = 1; i < txValues.length; i++) {
    const row = txValues[i];
    if (String(row[txHeaders.sourceType] || '') !== 'checkingAccount') continue;
    const date = prShadowDate_(row[txHeaders.transactionDate]);
    const amount = prShadowNumber_(row[txHeaders.amount]);
    if (!date || !isFinite(amount)) continue;
    txs.push({
      row: i + 1,
      date: date,
      amount: Math.abs(amount),
      direction: String(row[txHeaders.direction] || '').trim(),
      business: String(row[txHeaders.businessName] || '').trim()
    });
  }

  const rows = [];
  const mismatches = [];
  let eligible = 0;
  let matchedFormula = 0;
  let matchedIndependent = 0;

  for (let r = 1; r < plannedValues.length; r++) {
    const row = plannedValues[r];
    const date = prShadowDate_(row[0]);
    const type = String(row[1] || '').trim();
    const description = String(row[2] || '').trim();
    const amount = Math.abs(prShadowNumber_(row[3]));
    const frequency = String(row[5] || '').trim();
    const paymentMethod = String(row[6] || '').trim();
    const included = row[8] === true;
    const formulaMatchCount = prShadowNumber_(row[10]);
    const status = String(row[11] || '').trim();
    const effectiveIncluded = prShadowNumber_(row[12]);

    if (!date || !isFinite(amount) || amount <= 0) continue;
    if (!included) continue;
    if (frequency === 'חודשי') continue;
    if (type === 'העברה פנימית') continue;
    if (/מזומן/.test(paymentMethod)) continue;
    if (/בוצע|מאומת/.test(status)) continue;
    if (effectiveIncluded !== 1) continue;
    if (['הוצאה','הכנסה','זיכוי'].indexOf(type) === -1) continue;

    eligible++;
    const expectedDirection = type === 'הוצאה' ? 'הוצאה' : 'הכנסה';
    const candidates = txs.filter(function(tx) {
      return tx.direction === expectedDirection &&
        Math.abs(tx.amount - amount) <= PR_SHADOW_V01.MATCH_AMOUNT_TOLERANCE &&
        Math.abs(prShadowDaysBetween_(date, tx.date)) <= PR_SHADOW_V01.MATCH_WINDOW_DAYS;
    });

    if (formulaMatchCount > 0) matchedFormula++;
    if (candidates.length > 0) matchedIndependent++;

    const formulaCount = isFinite(formulaMatchCount) ? formulaMatchCount : 0;
    if (formulaCount !== candidates.length) {
      mismatches.push({
        row: r + 1,
        description: description,
        formulaCount: formulaCount,
        independentCount: candidates.length
      });
    }

    rows.push({
      row: r + 1,
      date: prShadowFormatDate_(date),
      type: type,
      description: description,
      amount: amount,
      formulaMatchCount: formulaCount,
      independentMatchCount: candidates.length,
      status: status,
      candidates: candidates.map(function(c) {
        return {row:c.row,date:prShadowFormatDate_(c.date),amount:c.amount,business:c.business};
      })
    });
  }

  return prShadowFinish_({
    eligible: eligible,
    matchedFormula: matchedFormula,
    matchedIndependent: matchedIndependent,
    mismatches: mismatches,
    rows: rows
  });
}

function prShadowFinish_(result) {
  const ok = result.mismatches.length === 0;
  const summary = [
    'Planned Reconciliation Shadow ' + PR_SHADOW_V01.VERSION,
    ok ? '🟢 PASS' : '🔴 FAIL',
    'Eligible: ' + result.eligible,
    'Formula matched rows: ' + result.matchedFormula,
    'Independent matched rows: ' + result.matchedIndependent,
    'Mismatches: ' + result.mismatches.length
  ].join('\n');
  result.version = PR_SHADOW_V01.VERSION;
  result.ok = ok;
  result.summary = summary;
  console.log(JSON.stringify(result));
  SpreadsheetApp.getUi().alert('Planned Reconciliation Shadow', summary, SpreadsheetApp.getUi().ButtonSet.OK);
  return result;
}

function prShadowHeaderMap_(headers) {
  const map = {};
  headers.forEach(function(h, i) { map[String(h || '').trim()] = i; });
  return map;
}

function prShadowNumber_(value) {
  if (typeof value === 'number') return value;
  if (value == null || value === '') return NaN;
  const n = Number(String(value).replace(/[^0-9.\-]/g,''));
  return isFinite(n) ? n : NaN;
}

function prShadowDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return prShadowStartOfDay_(value);
  if (value == null || value === '') return null;
  const s = String(value).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : prShadowStartOfDay_(d);
}

function prShadowStartOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function prShadowDaysBetween_(a,b) { return Math.round((prShadowStartOfDay_(b).getTime() - prShadowStartOfDay_(a).getTime()) / 86400000); }
function prShadowFormatDate_(d) { return Utilities.formatDate(d, PR_SHADOW_V01.TIMEZONE, 'dd/MM/yyyy'); }
