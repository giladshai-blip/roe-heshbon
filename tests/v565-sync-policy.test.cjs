const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const core = fs.readFileSync('src/Code.gs', 'utf8');

function context() {
  let sleeps = 0;
  const c = vm.createContext({
    Date,
    console,
    Utilities: {
      sleep() { sleeps++; },
      formatDate() { return '2026-09-13'; },
      parseDate(s) { return new Date(s + 'T00:00:00Z'); }
    },
    SpreadsheetApp: {},
    LockService: {},
    PropertiesService: {},
    UrlFetchApp: {},
    ScriptApp: {}
  });
  vm.runInContext(core, c);
  c.__sleepCount = () => sleeps;
  return c;
}

test('Core declares 3-hour RiseUp sync policy', () => {
  assert.match(core, /VERSION:\s*'V5\.6\.5'/);
  assert.match(core, /SYNC_INTERVAL_HOURS:\s*3/);
  assert.match(core, /התקנת סנכרון כל 3 שעות/);
  assert.match(core, /installRiseupSyncTriggerV5/);
});

test('legacy hourly installer delegates to the safe 3-hour installer', () => {
  assert.match(core, /function installHourlyTriggerV5\(\)\{return installRiseupSyncTriggerV5\(\);\}/);
});

test('429 stops immediately and honors Retry-After in the error', () => {
  const c = context();
  let calls = 0;
  c.UrlFetchApp.fetch = () => {
    calls++;
    return {
      getResponseCode: () => 429,
      getAllHeaders: () => ({ 'Retry-After': '12' }),
      getContentText: () => '{"error":"rate_limit_exceeded"}'
    };
  };
  assert.throws(() => c.riseupGet_('/api/external/test', 'riseup_pat_test'), /12 שניות/);
  assert.equal(calls, 1);
  assert.equal(c.__sleepCount(), 0);
});

test('5xx still uses bounded exponential retry', () => {
  const c = context();
  let calls = 0;
  c.UrlFetchApp.fetch = () => ({
    getResponseCode: () => (++calls < 3 ? 503 : 200),
    getAllHeaders: () => ({}),
    getContentText: () => '{"transactions":[]}'
  });
  const result = c.riseupGet_('/api/external/test', 'riseup_pat_test');
  assert.ok(Array.isArray(result.transactions));
  assert.equal(calls, 3);
  assert.equal(c.__sleepCount(), 2);
});
