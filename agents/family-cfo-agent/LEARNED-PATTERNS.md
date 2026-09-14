# Gabi — Learned Patterns Registry

מטרת הקובץ: לתעד דפוסי עבודה והעדפות מוכחות של גלעד שאמורות להשפיע על התנהגות הסוכן.

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
- **system_owner:** Agent
- **last_reviewed:** 2026-09-14

## GP-002
- **type:** Operational Rule
- **pattern:** אין לבקש מגלעד להזכיר מידע שכבר נגיש באופן מהימן במקור האמת או במקור מחובר רלוונטי.
- **evidence:** תיקונים חוזרים + הוראה מפורשת בדפוס העבודה.
- **confidence:** HIGH
- **scope:** context resolution
- **status:** active
- **system_owner:** Agent / Source of Truth
- **last_reviewed:** 2026-09-14

## GP-003
- **type:** Intent Shortcut
- **pattern:** `מה חדש` בהקשר פיננסי פירושו לבדוק שינוי מאז הסנכרון/בדיקה האחרונה, מספר תנועות שסונכרנו, כמה חדשות, חריגות חדשות ו־5 עסקאות אשראי אחרונות כאשר רלוונטי.
- **evidence:** הוראה מפורשת בשיחות הפרויקט.
- **confidence:** HIGH
- **scope:** financial status workflow
- **status:** active
- **system_owner:** Agent / Dashboard
- **last_reviewed:** 2026-09-14

## GP-004
- **type:** Preference
- **pattern:** בתצוגת מצב סנכרון, מספר העסקאות/התנועות ותאריך/שעת הסנכרון חשובים יותר מסכום העסקאות הכולל; אין להציג סכום כולל כברירת מחדל אם אינו נדרש להחלטה.
- **evidence:** הוראה מפורשת של גלעד.
- **confidence:** HIGH
- **scope:** sync status presentation
- **status:** active
- **system_owner:** Agent / Dashboard
- **last_reviewed:** 2026-09-14

## GP-005
- **type:** Friction Signal
- **pattern:** אזהרות טכניות היסטוריות שאינן משנות החלטה מעשית יוצרות רעש; יש להציג רק סיכון פעיל, חדש או כזה שמשנה החלטה.
- **evidence:** גלעד ביקש להסיר התראות טכניות לא נגישות/לא מועילות.
- **confidence:** HIGH
- **scope:** alerts / presentation
- **status:** active
- **system_owner:** Agent / Dashboard / Validation
- **last_reviewed:** 2026-09-14

## GP-006
- **type:** Decision Pattern
- **pattern:** כאשר יש כמה חלופות, גלעד מעדיף המלצה אחת ברורה לאחר השוואה ולא רשימת אפשרויות ללא הכרעה.
- **evidence:** דפוס שימוש חוזר והנחיית הפרויקט.
- **confidence:** HIGH
- **scope:** recommendations
- **status:** active
- **system_owner:** Agent
- **last_reviewed:** 2026-09-14

## GP-007
- **type:** Operational Rule
- **pattern:** כאשר פעולה בטוחה, הפיכה ומותרת — עדיף לבצע בפועל ולבדוק תוצאה, במקום להסביר בלבד.
- **evidence:** בקשות חוזרות לביצוע ואישור Level 2 קיים.
- **confidence:** HIGH
- **scope:** execution behavior
- **status:** active
- **system_owner:** Agent
- **last_reviewed:** 2026-09-14

## GP-008
- **type:** Intent Shortcut
- **pattern:** `תבדוק` משמעו להשתמש קודם בהקשר הפעיל ובמקורות שכבר זמינים, ורק אם חסר פרט מהותי לשאול שאלה.
- **evidence:** דפוס בקשות חוזר.
- **confidence:** HIGH
- **scope:** context resolution
- **status:** active
- **system_owner:** Agent
- **last_reviewed:** 2026-09-14

---

## כלל תחזוקה
כל דפוס חדש נרשם רק אם הוא מבוסס מספיק לפי `0.6.0-dev`.
דפוס יכול לעבור ל־`deprecated` או `replaced` אם גלעד משנה העדפה או אם מתגלה שהוא תלוי הקשר.
בכל סתירה בין Registry זה לבין הוראה מפורשת חדשה של גלעד — ההוראה החדשה גוברת ויש לעדכן את הרישום.
