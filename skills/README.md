# Skill Pack — רואה חשבון

חבילת Skills יציבה למערכת הפיננסית. כל Skill חייב לפעול תחת ההנחיה המרכזית שב־`main/docs/project-instructions.md` ולהתייחס לקובץ `רואה חשבון - מערכת פיננסית` כמקור האמת המרכזי.

גרסה נוכחית: **V1.5 ב־main**. מועמדת ב־`dev`: **V1.6 — Context & Automation Layer**.

## Skills

- `financial-skill-router` — מנתב לפי intent + active goal + new evidence + required action ומאחד תשובות בבקשות משולבות.
- `financial-event-ingestor` — קולט אירוע פיננסי חדש, פותר הקשר וזהות, מבצע Match → Update → Create, anti-double-counting וחישוב מחדש.
- `financial-document-verifier` — אימות מסמכים, Match → Update → Create ומניעת ספירה כפולה.
- `bank-transaction-reconciler` — קליטת תנועות בנק/כרטיסים, נרמול, התאמה מול תזרים מתוכנן, חיובים חוזרים וחריגים.
- `financial-inbox-monitor` — סריקת Gmail/Drive מחוברים למסמכים ואירועים פיננסיים חדשים, סינון כפילויות וניתוב לאימות.
- `cashflow-guardian` — תזרים, יתרת עו״ש, חלון 30 יום ותרחישי יכולת כלכלית.
- `decision-impact-simulator` — סימולציית Before → After להחלטה פיננסית לפני ביצוע.
- `credit-card-optimizer` — חלוקת חיובים, מסגרות, מועדי חיוב ופיזור עומס בין כרטיסים.
- `recurring-payments-optimizer` — מיפוי וייעול הוראות קבע, מנויים וחיובים חוזרים לפי עלות, מועד, כרטיס ותזרים.
- `budget-planner` — תקציב, חריגות, תחזית סוף חודש והמלצות תיקון.
- `forecast-calibration-analyst` — כיול baseline, עונתיות, חגים, אירועים חריגים והשוואת תחזית מול ביצוע.
- `income-tax-scenario-planner` — תרחישי שכר ברוטו־נטו, הצעות עבודה, הטבות שכר והכנסה עתידית.
- `payslip-tax-auditor` — ביקורת תלושי שכר בפועל, מס, הפרשות, צבירה שנתית ואותות אפשריים להחזר מס.
- `debt-loan-strategist` — הלוואות, מינוס, חובות, מחזור, פירעון מוקדם וסדר עדיפות לסגירת חובות.
- `credit-profile-optimizer` — פרופיל אשראי, מינוס, ניצול מסגרות, החזרות, פיגורים ופתיחת אשראי חדש.
- `benefits-rights-finder` — זכויות, מענקים, הנחות, קצבאות, הטבות מס והטבות מוסדיות/ממשלתיות.
- `wealth-investment-planner` — חיסכון, השקעות, נדל״ן, נזילות, הון נטו ובניית הון ל־5 שנים.
- `retirement-pension-advisor` — פנסיה, כיסויים פנסיוניים, שכר מבוטח, דמי ניהול ותחזית פרישה.
- `insurance-coverage-auditor` — מיפוי ביטוחים משפחתיים, כפל/חוסר כיסוי ועלות ביטוח כוללת.
- `financial-system-auditor` — סנכרון, כפילויות, נוסחאות, תקינות נתונים ובקרת מערכת.
- `financial-model-architect` — מיפוי בעלות על חישובים ו־KPI, drift בין קוד לגיליון, Shadow/Parity/Cutover וריכוז המערכת למודל של "מוח אחד, הרבה תצוגות".

## עקרון מניעת Skill Sprawl
Skill חדש מוצדק רק כאשר יש לו אחריות ברורה שאינה מכוסה היטב כבר. V1.6 מוסיפה חמש שכבות חסרות: Event Ingestion, Recurring Payments Lifecycle, Payslip Audit, Connected Inbox Intake ו־Decision Impact Simulation. ה־Skills הקיימים נשארים הבעלים של התחומים הפיננסיים עצמם.

## מיפוי מול Skills‑IL ויכולות חיצוניות

הפרויקט אינו מעתיק Skill חיצוני כאשר היכולת כבר קיימת בצורה טובה יותר מקומית.

- Israeli Budget Planner → `budget-planner` + `cashflow-guardian`.
- Israeli Pension and Savings Navigator → `retirement-pension-advisor` + `wealth-investment-planner`.
- Israeli Payroll Calculator → `income-tax-scenario-planner`; ביקורת תלוש בפועל → `payslip-tax-auditor`.
- Israeli Consumer Fee Fighter → `credit-card-optimizer`, `recurring-payments-optimizer`, `credit-profile-optimizer`, `debt-loan-strategist` לפי הצורך.
- Israeli Employee Tax Refund / Bituach Leumi → `payslip-tax-auditor` + `benefits-rights-finder`; קביעה סופית נשענת על מקורות רשמיים מתאימים.
- Israeli Bank Connector → `bank-transaction-reconciler` הוא שכבת קליטה/התאמה בלבד; חיבור בנקאי חי דורש Connector/Runtime פעיל.
- Insurance Duplication Checker → `insurance-coverage-auditor`.

