# Backlog Process — רואה חשבון

## מקור העבודה
GitHub Issues הוא מקור האמת למשימות פתוחות של הפרויקט.

Issue ראשי: `#24 [BACKLOG] רואה חשבון — אינדקס משימות פתוחות`.

## עדיפויות
- `P0` — חוסם אמינות, Runtime, סנכרון או קידום ל-CORE.
- `P1` — פונקציונליות מרכזית או תקלה משמעותית שאינה חוסמת את כל המערכת.
- `P2` — תחזוקה, חוב טכני, ניקוי Legacy, בדיקות ושיפור איכות.

## כלל קליטה
כל bug, feature, tech debt או משימת אימות חדשה חייבים לקבל Issue עצמאי לפני שהם נחשבים חלק מה-Backlog.

כל Issue יכלול:
1. מטרה.
2. דרישות או קריטריוני סגירה.
3. Branch ו-Release רלוונטיים.
4. Dependencies כאשר קיימים.
5. עדיפות בכותרת: `[P0]`, `[P1]` או `[P2]`.

## Workflow
`Capture → Prioritize → Implement in DEV → Test → Readback → Promote if needed → Verify CORE → Close`

- שינוי קוד חדש מבוצע ב-`dev`.
- `main` אינו משמש סביבת ניסוי.
- Issue נסגר רק לאחר Test + Readback.
- אם נדרש promotion, הסגירה מתבצעת רק לאחר אימות הגרסה המקודמת ב-CORE.
- משימה שהוזכרה בצ'אט אך אין לה Issue אינה נחשבת מנוהלת עד יצירת Issue.

## סדר עבודה
ברירת מחדל: `P0 → P1 → P2`, אלא אם dependency מחייב סדר אחר.

## Backlog נוכחי
### P0
- #15 Apps Script Runtime
- #16 RiseUp Sync
- #17 Automatic Bank Balance

### P1
- #18 Dashboard
- #19 Wix Live Data
- #20 Reconciliation / Anti-double-counting
- #21 Health / System Status

### P2
- #22 Legacy Migration
- #23 Regression Suite

## גרסאות בזמן יצירת המדיניות
- DEV: `dev-1.3.0`
- Approved CORE: `core-1.2.0`
- Promotion target: `core-1.3.0`
