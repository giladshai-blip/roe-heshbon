# Skill Pack — רואה חשבון

חבילת Skills יציבה למערכת הפיננסית. כל Skill חייב לפעול תחת ההנחיה המרכזית שב־`main/docs/project-instructions.md` ולהתייחס לקובץ `רואה חשבון - מערכת פיננסית` כמקור האמת המרכזי.

גרסה נוכחית: **V1.4 ב־main**.

## Skills

- `financial-skill-router` — מנתב אוטומטית את הבקשה ל־Skill המתאים ומאחד תשובות בבקשות משולבות.
- `financial-document-verifier` — אימות מסמכים, Match → Update → Create ומניעת ספירה כפולה.
- `bank-transaction-reconciler` — קליטת תנועות בנק/כרטיסים, נרמול, התאמה מול תזרים מתוכנן, חיובים חוזרים וחריגים.
- `cashflow-guardian` — תזרים, יתרת עו״ש, חלון 30 יום ותרחישי יכולת כלכלית.
- `credit-card-optimizer` — חלוקת חיובים, מסגרות, מועדי חיוב ופיזור עומס בין כרטיסים.
- `budget-planner` — תקציב, חריגות, תחזית סוף חודש והמלצות תיקון.
- `forecast-calibration-analyst` — כיול baseline, עונתיות, חגים, אירועים חריגים והשוואת תחזית מול ביצוע.
- `income-tax-scenario-planner` — תרחישי שכר ברוטו־נטו, הצעות עבודה, הטבות שכר והכנסה עתידית.
- `debt-loan-strategist` — הלוואות, מינוס, חובות, מחזור, פירעון מוקדם וסדר עדיפות לסגירת חובות.
- `credit-profile-optimizer` — פרופיל אשראי, מינוס, ניצול מסגרות, החזרות, פיגורים ופתיחת אשראי חדש.
- `benefits-rights-finder` — זכויות, מענקים, הנחות, קצבאות, הטבות מס והטבות מוסדיות/ממשלתיות.
- `wealth-investment-planner` — חיסכון, השקעות, נדל״ן, נזילות, הון נטו ובניית הון ל־5 שנים.
- `retirement-pension-advisor` — פנסיה, כיסויים פנסיוניים, שכר מבוטח, דמי ניהול ותחזית פרישה.
- `insurance-coverage-auditor` — מיפוי ביטוחים משפחתיים, כפל/חוסר כיסוי ועלות ביטוח כוללת.
- `financial-system-auditor` — סנכרון, כפילויות, נוסחאות, תקינות נתונים ובקרת מערכת.

## מיפוי מול Skills‑IL

הפרויקט אינו מעתיק Skill חיצוני כאשר היכולת כבר קיימת בצורה טובה יותר מקומית. המיפוי הנוכחי:

- Israeli Budget Planner → מכוסה על ידי `budget-planner` + `cashflow-guardian`.
- Israeli Pension and Savings Navigator → מכוסה על ידי `retirement-pension-advisor` + `wealth-investment-planner`.
- Israeli Payroll Calculator → מכוסה על ידי `income-tax-scenario-planner`.
- Israeli Consumer Fee Fighter → היכולות הרלוונטיות מכוסות על ידי `credit-card-optimizer`, `credit-profile-optimizer` ו־`debt-loan-strategist`; אין צורך ב־Skill נוסף רק לעמלות בשלב זה.
- Israeli Employee Tax Refund / Bituach Leumi → מכוסים ברמת ניתוב על ידי `benefits-rights-finder`; אם יתברר בהמשך שחסר עומק ייעודי, יש להרחיב אותו במקום ליצור כפילות אוטומטית.
- Israeli Bank Connector → נמצא פער אמיתי: נוסף `bank-transaction-reconciler`, אך הוא אינו טוען לחיבור בנקאי חי ללא Connector/Runtime פעיל.
- Insurance Duplication Checker → נמצא פער אמיתי: נוסף `insurance-coverage-auditor`.

## כללי הפעלה משותפים

