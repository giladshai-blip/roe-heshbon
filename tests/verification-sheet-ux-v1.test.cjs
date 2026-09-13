const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('src/VerificationSheetUX.gs', 'utf8');

test('verification sheet UX preserves the canonical A:I layout', () => {
  assert.match(source, /A: 'נושא'/);
  assert.match(source, /B: 'נתון A'/);
  assert.match(source, /F: 'סטטוס'/);
  assert.match(source, /I: 'מצב טיפול'/);
  assert.match(source, /vsuValidateLayout_/);
});

test('verification sheet UX hides only technical comparison columns by default', () => {
  assert.match(source, /hideColumns\(2, 4\)/);
  assert.match(source, /showVerificationTechnicalColumnsV1/);
  assert.match(source, /hideVerificationTechnicalColumnsV1/);
});

test('verification sheet UX adds treatment validation and status formatting', () => {
  assert.match(source, /requireValueInList/);
  assert.match(source, /ממתין למסמך/);
  assert.match(source, /דורש רענון/);
  assert.match(source, /נתון שגוי — דורש תיקון/);
  assert.match(source, /setConditionalFormatRules/);
});

test('verification sheet UX adds a summary panel without inserting rows', () => {
  assert.match(source, /M1:N7/);
  assert.match(source, /מרכז אימות — תמונת מצב/);
  assert.doesNotMatch(source, /insertRows/);
  assert.doesNotMatch(source, /moveColumns/);
});
