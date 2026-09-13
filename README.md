# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets + Google Apps Script + RiseUp API.

## גרסה בפיתוח
V5.3 ב־`dev`.

`main` נשאר יציב על V5.2 עד לסיום Smoke Test חי ב־Google Apps Script.

## מבנה קוד V5.3
הקוד פוצל למודולים תחת `src/`:
- `00_Config.gs` — קונפיגורציה, cache וגישה ל־Sheets/Config.
- `10_ApiTransactions.gs` — RiseUp API, batching, retries ו־transaction upsert.
- `20_BudgetCashflow.gs` — Budget, יתרת עו״ש ותחזיות.
- `30_DashboardHealth.gs` — Dashboard, RTL ו־Health Checks.
- `40_App.gs` — entry points, תפריט, orchestration ו־triggers.
- `90_Utils.gs` — utilities משותפים.

ה־entry points הציבוריים של V5 נשמרו כדי לשמור תאימות לתפריט ולטריגרים קיימים.

## שיפורי ביצועים V5.3
- Cache ל־Spreadsheet, גיליונות ומפת `הגדרות` במהלך execution יחיד.
- `UrlFetchApp.fetchAll()` בקבוצות מבוקרות במקום קריאות היסטוריות סדרתיות בלבד.
- כתיבת עדכוני עסקאות בקבוצות רציפות במקום `setValues` נפרד לכל שורה.
- רענון נוסחאות כפילות רק לשורות חדשות במהלך sync רגיל.
- נוסחת יתרת עו״ש משתמשת בטווחים תחומים ודינמיים במקום עמודות שלמות.
- Health Check מהיר בסנכרון שוטף ו־Deep Health Check בבדיקה ידנית/setup.
- RTL מיושם רק על טווח בשימוש ולא על כל ה־grid המקסימלי.

## בדיקות
- `tests/code-v5.3-regression-report.md` — 11/11 PASS בבדיקות syntax/מבנה/מוקים.
- הבדיקות אינן מחליפות Smoke Test חי מול Google Apps Script + RiseUp API.

## Skills וסוכנים
- `agents/` — Family CFO ו־Sub-agents.
- `skills/` — Router ו־Skills פיננסיים.
- כולם כפופים ל־`docs/project-instructions.md` שב־`main`.

## עקרונות
- `main` הוא קוד יציב בלבד; `dev` לפיתוח ובדיקה.
- קוד מלא ולא patch בלבד.
- סנכרון RiseUp עם upsert ומניעת כפילויות.
- יתרת עו״ש מחושבת מעוגן מאומת + תנועות checkingAccount חדשות.
- Match → Update → Create ו־anti-double-counting.
- שינויי Runtime משמעותיים מקודמים רק לאחר בדיקה מתאימה.

## אבטחה
אין לשמור PAT או סודות בקוד או ב-GitHub. את `RISEUP_PAT` יש לשמור ב-Script Properties בלבד.