1. לקרוא תמיד את ההנחיה המרכזית מ־`main` לפני ניתוח משמעותי או שינוי.
2. אין להמציא נתונים; כל נתון יסווג לפי רמת הוודאות שלו.
3. אין לומר שהמידע עודכן/סונכרן/אומת ללא פעולה ובדיקה בפועל.
4. שינויי Skill מתחילים ב־`dev`, עוברים Regression וקריאה חוזרת, ורק אז מקודמים ל־`main` לפי סמכות הסוכן.
5. אין לשמור PAT, token, סיסמה, סוד או נתון פיננסי אישי רגיש ב־GitHub.
6. לאחר שינוי משמעותי יש לבדוק השפעה על תזרים, תקציב, אשראי, חוב, חיסכון, פנסיה, ביטוח, דשבורד ותוכנית 5 שנים לפי הרלוונטיות.
7. יש להימנע מ־Skill sprawl: אם צורך מכוסה היטב ב־Skill קיים, מעדכנים אותו במקום ליצור כפילות.
8. Skill לקליטת נתונים אינו שווה ל־Connector: אין לטעון לסנכרון חי אלא אם קיים חיבור פעיל ומאומת בפועל.

## Routing

ברירת המחדל היא `financial-skill-router`, שמנתב כך:

- מסמך/צילום/דוח חדש → `financial-document-verifier`
- תנועות בנק/כרטיס או התאמה מול תכנון → `bank-transaction-reconciler`
- "מה מצב התזרים?", "האם אני יכול להרשות לעצמי?" → `cashflow-guardian`
- "לאיזה כרטיס להעביר?" → `credit-card-optimizer`
- "תציע תקציב", "איפה אנחנו חורגים?" → `budget-planner`
- "איך לכייל את התחזית אחרי תקופה חריגה/חגים?" → `forecast-calibration-analyst`
- "כמה נטו יישאר משכר חדש?", "איך הצעת עבודה תשפיע על הבית?" → `income-tax-scenario-planner`
- "איזה חוב לסגור קודם?", "כדאי למחזר הלוואה?" → `debt-loan-strategist`
- "איך לשפר את דירוג/פרופיל האשראי?" → `credit-profile-optimizer`
- "איזה זכויות/מענקים/הנחות מגיעים לנו?" → `benefits-rights-finder`
- "האם נכון להשקיע?", "איך לבנות הון ל־5 שנים?" → `wealth-investment-planner`
- שאלה על פנסיה/גמל/פרישה → `retirement-pension-advisor`
- כפל ביטוחי/חוסר כיסוי/עלות ביטוח → `insurance-coverage-auditor`
- "בדוק את המערכת", "למה הנתון לא מסתנכרן?" → `financial-system-auditor`

### קדימות מסמך חדש
כאשר אותה בקשה כוללת גם מסמך/צילום/אישור חדש וגם שאלה פיננסית — `financial-document-verifier` פועל ראשון. רק לאחר סיווג ואימות הנתון ניתן להעבירו ל־Skills תומכים. נתון שנשאר `דורש אימות` לא ישמש בסיס להחלטה סופית.

בבקשה משולבת ללא מסמך חדש, ה־Router בוחר Skill מוביל ומפעיל Skills תומכים רק לפי הצורך, עם בדיקת anti-double-counting לפני מסקנה סופית.

## חוזה תוצאה אחיד

כל Skill מחזיר ל־Router תוצאה לוגית עם:

- `status`: `PASS` / `WARN` / `FAIL`
- `data_state`: רמת הוודאות של הנתונים
- `source`: המקור המרכזי שעליו נשענה ההחלטה
- `impact`: התחומים שנבדקו או הושפעו
- `decision`: מסקנה או פעולה מומלצת
- `next_check`: בדיקה או אימות שנדרשים בהמשך

`PASS` פירושו שיש בסיס מספיק להחלטה; `WARN` פירושו תשובה חלקית או מותנית; `FAIL` פירושו שאין בסיס בטוח להחלטה.

## סטטוס בדיקות

- V1: 10/10 תרחישים עברו ברמת לוגיקה.
- V1.1: 13/13 תרחישי רגרסיה וקצה עברו ברמת לוגיקה.
- V1.2: 19/19 תרחישים עברו ברמת לוגיקה וקודמו ל־`main`.
- V1.3: 31/31 PASS ברמת לוגיקה.
- V1.4: **49/49 PASS ברמת לוגיקה** — בסיס V1.3 + 11 תרחישים חדשים + 7 בדיקות Router ורוחב.
- דוחות הבדיקה נמצאים תחת `tests/`.

V1.4 קודמה סלקטיבית ל־`main` לאחר Regression וקריאה חוזרת של קובצי ה־Skill, ה־Router והתיעוד.