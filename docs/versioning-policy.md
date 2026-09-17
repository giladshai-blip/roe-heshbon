# Versioning Policy — Single Branch

## Rule
המערכת פועלת עם Release פעיל אחד על ענף `dev` בלבד.

- פורמט: `dev-MAJOR.MINOR.PATCH`.
- `release.json` הוא מקור האמת המכני לגרסה הפעילה.
- דורון (`dev-engineering-agent`) הוא owner של version resolution ו־release metadata.
- אין `main`, אין prefix פעיל מסוג `core-`, ואין Promotion בין ענפים.

## Current baseline
- active branch: `dev`.
- active release: `dev-3.0.0`.
- architecture: single-agent + single-branch Doron.

מספרים ישנים מסוג `core-*`, `V5.x`, `0.7.x` נשמרים בהיסטוריה/Legacy בלבד ואינם מייצגים את הגרסה הפעילה.

## Version Resolution
לפני שינוי גרסה דורון בודק:
1. `release.json` ב־`dev`;
2. `docs/versioning-policy.md`;
3. Git history, branches ניסיוניים וגרסאות שכבר שימשו;
4. Legacy Build IDs בנפרד מה־Release Version.

אין לנחש מספר גרסה מזיכרון.

## Change Class
- `PATCH` — bugfix תואם ללא שינוי חוזה.
- `MINOR` — capability/contract/workflow חדש תואם.
- `MAJOR` — breaking compatibility או שינוי ארכיטקטוני/חוזי מהותי.

המעבר ממודל `main + dev + CORE + promotion` למודל `dev` יחיד הוא MAJOR ולכן הגרסה היא `dev-3.0.0`.

## Components
כל הרכיבים הפעילים חולקים את אותה גרסת Release, כולל:
- Apps Script Core;
- Dashboard;
- Doron unified orchestrator;
- Gabi language style;
- financial Domain Sub-agents;
- router/bridges פעילים.

## Legacy Identifiers
Legacy Build IDs כגון `V5.10.1`, `V5.10.0`, `0.7.x` ומסמכי `core-*` היסטוריים יכולים להישאר לצורכי traceability ותאימות.
הם אינם Release Version פעיל.

## Files and Tests
מסמך/בדיקה חדשים שמייצגים release פעיל משתמשים ב־`dev-3.0.0` או במספר ה־DEV הפעיל הבא.
מסמכים היסטוריים נשארים ללא שינוי לצורכי auditability.

## Approval Gate
שינוי `release.json`, גרסה, branch או metadata דורש אישור מפורש של גלעד לפני mutation.
קריאת metadata ו־Git history היא Read Only ואינה דורשת אישור.

## Release Gate
לפני הצגת גרסה כפעילה לאחר שינוי:
- tests רלוונטיים עברו;
- readback תקין;
- `release.json` והמסמכים הקנוניים מסכימים;
- אין version drift פתוח בשטח ששונה.

אין Promotion Gate כי אין ענף יעד אחר.

## GitHub Handoff
לכל שינוי קוד/סקריפט/release דורון מצרף קישור GitHub ישיר למקור ששונה ול־commit הרלוונטי כאשר קיים.

## Restore
`שחזר` משתמש ב־Git history או backup ref מפורש על `dev`.
אין restore base מסוג `main`/`core`.
