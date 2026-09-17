# Versioning Policy — Single Branch

## Rule
המערכת פועלת עם Release פעיל אחד על `dev` בלבד.

- פורמט: `dev-MAJOR.MINOR.PATCH`.
- `release.json` הוא מקור האמת המכני לגרסה הפעילה.
- דורון (`dev-engineering-agent`) הוא owner של version resolution ו־release metadata.
- אין `main`, אין prefix פעיל `core-`, ואין Promotion בין ענפים.

## Current baseline
- active branch: `dev`.
- active release: `dev-3.0.1`.
- architecture: single-agent + single-branch Doron.
- change class: PATCH — branch-wide optimization, drift cleanup and context reduction without intentional financial semantics change.

## Version Resolution
לפני שינוי גרסה:
1. קרא `release.json` ב־`dev`.
2. בדוק Git history וגרסאות שכבר שימשו.
3. הפרד Legacy Build IDs מ־Release Version.
4. קבע Change Class לפי ההשפעה בפועל.

אין לנחש מספר גרסה מזיכרון.

## Change Class
- `PATCH` — bugfix/optimization תואם ללא שינוי חוזה מהותי.
- `MINOR` — capability/contract/workflow חדש תואם.
- `MAJOR` — breaking compatibility או שינוי ארכיטקטוני/חוזי מהותי.

## Component Alignment
כל רכיב פעיל שמצהיר Release Version משתמש בגרסה הפעילה של הענף. Legacy IDs יכולים להישאר בנפרד לצורכי תאימות.

## Legacy / Historical
`core-*`, `V5.x`, `0.7.x` ומסמכי regression ישנים מותרים רק כאשר הם מזוהים במפורש כ־Legacy/Historical. הם אינם נטענים כברירת מחדל ואינם קובעים את הגרסה הפעילה.

## Release Gate
לפני הצגת גרסה כמאושרת:
- tests רלוונטיים עברו;
- readback תקין;
- `release.json` והמסמכים הקנוניים מסכימים;
- אין version drift פתוח בשטח ששונה;
- גלעד אמר `מאושר לקידום` או נתן אישור מפורש שקול.

`מאושר לקידום` = אישור לגרסת ה־DEV הנוכחית בתוך `dev`; אין מעבר לענף אחר.

## Approval Gate
שינוי release/version/metadata דורש אישור מפורש לפני mutation. קריאת metadata/history היא Read Only.

## Restore
שחזור משתמש ב־Git history או backup ref מפורש על `dev`.
