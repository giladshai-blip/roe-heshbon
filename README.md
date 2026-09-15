# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסאות

**גרסת production מאושרת: `core-1.2.0`**  
**גרסת הפיתוח הפעילה: `dev-1.3.0`**  
יעד הקידום הבא: **`core-1.3.0`**.

מקור האמת למספור הוא `release.json` בכל branch.

## Router של שיחה — מאושר ב־core-1.2.0

כל שיחה חדשה מתחילה בשלוש אפשרויות בלבד:

1. **גבי — סוכן פיננסי אישי** (`היי גבי`)
2. **DEV — סביבת פיתוח ובדיקות** (`היי dev`)
3. **CORE — המערכת הפעילה והמאושרת** (`היי core`)

בחירה `1` / `2` / `3` מנתבת מיד למצב המתאים. אין צורך בטריגר נוסף אחרי בחירת מספר.

הטריגרים הישירים מדלגים על התפריט:
- `היי גבי` → `GABI_AGENT`
- `היי dev` → `DEV_ENVIRONMENT`
- `היי core` → `CORE_RUNTIME`

`החלף מצב` או `תפריט` מחזירים לתפריט שלושת המצבים.

## כללי מספור

- כל Release ב־`main` מתחיל ב־`core-`.
- כל Release ב־`dev` מתחיל ב־`dev-`.
- קיימת גרסת Release אחת למערכת כולה.
- Legacy Build IDs נשמרים רק לתאימות והיסטוריה.

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

## פיתוח בטוח

- `main` הוא production מאושר.
- `dev` הוא פיתוח וניסויים.
- CORE אינו סביבת ניסוי; שינוי חדש מנותב ל־DEV.
- `שחזר` מחזיר רכיבי ניסוי מה־main המאושר האחרון ולא מגרסת dev ישנה.
- גיבוי לפני Router: `backup/dev-pre-three-mode-router-20260915`.
- גיבוי production: `backup/main-pre-core-1.2.0-router-20260915`.

## אבטחה

אין לשמור PAT, סיסמאות, API keys או סודות ב־GitHub. סודות נשמרים ב־Script Properties או במנגנון סודות מתאים בלבד.
