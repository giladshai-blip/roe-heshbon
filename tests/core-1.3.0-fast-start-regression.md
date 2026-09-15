# Regression — core-1.3.0 Gabi Fast Start

מטרה: לוודא שהפעלת גבי קצרה משמעותית, בלי לפגוע באמינות כאשר מתחילה עבודה פיננסית.

## Acceptance tests

1. **Pure greeting — Gabi**
   - קלט ראשון: `היי גבי`
   - מצב: `GABI_AGENT`
   - תשובה: אישור קצר שגבי פעיל.
   - Drive פיננסי: 0 קריאות.
   - Runtime rules: 0 טעינות.
   - Web/Skills: 0 טעינות.
   - אין יתרה, תחזית או דוח פיננסי.

2. **Menu → 1**
   - `היי` → תפריט.
   - `1` → גבי פעיל מיד.
   - אין Activation Gate נוסף.
   - אין Drive פיננסי עד שאלה פיננסית.

3. **Greeting + financial task**
   - קלט: `היי גבי תזרים`.
   - אין תשובת ברכה נפרדת.
   - Runtime רלוונטי נטען.
   - Source of Truth נקרא.
   - Freshness נבדק.
   - מתבצע Financial Self-Check.

4. **Financial task after greeting**
   - `היי גבי` ואחריו `מה היתרה שלי?`.
   - רק בשאלה השנייה נטען מקור האמת ונבדק Freshness.

5. **Conversation cache**
   - Kernel/AGENT אינם נקראים מחדש בכל הודעה, אלא אם מצב/branch/version השתנו או קיים חשד לשינוי.

6. **Targeted reads**
   - בקשת נתון נקודתי מעדיפה range/rows ממוקדים על פני טעינת workbook מלאה.

7. **Runtime preservation**
   - תזרים נשען על מקור אמת ו־Freshness.
   - אשראי ממשיך לפתור ישויות ממקור אמת.
   - אירוע חדש ממשיך Anti-Double-Count ו־Readback.
   - אין דיווח הצלחה ללא אימות תוצאה.

8. **DEV aliases**
   - `היי dev` ו־`היי דב` → `DEV_ENVIRONMENT`.

9. **CORE isolation**
   - `היי core` → `CORE_RUNTIME`.
   - Fast Start של גבי אינו מפעיל CORE אוטומטית.

## Performance acceptance
Pure `היי גבי` צריך להסתיים ב־Startup Kernel מינימלי בלבד, עם:
- 0 Drive פיננסי.
- 0 Runtime detailed load.
- 0 Web.
- 0 Skill preload.

## FAIL
- `היי גבי` גורר קריאת Google Sheet.
- `היי גבי` טוען Dashboard/Sync log/Runtime/Skills.
- שאלה פיננסית מחזירה מספר בלי Source of Truth/Freshness.
- כל הודעה באותה שיחה קוראת מחדש Kernel/AGENT.
- Fast Start מבטל כללי אימות או Anti-Double-Count.

## Promotion gate
כל הבדיקות לעיל חייבות לעבור לפני מיזוג ל־`main`.