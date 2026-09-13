const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const security = fs.readFileSync('src/Security.gs', 'utf8');

test('security module never logs raw RiseUp PAT', () => {
  assert.match(security, /getProperty\('RISEUP_PAT'\)/);
  assert.match(security, /securitySafeSummary_/);
  assert.doesNotMatch(security, /console\.log\(pat\)/);
  assert.doesNotMatch(security, /setValue\(pat\)/);
});

test('security module checks installed trigger duplication and known handlers', () => {
  assert.match(security, /getProjectTriggers\(\)/);
  assert.match(security, /syncRiseUpV5/);
  assert.match(security, /runAutomationEngineV1/);
  assert.match(security, /onOpenAccountantUIV1/);
  assert.doesNotMatch(security, /'syncOfficialDataV4'/);
});

test('security module scans sensitive system sheets for secret patterns', () => {
  assert.match(security, /SECRET_PATTERNS/);
  assert.match(security, /הגדרות API רשמי/);
  assert.match(security, /יומן סנכרון/);
  assert.match(security, /יומן אוטומציות/);
  assert.match(security, /התראות מערכת/);
});

test('security module checks official API URLs for HTTPS', () => {
  assert.match(security, /securityCheckOfficialApiUrls_/);
  assert.match(security, /https:\\\/\\\//);
});
