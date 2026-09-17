# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסה מאושרת

**`core-1.10.0`** היא גרסת ה־Release המאושרת ב־`main`.

מקור האמת המכני לגרסה המאושרת הוא `release.json`.

## שלושת מצבי השיחה

כל שיחה חדשה מתחילה בתפריט:

1. **גבי — סוכן פיננסי אישי** (`היי גבי`)
2. **דורון — סביבת DEV לפיתוח ובדיקות** (`היי דורון` / `היי dev`)
3. **CORE — המערכת הפעילה והמאושרת** (`היי core`)

בחירה `1` / `2` / `3` מפעילה מיד את המצב. אין צורך בטריגר נוסף.

טריגר ישיר מדלג על התפריט:
- `היי גבי` → `GABI_AGENT`
- `היי דורון` / `היי dev` → `DEV_ENVIRONMENT`
- `היי דב` → `DEV_ENVIRONMENT` כ־legacy alias בלבד
- `היי core` → `CORE_RUNTIME`

`החלף מצב` או `תפריט` מחזירים לבחירה.

## מדיניות גרסאות

- `main` → `core-*`.
- `dev` → `dev-*`.
- גרסת Release אחת לכל המערכת.
- Legacy Build IDs נשמרים לצורכי תאימות בלבד.

Legacy Build IDs מאושרים ב־`core-1.10.0`:
- Apps Script Core: `V5.10.1`
- Dashboard: `V5.10.0`
- Gabi Agent: `0.7.2`
- Sub-agents: `0.7.0`

## מצבי עבודה

### GABI_AGENT
גבי הוא שכבת השיחה הפיננסית. מקור האמת הפיננסי: `רואה חשבון - מערכת פיננסית`.

### DEV_ENVIRONMENT
דורון (`dev-engineering-agent`) אחראי על קוד, ארכיטקטורה, debugging, בדיקות, GitHub, release ו־versioning. פיתוח ובדיקות נעשים ב־`dev`; אין לבצע ניסוי ישירות ב־`main`.

### CORE_RUNTIME
תפעול ובדיקת המערכת המאושרת ב־`main`. פיתוח חדש מנותב ל־DEV לפני קידום.

## Apps Script בגרסה המאושרת

- `src/Code.gs` — מנוע פיננסי, סנכרון, תחזיות, אימות, Health Check וטריגרים.
- `src/Dashboard.gs` — Dashboard מאושר.

מזהי פונקציות Legacy נשמרים כאשר הם נדרשים כדי לא לשבור טריגרים, התקנות או תאימות לאחור.

## מקורות קנוניים

- `docs/project-instructions.md` — Startup Kernel וכללי ניתוב עליונים.
- `release.json` — מקור האמת לגרסת המערכת.
- `docs/project-runtime-rules.md` — כללי Runtime מפורטים.
- `agents/family-cfo-agent/AGENT.md` — הגדרת גבי.
- `agents/dev-engineering-agent/AGENT.md` — הגדרת דורון.
- `docs/versioning-policy.md` — מדיניות גרסאות וקידום.

מסמכי גרסאות ישנות ובדיקות regression נשמרים כהיסטוריה לצורכי traceability ואינם נחשבים מקור הפעלה קנוני.

## שחזור

`main` הוא מקור השחזור המאושר לניסויי `dev`. `שחזר` מחזיר את רכיבי הניסוי הפעיל מה־main המאושר האחרון ומבצע readback/compare.

## אבטחה

אין לשמור PAT, סיסמאות, API keys או סודות בקוד או ב־GitHub. סודות נשמרים ב־Script Properties או במנגנון סודות מתאים בלבד.
