/**
 * ============================================================
 * רואה חשבון — Core Engine Shadow V0.1.1
 * ============================================================
 * שלב Shadow בלבד. אינו מזין החלטות, אינו כותב KPI לדשבורד
 * ואינו מחליף את החישובים הקיימים.
 * מטרתו לחשב במקביל KPI קריטיים מאותו מקור אמת ולהשוות.
 *
 * V0.1.1:
 * - runShadowParityV01 מציג חלון תוצאה ברור בתוך Apps Script/Spreadsheet UI.
 * - התוצאה נרשמת גם ל-Execution log ללא שינוי נתונים פיננסיים.
 * ============================================================
 */

const CORE_ENGINE_SHADOW_V01 = {
  VERSION: 'V0.1.1',
  TIMEZONE: 'Asia/Jerusalem',
  SHEETS: {
    CASHFLOW: 'תזרים',
    ANNUAL: 'גאנט תזרים שנתי',
    CONFIG: 'הגדרות',
    DASHBOARD: 'לוח מחוונים'
  },
  CONFIG_KEYS: {
    AUTO_BALANCE: 'יתרת עו״ש מחושבת אוטומטית',
    CHECKING_FRAME: 'מסגרת עו״ש מאומתת',
    LAST_SYNC: 'תאריך רענון אחרון',
    BANK_VERIFIED_AT: 'תאריך ושעת יתרת עו״ש'
  }
};

function getShadowFinancialSnapshotV01() {
  const ss = typeof getSpreadsheet_ === 'function'
    ? getSpreadsheet_()
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('לא נמצא Spreadsheet פעיל.');

  const cash = shadowSheet_(ss, CORE_ENGINE_SHADOW_V01.SHEETS.CASHFLOW);
  const annual = shadowSheet_(ss, CORE_ENGINE_SHADOW_V01.SHEETS.ANNUAL);
  const config = shadowSheet_(ss, CORE_ENGINE_SHADOW_V01.SHEETS.CONFIG);

  const cashRows = cash.getLastRow() > 1
    ? cash.getRange(2, 1, cash.getLastRow() - 1, 7).getValues()
    : [];
  const annualRows = annual.getLastRow() > 15
    ? annual.getRange(16, 1, annual.getLastRow() - 15, 9).getValues()
    : [];

  const currentBalance = shadowConfigNumber_(config, CORE_ENGINE_SHADOW_V01.CONFIG_KEYS.AUTO_BALANCE);
  const checkingFrame = shadowConfigNumber_(config, CORE_ENGINE_SHADOW_V01.CONFIG_KEYS.CHECKING_FRAME);
  const monthEnd = shadowEndOfMonth_(cashRows);
  const forecast = shadowForecast30_(cashRows, annualRows, new Date());

  let breachDate = '';
  let breachAmount = NaN;
  if (checkingFrame > 0 && forecast.points.length === 30) {
    for (let i = 0; i < forecast.points.length; i++) {
      if (forecast.points[i].value < -checkingFrame) {
        breachDate = forecast.points[i].date;
        breachAmount = forecast.points[i].value;
        break;
      }
    }
  }

  return {
    version: CORE_ENGINE_SHADOW_V01.VERSION,
    calculatedAt: new Date(),
    currentBalance: currentBalance,
    monthEnd: monthEnd.value,
    monthEndDate: monthEnd.date,
    low30: forecast.minimum,
    low30Date: forecast.minimumDate,
    coveredDays: forecast.points.length,
    checkingFrame: checkingFrame,
    remainingFrameAtLow: checkingFrame > 0 && isFinite(forecast.minimum)
      ? checkingFrame + forecast.minimum
      : NaN,
    breachDate: breachDate,
    breachAmount: breachAmount,
    lastSync: shadowConfigValue_(config, CORE_ENGINE_SHADOW_V01.CONFIG_KEYS.LAST_SYNC),
    bankVerifiedAt: shadowConfigValue_(config, CORE_ENGINE_SHADOW_V01.CONFIG_KEYS.BANK_VERIFIED_AT)
  };
}

