const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const code = fs.readFileSync('src/VerificationCenter.gs', 'utf8');
const html = fs.readFileSync('src/VerificationCenter.html', 'utf8');

test('verification center uses the existing verification sheet and does not delete rows', () => {
  assert.match(code, /אימות נתונים/);
  assert.doesNotMatch(code, /deleteRow\s*\(/);
  assert.doesNotMatch(code, /clearContents\s*\(/);
});

test('automatic close is conservative', () => {
  assert.match(code, /clearlyVerified/);
  assert.match(code, /nothingMissing/);
  assert.match(code, /נסגר אוטומטית/);
  assert.match(code, /חלקית\|דורש\|טרם\|פער\|חסר\|לא אומת/);
});

test('manual actions and audit metadata exist', () => {
  ['verified','missing_document','later','wrong','refresh','reopen'].forEach(action => assert.match(code, new RegExp(action)));
  assert.match(code, /הערת טיפול/);
  assert.match(code, /עודכן לאחרונה/);
});

test('automatic refresh trigger is limited to verification handlers', () => {
  assert.match(code, /verificationCenterOnOpenV1/);
  assert.match(code, /refreshVerificationCenterV1/);
  assert.match(code, /everyHours\(VERIFICATION_CENTER_V1\.AUTO_REFRESH_HOURS\)/);
});

test('sidebar exposes intuitive verification actions', () => {
  assert.match(html, /מרכז אימות/);
  assert.match(html, /אימתתי/);
  assert.match(html, /חסר מסמך/);
  assert.match(html, /אחר כך/);
  assert.match(html, /הנתון שגוי/);
  assert.match(html, /דורש רענון/);
});
