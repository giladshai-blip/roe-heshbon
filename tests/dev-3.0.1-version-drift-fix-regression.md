# dev-3.0.1 — Dashboard/Core Version Drift Fix Regression

## Scope
תיקון Issue #43: יישור גרסת Dashboard Runtime עם `release.json`, והפרדה מפורשת בין Release Version ל-Legacy Build ID ב-`src/Code.gs` וב-`src/Dashboard.gs`.

## נמצא לפני התיקון
- `src/Code.gs`: `V56.VERSION` (`'V5.10.1'`, פורמט Legacy Build) שימש בפועל בתור Release Version שנכתב ל-`גרסת מערכת` ונבדק מולו ב-Health Check — ערבוב בין שני מושגים.
- `src/Code.gs`: `V56.DASHBOARD_VERSION` (`'V5.9.0'`) היה עותק כפול/stale של גרסת הדשבורד, ונדרס ב-Runtime על ידי `activateDashboardV510CoreVersion_()` בערך `DASHBOARD_V56.VERSION` — כלומר שדה שאמור לייצג Legacy Build נדרס בערך בפורמט Release Version.
- `src/Dashboard.gs`: `DASHBOARD_V56.VERSION` (`'core-1.4.0'`) לא תואם כלל לסכימת הגרסה הנוכחית ב-`release.json` (`dev-3.0.1`).

## תיקון שבוצע
1. ב-`src/Code.gs`: הוחלף `V56.VERSION`/`V56.DASHBOARD_VERSION` ב-`V56.RELEASE_VERSION = 'dev-3.0.1'` ו-`V56.LEGACY_BUILD_ID = 'V5.10.1'` — תואם ל-`release.json.components.appsScriptCore` ו-`release.json.legacyBuildIds.appsScriptCore`.
2. `setupV56()` כותב כעת `גרסת מערכת` = Release Version, ו-`Legacy Build ID — Core` (פרמטר חדש, נפרד) = Legacy Build ID.
3. `healthCheckV56_()` משווה `גרסת מערכת` מול `V56.RELEASE_VERSION` בלבד, ו-`Legacy Build ID — Core` מול `V56.LEGACY_BUILD_ID` בלבד — ללא ערבוב בין המושגים.
4. בדיקת גרסת הדשבורד ב-Health Check מפנה ישירות ל-`DASHBOARD_V56.VERSION` (מקור אמת יחיד ב-`Dashboard.gs`) במקום עותק כפול/stale ב-`Code.gs`.
5. ב-`src/Dashboard.gs`: `DASHBOARD_V56.VERSION` עודכן ל-`'dev-3.0.1'` (תואם `release.json.components.dashboard`), ו-`LEGACY_BUILD_ID` נשאר `'V5.10.0'` (כבר תאם ל-`release.json.legacyBuildIds.dashboard`).
6. הוסרה `activateDashboardV510CoreVersion_()` — הפונקציה שגרמה לערבוב (העתיקה Release Version לשדה Legacy) הוסרה לחלוטין יחד עם קריאותיה; אין עוד יעד כתיבה כפול לגרסת הדשבורד.

## Required PASS
- [x] `release.json.components.appsScriptCore == 'dev-3.0.1'` תואם ל-`V56.RELEASE_VERSION` ב-`Code.gs`.
- [x] `release.json.legacyBuildIds.appsScriptCore == 'V5.10.1'` תואם ל-`V56.LEGACY_BUILD_ID` ב-`Code.gs`.
- [x] `release.json.components.dashboard == 'dev-3.0.1'` תואם ל-`DASHBOARD_V56.VERSION` ב-`Dashboard.gs`.
- [x] `release.json.legacyBuildIds.dashboard == 'V5.10.0'` תואם ל-`DASHBOARD_V56.LEGACY_BUILD_ID` ב-`Dashboard.gs`.
- [x] אין בקוד מקום יחיד שבו Legacy Build ID נכתב/מושווה תחת שם שדה של Release Version או להיפך.
- [x] אין עוד עותק כפול (`V56.DASHBOARD_VERSION`) לגרסת הדשבורד ב-`Code.gs`; Health Check קורא ישירות מ-`DASHBOARD_V56`.
- [x] `node --check` על שני הקבצים (כ-JS גנרי, ללא Apps Script globals) עובר ללא שגיאת תחביר.
- [x] Wrappers קיימים (`installDashboardV55/V54`, `setupV5`/`setupV54`...) לא נמחקו.

## Non-Regression
- לא בוצע שינוי בלוגיקה פיננסית, בנוסחאות, או במבנה הגיליונות.
- שמות הפונקציות הציבוריות (`setupV56`, `installDashboardV56`, `healthCheckV56_` וכו') לא השתנו — רק ערכי הקבועים ומקור ההשוואה.
- אין עוד תלות ב-`main`/promotion (הענף הפעיל היחיד הוא `dev`, לפי `dev-3.0.0-single-branch-regression.md`), כך שסעיף "DEV לפני MAIN" ב-Issue #43 אינו רלוונטי לארכיטקטורה הנוכחית.

## Pending — Runtime Readback (לביצוע ב-Apps Script בפועל)
בדיקת Syntax בוצעה סטטית בסביבה זו בלבד; אין גישה ל-Google Apps Script Runtime מסביבת הקוד. לפני סגירת Issue #43 יש להריץ בפועל ב-DEV:
1. `setupV56()` — לוודא `גרסת מערכת` ו-`Legacy Build ID — Core` נכתבים בנפרד ובערכים הנכונים.
2. `installDashboardV56()` — לוודא `גרסת דשבורד` = `dev-3.0.1` ו-`Legacy Build ID — Dashboard` = `V5.10.0`.
3. `runRuntimeSelfTestV57()` ו-`runDashboardSelfTestV5100()` — PASS מלא.
4. `showSystemStatusV5()` — הצגה נכונה של Core/Dashboard ללא אזהרת גרסה.

## Result
**PASS (סטטי)** — הקוד תוקן ועבר בדיקת תחביר; הפרדה מלאה בין Release Version ל-Legacy Build ID לכל הרכיבים, ומקור אמת יחיד לכל שדה גרסה. ממתין ל-Runtime Readback בפועל ב-Apps Script לפני סגירת Issue #43.
