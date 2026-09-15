# Regression — Release Train & User Actions — dev-1.1.0

מטרה: לוודא שמספור הגרסאות והשמות הידידותיים נשארים עקביים בלי לשבור תאימות לאחור.

## Release Train

1. `release.json.channel` = `dev`.
2. `release.json.version` = `dev-1.1.0`.
3. `release.json.promotionTarget` = `core-1.1.0`.
4. `release.json.approvedCore` = `core-1.0.0`.
5. כל רכיב פעיל ב־`release.json.components` משתמש ב־`dev-1.1.0`.
6. אין גרסת Release פעילה נפרדת ל־Core / Dashboard / Agent / Wix.
7. מזהים ישנים (`V5.x`, `0.7.x`, `1.0.x`) מוגדרים Legacy Build IDs בלבד.

## Canonical files

8. קיימים בדיוק ארבעת הקבצים הקנוניים הפעילים הבאים ברמת Apps Script:
   - `src/Code.gs`
   - `src/Dashboard.gs`
   - `src/WixSync.gs`
   - `src/UserActions.gs`
9. אין קובצי candidate/alternate של Core או Dashboard ב־`src/`.

## User-facing API

10. הפונקציות הידניות הקנוניות אינן כוללות מספר גרסה בשם.
11. חייבות להתקיים הפעולות:
   - `installSystem`
   - `syncNow`
   - `syncHistory12Months`
   - `updateBankBalance`
   - `refreshForecasts`
   - `checkSystemHealth`
   - `runSystemDiagnostics`
   - `checkDuplicateTransactions`
   - `reviewDataVerification`
   - `showSystemStatus`
   - `openDashboard`
   - `enableAutomaticSync`
   - `disableAutomaticSync`
   - `reconcilePlannedCashflow`
   - `buildDashboard`
   - `refreshDashboard`
   - `resetDashboard`
   - `updateRiseUpToken`
   - `clearRiseUpToken`
   - `updateWixApiKey`
   - `clearWixApiKey`
   - `syncWixNow`
   - `showReleaseInfo`
12. כל פעולה ידידותית מפנה ליעד Legacy קיים או מממשת UI בטוח מעליו.
13. פונקציות Legacy אינן נמחקות כל עוד טריגר, Wix או קוד אחר עשויים לקרוא להן.
14. `showSystemStatus` מציג חלון אחד בלבד.
15. פעולות עדכון מפתחות RiseUp/Wix משתמשות ב־UI prompt ואינן דורשות העברת פרמטר ידנית מתוך Function dropdown.
16. אין סוד, PAT או API key בקובצי GitHub.

## Restore / Promotion

17. `שחזר` משחזר רק רכיבי ניסוי מ־`main` האחרון המאושר.
18. branch הגיבוי `backup/dev-pre-release-train-20260915` קיים.
19. אין קידום ל־`main` לפני בדיקת Runtime חיה של ארבעת קובצי Apps Script.
20. בקידום מאושר מחליפים `dev-1.1.0` ב־`core-1.1.0` כגרסת Release; Legacy Build IDs נשארים לצורכי תאימות עד מיגרציה מבוקרת.

## PASS

PASS רק אם כל הסעיפים לעיל מתקיימים וה־wrappers נבדקו בסביבת Apps Script ללא שבירת טריגרים קיימים.
