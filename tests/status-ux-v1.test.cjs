const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/StatusUX.gs', 'utf8');

test('simple status exposes actionable bank verification task', () => {
  assert.match(source, /לאמת את יתרת הבנק/);
  assert.match(source, /שלח צילום מסך עדכני של יתרת העו״ש/);
  assert.match(source, /bankNeedsVerification/);
});

test('simple status exposes verification progress', () => {
  assert.match(source, /פריטים ממתינים/);
  assert.match(source, /verificationActive/);
  assert.match(source, /אימות נתונים/);
});

test('firstSeenAt is not exposed in user-facing status text', () => {
  const userFacingSection = source.split('function statusUxVerificationSummary_')[0];
  assert.doesNotMatch(userFacingSection, /firstSeenAt/);
});

test('simple status keeps technical health errors separate from user tasks', () => {
  assert.match(source, /technicalErrors/);
  assert.match(source, /healthCheckV56_/);
});
