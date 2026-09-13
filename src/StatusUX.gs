/**
 * ============================================================
 * רואה חשבון — Status UX V1.0
 * ============================================================
 * שכבת תצוגה פשוטה לסטטוס המערכת:
 * - מתרגמת אזהרות טכניות למשימות ברורות.
 * - מציגה מה צריך לעשות ומה הסטטוס הנוכחי.
 * - אינה משנה נתונים פיננסיים ואינה מחליפה את Health Check הטכני.
 * - אינה מציגה firstSeenAt למשתמש; זה נשאר עניין טכני פנימי.
 * ============================================================
 */

const STATUS_UX_V1 = {
  VERSION: 'V1.0',
  VERIFICATION_SHEET: 'אימות נתונים',
  CONFIG_SHEET: 'הגדרות'
};

function showSystemStatusSimpleV1() {
  const result = getSystemStatusSimpleV1_();
  SpreadsheetApp.getUi().alert(
    'סטטוס מערכת — פשוט',
    result.text,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return result;
}

function getSystemStatusSimpleV1_() {
  const ss = typeof getSpreadsheet_ === 'function'
    ? getSpreadsheet_()
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('לא נמצא קובץ מערכת פעיל.');

  const coreVersion = statusUxConfigValue_(ss, 'גרסת מערכת') || 'לא ידוע';
  const dashboardVersion = statusUxConfigValue_(ss, 'גרסת דשבורד') || 'לא ידוע';
  const syncAt = statusUxConfigValue_(ss, 'תאריך רענון אחרון');
  const bankVerifiedAt = statusUxConfigValue_(ss, 'תאריך ושעת יתרת עו״ש');
  const balance = statusUxNumber_(statusUxConfigValue_(ss, 'יתרת עו״ש מחושבת אוטומטית'));
  const verification = statusUxVerificationSummary_(ss);

  const tasks = [];
  const bankNeedsVerification = !statusUxValidDate_(bankVerifiedAt) ||
    (statusUxValidDate_(syncAt) && bankVerifiedAt.getTime() < syncAt.getTime());

  if (bankNeedsVerification) {
    tasks.push({
      icon: '🏦',
      title: 'לאמת את יתרת הבנק',
      status: '⏳ ממתין',
      action: 'שלח צילום מסך עדכני של יתרת העו״ש.',
      detail: 'אימות אחרון: ' + statusUxFormatDate_(bankVerifiedAt)
    });
  }

  if (verification.active > 0) {
    tasks.push({
      icon: '✅',
      title: 'לטפל בפריטים שמחכים לאימות',
      status: '⏳ ' + verification.active + ' פריטים ממתינים',
      action: 'פתח את גיליון "אימות נתונים" וטפל בפריטים הפעילים אחד־אחד.',
      detail: 'המעקב יתעדכן אוטומטית כשמספר הפריטים הפעילים ירד.'
    });
  }

  let technicalErrors = [];
  try {
    if (typeof healthCheckV56_ === 'function') {
      const health = healthCheckV56_();
      technicalErrors = Array.isArray(health.errors) ? health.errors.slice() : [];
    }
  } catch (e) {
    technicalErrors.push('בדיקת המערכת הטכנית לא הושלמה.');
  }

  const headline = technicalErrors.length
    ? '🔴 יש תקלה שדורשת בדיקה'
    : tasks.length
      ? '🟡 המערכת עובדת. יש ' + tasks.length + ' משימות פתוחות'
      : '🟢 המערכת תקינה ואין כרגע משימות פתוחות';

  const lines = [
    headline,
    '',
    'יתרת עו״ש מחושבת: ' + statusUxFormatMoney_(balance),
    'סנכרון אחרון: ' + statusUxFormatDate_(syncAt),
    'אימות עו״ש אחרון: ' + statusUxFormatDate_(bankVerifiedAt)
  ];

  if (technicalErrors.length) {
    lines.push('', 'מה לעשות עכשיו:', '• פתח את "בדיקת מערכת" וטפל בתקלה לפני פעולות נוספות.');
  }

  if (tasks.length) {
    lines.push('', 'מה צריך לעשות:');
    tasks.forEach(function(task, index) {
      lines.push(
        (index + 1) + '. ' + task.icon + ' ' + task.title + ' — ' + task.status,
        '   מה לעשות: ' + task.action,
        '   ' + task.detail
      );
    });
  } else if (!technicalErrors.length) {
    lines.push('', '✅ אין פעולה שנדרשת ממך כרגע.');
  }

  lines.push('', 'Core: ' + coreVersion + ' | Dashboard: ' + dashboardVersion);

  return {
    version: STATUS_UX_V1.VERSION,
    openTasks: tasks.length,
    tasks: tasks,
    technicalErrors: technicalErrors.length,
    verificationActive: verification.active,
    bankNeedsVerification: bankNeedsVerification,
    text: lines.join('\n')
  };
}

function statusUxVerificationSummary_(ss) {
  const sh = ss.getSheetByName(STATUS_UX_V1.VERIFICATION_SHEET);
  if (!sh || sh.getLastRow() <= 1) return {active: 0, total: 0};
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 9).getDisplayValues();
  if (typeof summarizeVerification_ === 'function') return summarizeVerification_(rows);

  let active = 0;
  let total = 0;
  rows.forEach(function(r) {
    if (!r[0]) return;
    total++;
    const lifecycle = String(r[8] || '').trim();
    if (/נסגר|הוחלף|לא פעיל/.test(lifecycle)) return;
    if (lifecycle) {
      if (/פעיל|דורש רענון/.test(lifecycle)) active++;
      return;
    }
    const status = String(r[5] || '');
    if (!/לא פעיל|נסגר|הוחלף/.test(status) && /פעיל|דורש|פער|חסר|לא אומת|חלקית/.test(status)) active++;
  });
  return {active: active, total: total};
}

function statusUxConfigValue_(ss, key) {
  if (typeof getConfigParam_ === 'function') {
    try { return getConfigParam_(key); } catch (e) {}
  }
  const sh = ss.getSheetByName(STATUS_UX_V1.CONFIG_SHEET);
  if (!sh || sh.getLastRow() < 1) return '';
  const values = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === key) return values[i][1];
  }
  return '';
}

function statusUxValidDate_(value) {
  return value instanceof Date && isFinite(value.getTime());
}

function statusUxFormatDate_(value) {
  if (!statusUxValidDate_(value)) return 'לא ידוע';
  return Utilities.formatDate(value, 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm');
}

function statusUxNumber_(value) {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && isFinite(Number(value))) return Number(value);
  return NaN;
}

function statusUxFormatMoney_(value) {
  return isFinite(value)
    ? Number(value).toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ₪'
    : 'לא זמין';
}
