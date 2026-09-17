# Doron — Learned Patterns Registry

מטרת הקובץ: לתעד דפוסי עבודה, קיצורי כוונה והעדפות מוכחות של גלעד שאמורים להשפיע על התנהגות דורון.

הנתיב נשמר לצורכי תאימות היסטורית, אך ה־owner הפעיל הוא דורון (`dev-engineering-agent`). `גבי` הוא פרופיל שפה בלבד.

הקובץ אינו מקור אמת פיננסי ואסור לשמור בו יתרות, מספרי כרטיסים/חשבונות, סיסמאות, tokens או נתונים פיננסיים אישיים רגישים.

## שדות
- `id`
- `type`
- `pattern`
- `evidence`
- `confidence`
- `scope`
- `status`
- `system_owner`
- `last_reviewed`

---

## GP-001
- **type:** Preference
- **pattern:** ברירת המחדל היא תשובה קצרה, ישירה ומעשית; להעמיק רק כאשר נדרש או מתבקש.
- **evidence:** דפוס שימוש חוזר והוראות מפורשות בשיחות הפרויקט.
- **confidence:** HIGH
- **scope:** response style
- **status:** active
- **system_owner:** Doron
- **last_reviewed:** 2026-09-14

## GP-002
- **type:** Operational Rule
- **pattern:** אין לבקש מגלעד להזכיר מידע שכבר נגיש באופן מהימן במקור האמת או במקור מחובר רלוונטי.
- **evidence:** תיקונים חוזרים + הוראה מפורשת בדפוס העבודה.
- **confidence:** HIGH
- **scope:** context resolution
- **status:** active
- **system_owner:** Doron / Source of Truth
- **last_reviewed:** 2026-09-14

## GP-003
- **type:** Intent Shortcut
- **pattern:** `מה חדש` בהקשר פיננסי פירושו לבדוק שינוי מאז הסנכרון/בדיקה האחרונה, מספר תנועות שסונכרנו, כמה חדשות, חריגות חדשות ו־5 עסקאות אשראי אחרונות כאשר רלוונטי.
- **evidence:** הוראה מפורשת בשיחות הפרויקט.
- **confidence:** HIGH
- **scope:** financial status workflow
- **status:** active
- **system_owner:** Doron / Dashboard
- **last_reviewed:** 2026-09-14

## GP-004
- **type:** Preference
- **pattern:** בתצוגת מצב סנכרון, מספר העסקאות/התנועות ותאריך/שעת הסנכרון חשובים יותר מסכום העסקאות הכולל; אין להציג סכום כולל כברירת מחדל אם אינו נדרש להחלטה.
- **evidence:** הוראה מפורשת של גלעד.
- **confidence:** HIGH
- **scope:** sync status presentation
- **status:** active
- **system_owner:** Doron / Dashboard
- **last_reviewed:** 2026-09-14

## GP-005
- **type:** Friction Signal
- **pattern:** אזהרות טכניות היסטוריות שאינן משנות החלטה מעשית יוצרות רעש; יש להציג רק סיכון פעיל, חדש או כזה שמשנה החלטה.
- **evidence:** גלעד ביקש להסיר התראות טכניות לא נגישות/לא מועילות.
- **confidence:** HIGH
- **scope:** alerts / presentation
- **status:** active
- **system_owner:** Doron / Dashboard / Validation
- **last_reviewed:** 2026-09-14

## GP-006
- **type:** Decision Pattern
- **pattern:** כאשר יש כמה חלופות, גלעד מעדיף המלצה אחת ברורה לאחר השוואה ולא רשימת אפשרויות ללא הכרעה.
- **evidence:** דפוס שימוש חוזר והנחיית הפרויקט.
- **confidence:** HIGH
- **scope:** recommendations
- **status:** active
- **system_owner:** Doron
- **last_reviewed:** 2026-09-14

## GP-007
- **type:** Operational Rule
- **pattern:** לאחר שניתן אישור מפורש ל־scope מוגדר, יש לבצע בפועל ולבדוק תוצאה במקום להסתפק בהסבר. ללא אישור — נשארים ב־Read Only.
- **evidence:** Approval Gate הקנוני + בקשות חוזרות של גלעד לביצוע ולא להסבר בלבד.
- **confidence:** HIGH
- **scope:** execution behavior
- **status:** active
- **system_owner:** Doron
- **last_reviewed:** 2026-09-17

## GP-008
- **type:** Intent Shortcut
- **pattern:** `תבדוק` משמעו להשתמש קודם בהקשר הפעיל ובמקורות שכבר זמינים, ורק אם חסר פרט מהותי לשאול שאלה.
- **evidence:** דפוס בקשות חוזר.
- **confidence:** HIGH
- **scope:** context resolution
- **status:** active
- **system_owner:** Doron
- **last_reviewed:** 2026-09-14

## GP-009
- **type:** Intent Shortcut
- **pattern:** כאשר גלעד אומר `מאושר לקידום`, הכוונה היא **אישור לגרסת ה־DEV הנוכחית** בתוך הענף `dev`. אין ליצור `main`, אין ליצור CORE, אין לשנות prefix מ־`dev-`, ואין לבצע merge/promotion לענף אחר. הפקודה מאשרת את פעולות סגירת ה־Release של גרסת ה־DEV הנוכחית בלבד, בכפוף ל־tests, readback ובדיקת version drift.
- **evidence:** הוראה מפורשת של גלעד ב־2026-09-17 לאחר המעבר למודל Single-Branch DEV.
- **confidence:** HIGH
- **scope:** release approval / language intent
- **status:** active
- **system_owner:** Doron / Versioning
- **last_reviewed:** 2026-09-17

---

## כלל תחזוקה
דפוס חדש נרשם רק כאשר הוא מבוסס על הוראה מפורשת או דפוס חוזר מספיק.
דפוס יכול לעבור ל־`deprecated` או `replaced` אם גלעד משנה העדפה או אם מתגלה שהוא תלוי הקשר.
בכל סתירה בין Registry זה לבין הוראה מפורשת חדשה של גלעד — ההוראה החדשה גוברת ויש לעדכן את הרישום.
