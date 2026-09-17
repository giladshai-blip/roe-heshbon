# dev-3.0.0 — Single Branch Regression

## Scope
בדיקת חוזה סטטית למעבר למערכת בעלת Agent יחיד וענף פעיל יחיד.

## Required PASS
- `dev` הוא Default Branch.
- `main` אינו קיים.
- `release.json` מצהיר `dev-3.0.0` ו־`single-agent-single-branch-doron`.
- אין Production branch או Promotion workflow פעיל.
- דורון הוא הסוכן וה־owner היחיד.
- `גבי` הוא presentation style בלבד.
- כל חמשת Domain Agents כפופים לדורון ומצהירים `dev-3.0.0`.
- Approval Gate מחייב אישור לכל mutation.
- Read Only ו־readback אינם דורשים אישור.
- מקור האמת הפיננסי, Freshness, Financial Self-Check ו־anti-double-counting נשמרים.
- Legacy IDs נשארים Legacy בלבד ואינם Release Version.

## Non-Regression
- אין שינוי בקוד Apps Script במסגרת המעבר הזה.
- אין שינוי בנתונים פיננסיים במסגרת המעבר הזה.
- מסמכי `core-*` היסטוריים יכולים להישאר לצורכי audit/traceability ואינם מקור הפעלה.

## Result
**PASS** — אומת ב־readback: `dev` הוא Default Branch, `main` אינו קיים, `release.json`/Kernel/Doron/Domain Agents מיושרים ל־`dev-3.0.0`, ו־Promotion/CORE אינם מסלול פעיל.
