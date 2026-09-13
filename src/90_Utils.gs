/** Shared utility helpers. */
function getSyncMonths_() {
  const months = [];
  const today = new Date();
  for (let i = 0; i < V5.SAFETY_MONTHS; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(formatMonth_(d));
  }
  return months;
}

function formatMonth_(date) {
  return Utilities.formatDate(date, V5.TIMEZONE, 'yyyy-MM');
}

function isoToDate_(value) {
  if (!value) return '';
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d;
}

function sha256_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return digest.map(function(byte) {
    const v = (byte + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function stableStringify_(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify_).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(function(key) { return JSON.stringify(key) + ':' + stableStringify_(obj[key]); }).join(',') + '}';
}

function columnToLetter_(column) {
  let letter = '';
  while (column > 0) {
    const temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function formatMoney_(value) {
  if (value === '' || value === null || value === undefined || isNaN(Number(value))) return 'לא ידוע';
  return Number(value).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₪';
}

function showSyncToast_(metrics, health) {
  getSpreadsheet_().toast('חדשות: ' + metrics.inserted + ' | עודכנו: ' + metrics.updated + ' | יתרה: ' + formatMoney_(metrics.balanceAfter) + ' | ' + (health.ok ? '🟢 תקין' : '🟡 בדיקה'), 'RiseUp Sync ' + V5.VERSION, 10);
}