function runShadowParityV01() {
  const snapshot = getShadowFinancialSnapshotV01();
  const ss = typeof getSpreadsheet_ === 'function'
    ? getSpreadsheet_()
    : SpreadsheetApp.getActiveSpreadsheet();
  const dash = shadowSheet_(ss, CORE_ENGINE_SHADOW_V01.SHEETS.DASHBOARD);

  const comparisons = [
    shadowCompareNumber_('יתרת עו״ש מחושבת', snapshot.currentBalance, dash.getRange('Z2').getValue()),
    shadowCompareNumber_('סוף חודש צפוי', snapshot.monthEnd, dash.getRange('Z3').getValue()),
    shadowCompareLowPoint_(snapshot, dash)
  ];

  const coreForecast = typeof getForecast30DayMetrics_ === 'function'
    ? getForecast30DayMetrics_()
    : null;

  if (coreForecast) {
    comparisons.push(
      shadowCompareNumber_('שפל 30 יום מול Core', snapshot.low30, coreForecast.minimum),
      shadowCompareText_('תאריך שפל מול Core', snapshot.low30Date, coreForecast.minimumDate)
    );
  }

  const failed = comparisons.filter(function(x) { return !x.ok; });
  const result = {
    version: CORE_ENGINE_SHADOW_V01.VERSION,
    status: failed.length ? 'MISMATCH' : 'PASS',
    ok: failed.length === 0,
    snapshot: snapshot,
    comparisons: comparisons,
    failed: failed
  };

  const summary = shadowBuildParitySummary_(result);
  console.log(summary);
  console.log(JSON.stringify(result));

  try {
    SpreadsheetApp.getUi().alert(
      'בדיקת Shadow — ' + result.status,
      summary,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (e) {
    try {
      ss.toast(summary, 'בדיקת Shadow — ' + result.status, 10);
    } catch (ignored) {}
  }

  return result;
}

function shadowBuildParitySummary_(result) {
  const s = result.snapshot || {};
  const lines = [
    result.ok ? '🟢 PASS — כל ההשוואות תואמות' : '🔴 MISMATCH — נמצאו פערים',
    '',
    'עו״ש מחושב: ' + shadowMoney_(s.currentBalance),
    'סוף חודש: ' + shadowMoney_(s.monthEnd),
    'שפל 30 יום: ' + shadowMoney_(s.low30) + (s.low30Date ? ' | ' + s.low30Date : ''),
    'כיסוי תחזית: ' + Number(s.coveredDays || 0) + '/30',
    'מסגרת עו״ש: ' + shadowMoney_(s.checkingFrame),
    'מרווח בשפל: ' + shadowMoney_(s.remainingFrameAtLow),
    'חריגה צפויה: ' + (s.breachDate ? s.breachDate + ' | ' + shadowMoney_(s.breachAmount) : 'לא זוהתה')
  ];

  if (result.failed && result.failed.length) {
    lines.push('', 'פערים:');
    result.failed.forEach(function(item) {
      lines.push('• ' + item.name);
    });
  }

  return lines.join('\n');
}

function shadowCompareLowPoint_(snapshot, dash) {
  const z4 = dash.getRange('Z4').getValue();
  const z19 = dash.getRange('Z19').getValue();

  if (shadowIsDate_(z4)) {
    const amount = shadowNumber_(z19);
    return {
      name: 'נקודת שפל — חוזה חי',
      expected: {date: snapshot.low30Date, amount: snapshot.low30},
      actual: {date: shadowDayKey_(z4), amount: amount},
      ok: shadowDayKey_(z4) === snapshot.low30Date && shadowNumbersEqual_(amount, snapshot.low30)
    };
  }

  return shadowCompareNumber_('שפל 30 יום — סכום', snapshot.low30, z4);
}

function shadowForecast30_(cashRows, annualRows, now) {
  const values = Object.create(null);

  annualRows.forEach(function(r) {
    if (shadowIsDate_(r[0]) && isFinite(shadowNumber_(r[8]))) {
      values[shadowDayKey_(r[0])] = Number(r[8]);
    }
  });

  cashRows.forEach(function(r) {
    if (shadowIsDate_(r[0]) && isFinite(shadowNumber_(r[6]))) {
      values[shadowDayKey_(r[0])] = Number(r[6]);
    }
  });

  const points = [];
  let minimum = Infinity;
  let minimumDate = '';
  const today = shadowDayKey_(now);

  for (let i = 0; i < 30; i++) {
    const date = shadowAddDays_(today, i);
    if (values[date] === undefined) continue;
    const value = values[date];
    points.push({date: date, value: value});
    if (value < minimum) {
      minimum = value;
      minimumDate = date;
    }
  }

  return {
    points: points,
    minimum: points.length === 30 ? minimum : NaN,
    minimumDate: points.length === 30 ? minimumDate : ''
  };
}

function shadowEndOfMonth_(rows) {
  if (!rows.length || !shadowIsDate_(rows[0][0])) return {value: NaN, date: ''};
  const first = rows[0][0];
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const key = shadowDayKey_(lastDay);
  for (let i = 0; i < rows.length; i++) {
    if (shadowDayKey_(rows[i][0]) === key) {
      return {value: shadowNumber_(rows[i][6]), date: key};
    }
  }
  return {value: NaN, date: key};
}

function shadowConfigNumber_(sheet, key) {
  return shadowNumber_(shadowConfigValue_(sheet, key));
}

function shadowConfigValue_(sheet, key) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const rows = sheet.getRange(1, 1, lastRow, 2).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === key) return rows[i][1];
  }
  return '';
}

function shadowCompareNumber_(name, expected, actual) {
  const a = shadowNumber_(actual);
  return {
    name: name,
    expected: expected,
    actual: actual,
    ok: shadowNumbersEqual_(expected, a)
  };
}

function shadowCompareText_(name, expected, actual) {
  return {
    name: name,
    expected: String(expected || ''),
    actual: String(actual || ''),
    ok: String(expected || '') === String(actual || '')
  };
}

function shadowNumbersEqual_(a, b) {
  const x = shadowNumber_(a);
  const y = shadowNumber_(b);
  if (!isFinite(x) && !isFinite(y)) return true;
  return isFinite(x) && isFinite(y) && Math.abs(x - y) <= 0.01;
}

function shadowNumber_(value) {
  if (typeof value === 'number') return value;
  if (value == null || String(value).trim() === '') return NaN;
  const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : NaN;
}

function shadowMoney_(value) {
  const n = shadowNumber_(value);
  return isFinite(n)
    ? Number(n).toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ₪'
    : 'לא זמין';
}

function shadowSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('לא נמצא גיליון: ' + name);
  return sheet;
}

function shadowIsDate_(value) {
  return value instanceof Date && isFinite(value.getTime());
}

function shadowDayKey_(value) {
  if (!shadowIsDate_(value)) return '';
  return Utilities.formatDate(value, CORE_ENGINE_SHADOW_V01.TIMEZONE, 'yyyy-MM-dd');
}

function shadowAddDays_(key, days) {
  return new Date(Date.parse(key + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
