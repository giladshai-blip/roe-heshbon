/**
 * רואה חשבון - מערכת פיננסית
 * Core configuration and cached data-access helpers.
 * Version V5.3
 */
const V5 = {
  VERSION: 'V5.3',
  SPREADSHEET_ID: '1a172bDSpW5L4gDXgrZDmh82NBgB2eOM2dUNiyCl1dbM',
  TIMEZONE: 'Asia/Jerusalem',
  API_BASE: 'https://input.riseup.co.il',
  SAFETY_MONTHS: 2,
  LARGE_TRANSACTION_ALERT: 2000,
  MAX_RETRIES: 4,
  INITIAL_RETRY_MS: 1000,
  API_BATCH_SIZE: 4,
  FORMULA_RANGE_HEADROOM: 2000,
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

const V5_RUNTIME = {
  spreadsheet: null,
  sheetsById: null,
  configByName: null
};

function getSpreadsheet_() {
  if (!V5_RUNTIME.spreadsheet) {
    V5_RUNTIME.spreadsheet = SpreadsheetApp.openById(V5.SPREADSHEET_ID);
  }
  return V5_RUNTIME.spreadsheet;
}

function getSheetById_(sheetId) {
  if (!V5_RUNTIME.sheetsById) {
    V5_RUNTIME.sheetsById = {};
    getSpreadsheet_().getSheets().forEach(function(sheet) {
      V5_RUNTIME.sheetsById[String(sheet.getSheetId())] = sheet;
    });
  }
  const sheet = V5_RUNTIME.sheetsById[String(sheetId)];
  if (!sheet) throw new Error('Sheet ID לא נמצא: ' + sheetId);
  return sheet;
}

function validateRequiredSheets_() {
  Object.keys(V5.SHEETS).forEach(function(key) {
    getSheetById_(V5.SHEETS[key]);
  });
}

function getConfigMap_() {
  if (V5_RUNTIME.configByName) return V5_RUNTIME.configByName;
  const sheet = getSheetById_(V5.SHEETS.CONFIG);
  const lastRow = sheet.getLastRow();
  const map = {};
  if (lastRow > 0) {
    const values = sheet.getRange(1, 1, lastRow, 4).getValues();
    values.forEach(function(row, index) {
      const name = String(row[0] || '').trim();
      if (name) map[name] = { row: index + 1, values: row.slice(0, 4) };
    });
  }
  V5_RUNTIME.configByName = map;
  return map;
}

function invalidateConfigCache_() {
  V5_RUNTIME.configByName = null;
}

function findConfigRow_(name) {
  const item = getConfigMap_()[name];
  return item ? item.row : null;
}

function getConfigValue_(name) {
  const item = getConfigMap_()[name];
  return item ? item.values[1] : null;
}

function setConfigParam_(name, value, unit, note) {
  const sheet = getSheetById_(V5.SHEETS.CONFIG);
  const map = getConfigMap_();
  const existing = map[name];
  const row = existing ? existing.row : sheet.getLastRow() + 1;
  const current = existing ? existing.values.slice(0, 4) : [name, '', '', ''];
  current[0] = name;
  current[1] = value;
  if (unit !== undefined) current[2] = unit || '';
  if (note !== undefined) current[3] = note || '';
  sheet.getRange(row, 1, 1, 4).setValues([current]);
  invalidateConfigCache_();
  return row;
}

function setupTransactionHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.TRANSACTIONS);
  sheet.getRange(1, 1, 1, V5.TRANSACTION_HEADERS.length).setValues([V5.TRANSACTION_HEADERS]);
  sheet.getRange(1, 21, 1, 2).setValues([['מספר מופעים transactionId', 'סטטוס כפילות']]);
}

function setupBudgetHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.BUDGET);
  sheet.getRange(1, 1, 1, V5.BUDGET_HEADERS.length).setValues([V5.BUDGET_HEADERS]);
}

function setupSyncLogHeaders_() {
  const sheet = getSheetById_(V5.SHEETS.SYNC_LOG);
  const headers = ['זמן','פעולה','סטטוס','מספר רשומות','הודעה','cashflowHash','RiseUp lastUpdatedAt','מצב סנכרון','X-Riseup-Token-Ref','משך_ms','חדשות','עודכנו','כפילויות','יתרה לפני','יתרה אחרי','Health Check'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function logSync_(data) {
  const sheet = getSheetById_(V5.SHEETS.SYNC_LOG);
  const row = [
    data.time || new Date(), data.action || '', data.status || '', data.records || 0,
    data.message || '', getConfigValue_('cashflowHash אחרון') || '', data.riseupLastUpdatedAt || '',
    data.syncState || '', data.tokenRef || '', data.durationMs || '', data.inserted || 0,
    data.updated || 0, data.duplicates || 0,
    data.balanceBefore === undefined ? '' : data.balanceBefore,
    data.balanceAfter === undefined ? '' : data.balanceAfter,
    data.health || ''
  ];
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}
