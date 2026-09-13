/** Budget and cash-flow services. */
function syncBudget_(month, response) {
  if (!response) return false;
  const hash = sha256_(stableStringify_(response));
  const oldHash = String(getConfigValue_('cashflowHash אחרון') || '');
  if (oldHash === hash) return false;

  const sheet = getSheetById_(V5.SHEETS.BUDGET);
  const lastUpdatedAt = response.lastUpdatedAt ? new Date(response.lastUpdatedAt) : new Date();
  const envelopes = Array.isArray(response.envelopes) ? response.envelopes : [];
  const budgetDate = response.budgetDate || month;
  const newRows = envelopes.map(function(env) {
    return [
      budgetDate, env.id || '', env.type || '', Number(env.originalAmount || 0),
      Number(env.balancedAmount || 0), isoToDate_(env.balanceDate), lastUpdatedAt, hash, JSON.stringify(env)
    ];
  });

  const existingLastRow = sheet.getLastRow();
  let preservedRows = [];
  if (existingLastRow >= 2) {
    const existing = sheet.getRange(2, 1, existingLastRow - 1, 9).getValues();
    preservedRows = existing.filter(function(row) { return String(row[0] || '') !== String(budgetDate); });
  }
  const finalRows = preservedRows.concat(newRows);
  if (existingLastRow > 1) sheet.getRange(2, 1, existingLastRow - 1, 9).clearContent();
  if (finalRows.length > 0) sheet.getRange(2, 1, finalRows.length, 9).setValues(finalRows);
  setConfigParam_('cashflowHash אחרון', hash, '', 'SHA-256 של Budget האחרון');
  return true;
}

function promptVerifiedBankBalanceV5() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('🏦 עדכון יתרת עו״ש מאומתת', 'הכנס את יתרת העו״ש כפי שמופיעה בבנק.\nלדוגמה: -2396.69', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const cleaned = result.getResponseText().replace(/,/g, '').replace(/₪/g, '').trim();
  const balance = Number(cleaned);
  if (isNaN(balance)) { ui.alert('הסכום אינו תקין.'); return; }
  const source = ui.prompt('מקור האימות', 'לדוגמה: אפליקציית לאומי', ui.ButtonSet.OK_CANCEL);
  if (source.getSelectedButton() !== ui.Button.OK) return;
  const data = setVerifiedBankBalanceV5(balance, new Date(), source.getResponseText() || 'אימות ידני');
  ui.alert('יתרת העו״ש עודכנה', 'יתרה מאומתת: ' + formatMoney_(balance) + '\nפער פיוס: ' + (data.reconciliationGap === '' ? 'לא ניתן לחשב' : formatMoney_(data.reconciliationGap)), ui.ButtonSet.OK);
}

function setVerifiedBankBalanceV5(balance, observedAt, sourceNote) {
  if (balance === '' || balance === null || isNaN(Number(balance))) throw new Error('יתרה לא תקינה.');
  if (!(observedAt instanceof Date)) observedAt = observedAt ? new Date(observedAt) : new Date();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const calculatedBefore = getAutomaticBankBalance_();
    setConfigParam_('יתרת עו״ש נוכחית ידנית', Number(balance), '₪', 'מאומת: ' + sourceNote);
    setConfigParam_('תאריך ושעת יתרת עו״ש', observedAt, 'תאריך/שעה', 'מועד עוגן יתרה');
    ensureAutomaticBankBalanceFormula_();
    SpreadsheetApp.flush();
    invalidateConfigCache_();
    const calculatedAfter = getAutomaticBankBalance_();
    const reconciliationGap = (calculatedBefore === '' || calculatedBefore === null) ? '' : Number(balance) - Number(calculatedBefore);
    logSync_({ action: 'Bank Reconciliation', status: 'SUCCESS', records: 0, message: 'עודכנה יתרת עו"ש מאומתת', syncState: 'RECONCILED', balanceBefore: calculatedBefore, balanceAfter: calculatedAfter, health: 'יתרה אומתה' });
    return { verifiedBalance: Number(balance), calculatedBefore: calculatedBefore, reconciliationGap: reconciliationGap, calculatedAfter: calculatedAfter };
  } finally {
    lock.releaseLock();
  }
}

function ensureAutomaticBankBalanceFormula_() {
  const configSheet = getSheetById_(V5.SHEETS.CONFIG);
  const anchorRow = findConfigRow_('יתרת עו״ש נוכחית ידנית');
  const anchorTimeRow = findConfigRow_('תאריך ושעת יתרת עו״ש');
  let autoRow = findConfigRow_('יתרת עו״ש מחושבת אוטומטית');
  if (!autoRow) {
    autoRow = configSheet.getLastRow() + 1;
    configSheet.getRange(autoRow, 1, 1, 4).setValues([['יתרת עו״ש מחושבת אוטומטית', '', '₪', 'עוגן מאומת + תנועות checkingAccount חדשות']]);
    invalidateConfigCache_();
  }
  if (!anchorRow || !anchorTimeRow) throw new Error('חסרים פרטי עוגן יתרת עו"ש.');

  const txSheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  const endRow = Math.max(txSheet.getLastRow() + V5.FORMULA_RANGE_HEADROOM, 5000);
  const formula = '=IF(OR(B' + anchorRow + '="",B' + anchorTimeRow + '=""),"",B' + anchorRow +
    '+SUMIFS(\'תנועות\'!F2:F' + endRow + ',\'תנועות\'!H2:H' + endRow + ',"checkingAccount",\'תנועות\'!G2:G' + endRow + ',"הכנסה",\'תנועות\'!B2:B' + endRow + ',">"&B' + anchorTimeRow + ')' +
    '-SUMIFS(\'תנועות\'!F2:F' + endRow + ',\'תנועות\'!H2:H' + endRow + ',"checkingAccount",\'תנועות\'!G2:G' + endRow + ',"הוצאה",\'תנועות\'!B2:B' + endRow + ',">"&B' + anchorTimeRow + '))';
  configSheet.getRange(autoRow, 2).setFormula(formula);
  invalidateConfigCache_();
}

function getAutomaticBankBalance_() {
  const row = findConfigRow_('יתרת עו״ש מחושבת אוטומטית');
  if (!row) return '';
  return getSheetById_(V5.SHEETS.CONFIG).getRange(row, 2).getValue();
}

function refreshForecastsV5() {
  ensureAutomaticBankBalanceFormula_();
  SpreadsheetApp.flush();
  setConfigParam_('רענון תחזיות אחרון', new Date(), '', 'רענון ידני');
  const health = healthCheckV5_('deep');
  getSpreadsheet_().toast('התחזיות רועננו', 'רואה חשבון', 5);
  SpreadsheetApp.getUi().alert('רענון תחזיות', health.summary, SpreadsheetApp.getUi().ButtonSet.OK);
}