## כללי הפעלה משותפים

1. לקרוא תמיד את ההנחיה המרכזית מ־`main` לפני ניתוח משמעותי או שינוי.
2. אין להמציא נתונים; כל נתון יסווג לפי רמת הוודאות שלו.
3. אין לומר שהמידע עודכן/סונכרן/אומת ללא פעולה ובדיקה בפועל.
4. שינויי Skill מתחילים ב־`dev`, עוברים Regression וקריאה חוזרת, ורק אז מקודמים ל־`main`.
5. אין לשמור PAT, token, סיסמה, סוד או נתון פיננסי אישי רגיש ב־GitHub.
6. לאחר שינוי משמעותי יש לבדוק השפעה על תזרים, תקציב, אשראי, חוב, חיסכון, פנסיה, ביטוח, דשבורד ותוכנית 5 שנים לפי הרלוונטיות.
7. יש להימנע מ־Skill sprawl; צורך שכבר מכוסה היטב משפר Skill קיים במקום ליצור כפילות.
8. Skill לקליטת נתונים אינו Connector; אין לטעון לסנכרון חי ללא חיבור פעיל ומאומת.
9. שינוי ארכיטקטורת חישובים עובר Map → Owner → Shadow → Parity → Cutover → Deprecate.
10. תרחיש אינו אירוע בפועל; `decision-impact-simulator` אינו כותב תרחיש למקור האמת בלי הוראה מפורשת להפוך אותו לתכנון/התחייבות.

## Routing

ברירת המחדל היא `financial-skill-router`:

- מסמך/צילום/דוח חדש → `financial-document-verifier`
- אירוע חדש: "שילמתי/קיבלתי/העברתי/ביטלתי/שיניתי" → `financial-event-ingestor`
- תנועות בנק/כרטיס או התאמה מול תכנון → `bank-transaction-reconciler`
- סריקת Gmail/Drive למסמכים פיננסיים חדשים → `financial-inbox-monitor`
- מצב תזרים / יכולת כלכלית → `cashflow-guardian`
- "אם אעשה X מה יקרה?" → `decision-impact-simulator`
- בחירת כרטיס/מסגרת/מועד חיוב → `credit-card-optimizer`
- הוראות קבע/מנויים/חיובים חוזרים → `recurring-payments-optimizer`
- תקציב/חריגות → `budget-planner`
- כיול תחזית → `forecast-calibration-analyst`
- שכר עתידי/הצעת עבודה → `income-tax-scenario-planner`
- תלוש שכר בפועל/ניכויים/אות להחזר מס → `payslip-tax-auditor`
- חוב/הלוואה/מחזור → `debt-loan-strategist`
- פרופיל אשראי → `credit-profile-optimizer`
- זכויות/מענקים/הנחות → `benefits-rights-finder`
- השקעה/בניית הון → `wealth-investment-planner`
- פנסיה/גמל/פרישה → `retirement-pension-advisor`
- ביטוח/כפל כיסוי → `insurance-coverage-auditor`
- בריאות מערכת/סנכרון/נוסחאות → `financial-system-auditor`
- בעלות KPI/ריכוז לוגיקה → `financial-model-architect`

### קדימות אירוע חדש
מסמך חדש עובר Verifier ראשון. לאחר מכן Event Ingestor מבצע Match → Update → Create ו־anti-double-counting. רק אז הנתון עובר ל־Skill תחומי לקבלת החלטה.

### ניתוב לפי הקשר
ה־Router אינו מנתב לפי מילת מפתח בלבד. הוא פותר קודם `intent`, `active_goal`, `new_evidence` ו־`required_action`. פקודות קצרות כמו `תבדוק`, `תתקן`, `מאושר`, `מה חדש` ו־`אפשר?` נשענות על היעד הפעיל ולא מתחילות workflow חדש ללא צורך.

## חוזה תוצאה אחיד

כל Skill מחזיר:
- `status`: PASS / WARN / FAIL
- `data_state`
- `source`
- `impact`
- `decision`
- `next_check`

`PASS` = בסיס מספיק; `WARN` = תשובה חלקית/מותנית; `FAIL` = אין בסיס בטוח.

## סטטוס בדיקות

- V1: 10/10.
- V1.1: 13/13.
- V1.2: 19/19 וקודמה ל־`main`.
- V1.3: 31/31 PASS.
- V1.4: 49/49 PASS.
- V1.5: `financial-model-architect` כבר קיים ב־`main`; Registry יושר ב־V1.6 כדי לשקף זאת.
- V1.6: מועמדת ב־`dev`; בדיקות רגרסיה ייעודיות נדרשות לפני קידום.

דוחות הבדיקה נמצאים תחת `tests/`.