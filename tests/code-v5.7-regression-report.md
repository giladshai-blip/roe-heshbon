# דוח בדיקות V5.7

תאריך: 2026-09-13
Branch: `dev`

## היקף

- Core מלא ב־`src/Code.gs`.
- Dashboard מלא ב־`src/Dashboard.gs`.
- שני קובצי Apps Script קנוניים בלבד.

## בדיקות מקומיות

1. JavaScript syntax — PASS.
2. טעינת שני הקבצים יחד — PASS.
3. אין שמות פונקציות כפולים — PASS.
4. פונקציות ציבוריות נדרשות קיימות — PASS.
5. Core ו־Dashboard מסומנים V5.7.0 — PASS.
6. לא נמצא PAT או token מוטמע — PASS.
7. הדשבורד קורא התראות פתוחות מגיליון `התראות מערכת` — PASS.
8. מרווח מסגרת העו״ש מחושב מהמסגרת המאומתת ומשפל 30 הימים — PASS.

## בדיקות Runtime שנוספו

`runRuntimeSelfTestV57` בודקת בתוך Google Apps Script:
- מבנה גיליונות וסכימות.
- תקינות המודל.
- כפילויות ועסקאות לא תקינות.
- כיסוי מלא של תחזית 30 יום.
- עקביות KPI ו־Health Check.

## בדיקות קבלה חיות

גלעד אישר ב־13/09/2026 שכל ארבע בדיקות הקבלה עברו בסביבה הפעילה:

- `setupV57` — PASS.
- `runRuntimeSelfTestV57` — PASS.
- `runV5Now` — PASS.
- `healthCheckV5` — PASS.

## סטטוס קידום

מאושר לקידום ל־`main`.
