const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const core = fs.readFileSync('src/Code.gs', 'utf8');
const dashboard = fs.readFileSync('src/Dashboard.gs', 'utf8');
const automation = fs.readFileSync('src/AutomationEngine.gs', 'utf8');

function context() {
  const c = vm.createContext({
    Date,
    console,
    Utilities: {
      formatDate(d, _tz, pattern) {
        const iso = d.toISOString();
        if (pattern === 'yyyy-MM-dd') return iso.slice(0, 10);
        if (pattern === 'yyyy-MM') return iso.slice(0, 7);
        return iso;
      }
    },
    SpreadsheetApp: {},
    LockService: {},
    PropertiesService: {},
    UrlFetchApp: {},
    ScriptApp: {}
  });
  vm.runInContext(core, c);
  return c;
}

test('internal transfer is a valid transaction direction', () => {
  const c = context();
  const row = Array(21).fill('');
  row[0] = 'manual-transfer';
  row[1] = new Date('2026-09-13T00:00:00Z');
  row[2] = '2026-09';
  row[5] = 4000;
  row[6] = 'העברה פנימית';
  row[7] = 'checkingAccount';
  row[20] = new Date('2026-09-13T10:00:00Z');
  const result = c.auditTransactions_([row]);
  assert.equal(result.invalid, 0);
});

test('30-day minimum uses one merged cashflow/annual timeline and cashflow overrides same-day annual value', () => {
  const c = context();
  const now = new Date('2026-09-13T00:00:00Z');
  const cash = [];
  const annual = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const a = Array(9).fill('');
    a[0] = d;
    a[8] = 1000 - i;
    annual.push(a);
  }
  const r = Array(7).fill('');
  r[0] = new Date('2026-09-17T00:00:00Z');
  r[6] = -27099.17;
  cash.push(r);
  const result = c.forecastWindow_(cash, annual, now);
  assert.equal(result.covered, 30);
  assert.equal(result.minimum, -27099.17);
  assert.equal(result.minimumDate, '2026-09-17');
});

test('dashboard and automation reference the shared Core forecast function', () => {
  assert.match(dashboard, /getForecast30DayMetrics_/);
  assert.match(automation, /getForecast30DayMetrics_/);
  assert.match(core, /function getForecast30DayMetrics_/);
});
