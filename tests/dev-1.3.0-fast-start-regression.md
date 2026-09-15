# Regression — dev-1.3.0 Gabi Fast Start

מטרה: לקצר משמעותית את זמן הפעלת גבי בלי לפגוע באמינות כאשר מתחילה עבודה פיננסית.

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
   - קלט ראשון: `היי` → תפריט.
   - קלט שני: `1`.
   - גבי פעיל מיד.
   - אין Activation Gate נוסף.
   - אין Drive פיננסי עד שתישאל שאלה פיננסית.

3. **Greeting + financial task**
   - קלט: `היי גבי תזרים`
   - אין תשובת ברכה נפרדת.
   - נטענים Runtime rules רלוונטיים.
   - מקור האמת נקרא.
   - Freshness נבדק.
   - מתבצע Financial Self-Check.

4. **Financial task after greeting**
   - קלט 1: `היי גבי`.
   - קלט 2: `מה היתרה שלי?`.
   - רק בקלט 2 נטען מקור האמת ונבדק Freshness.

5. **No repeated kernel load**
   - לאחר Startup, הודעה נוספת באותה שיחה אינה גוררת קריאה מחדש של project-instructions/AGENT אלא אם מצב/branch/version השתנו.

6. **Targeted reads**
   - בקשת נתון נקודתי מעדיפה range/rows ממוקדים על פני טעינת workbook מלאה.

7. **Runtime preservation**
   - תזרים ממשיך להשתמש ביתרת עו״ש מאומתת/מחושבת וב־Freshness.
   - אשראי ממשיך לפתור בעלים/מסגרת/מועד חיוב ממקור אמת.
   - אירוע חדש ממשיך Match → Update → Create/Hold → Anti-Double-Count → Recalculate → Readback.
   - אין לומר עודכן/בוצע ללא readback.

8. **DEV aliases**
   - `היי dev` → DEV_ENVIRONMENT.
   - `היי דב` → DEV_ENVIRONMENT.

9. **CORE isolation**
   - `היי core` → CORE_RUNTIME.
   - Fast Start של גבי אינו מפעיל CORE או משנה main.

## Performance acceptance

### Before
Pure `היי גבי` היה עלול להפעיל Startup מלא: GitHub + Agent + Source of Truth + Sheet metadata/ranges + Skills/Patterns.

### After
Pure `היי גבי`:
- Kernel מינימלי בלבד.
- Agent kernel מינימלי בלבד אם ה־host מחייב.
- 0 Drive פיננסי.
- 0 Runtime detailed load.
- 0 Web.
- 0 Skill preload.

היעד הוא לצמצם את מסלול הברכה לכ־1–2 קריאות repository בלבד במקום שרשרת טעינות פיננסית מלאה.

## FAIL
- `היי גבי` גורר קריאת Google Sheet.
- `היי גבי` טוען Dashboard/Sync log/Runtime/Skills.
- שאלה פיננסית מחזירה מספר בלי Source of Truth/Freshness.
- כל הודעה באותה שיחה קוראת מחדש Kernel/AGENT.
- Fast Start משנה התנהגות פיננסית מהותית או מבטל Anti-Double-Count.

## Promotion gate
כל הבדיקות לעיל חייבות לעבור לפני קידום השינוי ל־dev ולאחר מכן ל־main.
