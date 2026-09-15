# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script ו־RiseUp API.

## גרסה יציבה

Core **V5.9.0** ו־Dashboard **V5.8.0**.

V5.9 עברה Shadow/Parity ובדיקות קבלה חיות ב־Google Apps Script ובגיליון המקור; ראו `tests/core-v5.9-cutover-report.md`.

## שני קובצי Apps Script בלבד

- `src/Code.gs` — Core מלא: סנכרון, upsert, תחזיות, אימות, Health Check, טריגרים ובדיקות Runtime.
- `src/Dashboard.gs` — Dashboard מלא: KPI, משימות, עדכניות נתונים, התראה פעילה ומרווח מסגרת עו״ש.

קובצי הפיתוח המודולריים הישנים הוסרו מ־`dev`. ה־`AutomationEngine.gs` הישן הוסר גם מהפרויקט החי ב-Apps Script כחלק מהמעבר ל-V5.9 (ראו `tests/core-v5.9-cutover-report.md`); ההיסטוריה נשמרת ב־Git וניתנת לשחזור.

## שיפורי V5.9 (על גבי V5.7)

- לוגיקת התאמת תזרים מתוכנן ↔ תנועות עבר עברה ל-Core (`src/Code.gs`) במצב קריאה בלבד, ואינה דורסת נוסחאות K–M.
- תוקן באג סינון סטטוס ישן שדילג בטעות על עסקאות בסטטוס `⏳ טרם בוצע`.
- הוסרה תלות בערכי מסגרת עו״ש מקודדים בקוד.
- `AutomationEngine.gs` הישן הוסר מהפרויקט החי, ונוספו `upsertSystemAlertV59_`/`refreshCashflowAlertsV59_` שכותבות וסוגרות את התראת `cashflow_low_margin` בגיליון `התראות מערכת` ישירות מ-`getFinancialSnapshotV58_` (מופעל מתוך `healthCheckV56_`, כך שהוא רץ בכל סנכרון ובכל בדיקת Health Check). **טרם עבר בדיקת Runtime חיה** — נבדק סטטית (תחביר + Sheet מדומה) בלבד.
- מקור קוד קנוני שתואם לגרסה הפעילה שנמסרה.
- בדיקות Runtime מתוך תפריט המערכת באמצעות `runRuntimeSelfTestV57`.
- בדיקת מבנה גיליונות, סכימה, כפילויות, תקינות עסקאות, כיסוי תחזית ו־KPI.
- הצגת מרווח מסגרת העו״ש בנקודת השפל.
- הצגת ההתראה הפתוחה המרכזית בדשבורד.
- סימון מפורש שמדד האשראי הוא יחס חיוב קרוב למסגרת ולא ניצול כולל.
- שמירת תאימות לפונקציות V5 הקיימות ולטריגר `syncRiseUpV5`.

## התקנה ובדיקה

1. החלף את תוכן `Code.gs` בקובץ `src/Code.gs` מ־`dev`.
2. החלף את תוכן `Dashboard.gs` בקובץ `src/Dashboard.gs` מ־`dev`.
3. הרץ `setupV59` (אליאס תואם-לאחור: `setupV57`).
4. הרץ `runRuntimeSelfTestV57`.
5. הרץ `runV5Now` ולאחר מכן `healthCheckV5`.
6. אמת מול הבנק את יתרת העו״ש ואת מרווח המסגרת.

הגרסה קודמה ל־`main` לאחר שכל הבדיקות החיות עברו.

## בדיקות אוטומטיות (CI)

`.github/workflows/ci.yml` מריץ בכל push/PR:
- `scripts/check-gs-syntax.js` — בדיקת תחביר סטטית לשני קובצי ה-Apps Script.
- `scripts/check-version-sync.js` — מוודא ש-README, `src/Code.gs` ו-`src/Dashboard.gs` מסכימים על אותו מספר גרסה (זה בדיוק התיקון למקרה שבו README הציג גרסה ישנה מול קוד עדכני ב-`main`).

בדיקות אלו סטטיות בלבד; הן אינן מחליפות בדיקת Runtime חיה מול הגיליון.

## אבטחה

אין לשמור PAT, סיסמאות או סודות בקוד או ב־GitHub. את `RISEUP_PAT` שומרים ב־Script Properties בלבד.
