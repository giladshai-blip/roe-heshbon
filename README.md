# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets + Google Apps Script + RiseUp API.

## גרסה נוכחית
V5.2

## קבצים
- `src/Code.gs` — הקוד המלא הנוכחי להדבקה ב-Google Apps Script.
- `versions/riseup-sync-v5.2.gs` — עותק גרסה היסטורי של V5.2.
- `skills/` — חבילת Skills פיננסיים יציבה V1.1.
- `tests/skills-v1.1-regression-report.md` — דוח רגרסיה של חבילת ה-Skills.

## Skills V1.1
חבילת ה-Skills כוללת Router מרכזי ו-Skills ייעודיים לאימות מסמכים, תזרים, כרטיסי אשראי, תקציב, פנסיה וביקורת מערכת. כל Skill כפוף ל-`docs/project-instructions.md` שב-`main` ומתייחס לקובץ `רואה חשבון - מערכת פיננסית` כמקור האמת המרכזי.

סטטוס בדיקות: **13/13 PASS ברמת לוגיקת ההנחיות**. בדיקות אלה אינן בדיקות Runtime או API חיות.

## עקרונות
- קוד מלא בכל גרסה, לא patch.
- סנכרון RiseUp עם upsert ומניעת כפילויות.
- יתרת עו״ש מחושבת מעוגן מאומת + תנועות checkingAccount חדשות.
- Health Check, יומן סנכרון, סריקת אימות, טריגר שעתי.
- דשבורד RTL בעברית עם 4 שעוני Gauge.
- Match → Update → Create ומניעת anti-double-counting בעיבוד אירועים פיננסיים.

## אבטחה
אין לשמור PAT או סודות בקוד או ב-GitHub. את `RISEUP_PAT` יש לשמור ב-Script Properties בלבד.
