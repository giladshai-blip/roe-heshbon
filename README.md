# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסה

**גרסת הפיתוח הפעילה: `dev-1.1.0`**  
**גרסה מאושרת ב־main: `core-1.0.0`**  
יעד הקידום של הפיתוח הנוכחי: **`core-1.1.0`**.

החל ממספור זה קיימת **גרסה אחת למערכת כולה**. Core, Dashboard, גבי ו־Wix אינם מקבלים עוד מספרי Release נפרדים. מזהים ישנים כמו `V5.10.1`, `V5.9.0`, `0.7.3-dev` ו־`1.0.3` נשמרים רק כ־Legacy Build IDs לצורכי תאימות והיסטוריה.

מקור האמת למספור ב־dev הוא `release.json`.

## כללי מספור

- כל Release ב־`main` מתחיל ב־`core-`.
- כל Release ב־`dev` מתחיל ב־`dev-`.
- פורמט: `<channel>-MAJOR.MINOR.PATCH`.
- בקידום שומרים על המספר ומחליפים קידומת בלבד: `dev-1.1.0` → `core-1.1.0`.
- `שחזר` מחזיר את רכיבי הניסוי לגרסה המאושרת האחרונה מ־`main`.

פירוט: `docs/versioning-and-user-actions.md`.

## קבצי Apps Script פעילים ב־dev

- `src/Code.gs` — מנוע פיננסי וסנכרון.
- `src/Dashboard.gs` — לוח מחוונים.
- `src/WixSync.gs` — גישור Wix.
- `src/UserActions.gs` — שכבת הפעולות הידידותית למשתמש.

## פונקציות למשתמש

מעתה ברירת המחדל היא להשתמש בשמות קצרים וברורים ללא מספר גרסה:

- `installSystem` — התקן/עדכן את המערכת.
- `syncNow` — סנכרן עכשיו.
- `syncHistory12Months` — סנכרן 12 חודשים אחורה.
- `updateBankBalance` — עדכן יתרת עו״ש מאומתת.
- `refreshForecasts` — רענן תחזיות.
- `checkSystemHealth` — בדוק תקינות מערכת.
- `runSystemDiagnostics` — הרץ אבחון מלא.
- `showSystemStatus` — הצג מצב מערכת.
- `openDashboard` — פתח דשבורד.
- `enableAutomaticSync` / `disableAutomaticSync` — הפעל/בטל סנכרון אוטומטי.
- `reconcilePlannedCashflow` — התאם תזרים מתוכנן לביצוע.
- `buildDashboard` / `refreshDashboard` / `resetDashboard` — פעולות דשבורד.
- `syncWixNow` — סנכרן Wix.
- `showReleaseInfo` — הצג את גרסת ה־Release הנוכחית.

שמות ישנים הכוללים `V5`, `V56`, `V57`, `V59` או `V1` נשארים זמנית רק כיעדי תאימות עבור טריגרים וקוד קיים.

## פיתוח בטוח

- `main` הוא מצב מאושר ויציב.
- פיתוח מתבצע ב־`dev`.
- לפני רפקטור משמעותי נשמר branch גיבוי.
- לפני קידום ל־`main` נדרשות בדיקות רגרסיה ובדיקת Runtime חיה.
- גיבוי לפני רפקטור המספור הנוכחי: `backup/dev-pre-release-train-20260915`.

## אבטחה

אין לשמור PAT, סיסמאות, API keys או סודות ב־GitHub. סודות נשמרים ב־Script Properties או במנגנון סודות מתאים בלבד.
