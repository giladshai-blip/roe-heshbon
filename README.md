# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסה

**גרסת הפיתוח הפעילה: `dev-1.2.0`**  
**גרסה מאושרת ב־main: `core-1.0.0`**  
יעד הקידום: **`core-1.2.0`**.

קיימת גרסת Release אחת למערכת כולה. מזהים ישנים נשמרים רק כ־Legacy Build IDs לצורכי תאימות והיסטוריה. מקור האמת למספור הוא `release.json`.

## Router של שיחה

כל שיחה חדשה מתחילה בשלוש אפשרויות בלבד:

1. **גבי — סוכן פיננסי אישי** (`היי גבי`)
2. **DEV — סביבת פיתוח ובדיקות** (`היי dev`)
3. **CORE — המערכת הפעילה והמאושרת** (`היי core`)

בחירה `1` / `2` / `3` מנתבת מיד למצב המתאים. אין צורך בטריגר נוסף אחרי בחירת מספר.

הטריגרים הישירים מדלגים על התפריט:
- `היי גבי` → GABI_AGENT
- `היי dev` → DEV_ENVIRONMENT
- `היי core` → CORE_RUNTIME

`החלף מצב` או `תפריט` מחזירים לתפריט שלושת המצבים.

מפרט: `docs/dev-1.2.0-three-mode-conversation-router.md`.
בדיקות: `tests/dev-1.2.0-three-mode-router-regression.md`.

## כללי מספור

- `main`: קידומת `core-`.
- `dev`: קידומת `dev-`.
- פורמט: `<channel>-MAJOR.MINOR.PATCH`.
- בקידום שומרים על המספר ומחליפים קידומת: `dev-1.2.0` → `core-1.2.0`.
- `שחזר` מחזיר רכיבי ניסוי מה־main המאושר האחרון.

## קבצי Apps Script פעילים ב־dev

- `src/Code.gs` — מנוע פיננסי וסנכרון.
- `src/Dashboard.gs` — לוח מחוונים.
- `src/WixSync.gs` — גישור Wix.
- `src/UserActions.gs` — פעולות ידידותיות למשתמש.

## פונקציות למשתמש

- `installSystem` — התקן/עדכן מערכת.
- `syncNow` — סנכרן עכשיו.
- `syncHistory12Months` — סנכרן 12 חודשים.
- `updateBankBalance` — עדכן יתרת עו״ש.
- `refreshForecasts` — רענן תחזיות.
- `checkSystemHealth` — בדוק תקינות.
- `runSystemDiagnostics` — אבחון מלא.
- `checkDuplicateTransactions` — בדוק כפילויות.
- `reviewDataVerification` — בדוק אימות נתונים.
- `showSystemStatus` — מצב מערכת.
- `openDashboard` — פתח דשבורד.
- `enableAutomaticSync` / `disableAutomaticSync` — סנכרון אוטומטי.
- `reconcilePlannedCashflow` — התאמת תכנון לביצוע.
- `buildDashboard` / `refreshDashboard` / `resetDashboard` — פעולות דשבורד.
- `updateRiseUpToken` / `clearRiseUpToken` — חיבור RiseUp.
- `updateWixApiKey` / `clearWixApiKey` — חיבור Wix.
- `syncWixNow` — סנכרן Wix.
- `showReleaseInfo` — הצג Release.

שמות Legacy נשארים זמנית רק לתאימות פנימית.

## פיתוח בטוח

- `main` הוא מצב מאושר ויציב.
- פיתוח חדש מתבצע ב־`dev`.
- CORE אינו סביבת ניסוי; שינוי חדש מנותב ל־DEV.
- לפני רפקטור משמעותי נשמר branch גיבוי.
- לפני קידום נדרשות בדיקות רגרסיה ו־readback.
- גיבוי לניסוי הנוכחי: `backup/dev-pre-three-mode-router-20260915`.

## אבטחה

אין לשמור PAT, סיסמאות, API keys או סודות ב־GitHub. סודות נשמרים ב־Script Properties או במנגנון סודות מתאים בלבד.
