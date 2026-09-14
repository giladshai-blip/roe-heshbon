# Family CFO — Sub-Agent Registry 0.7

מסמך זה מגדיר את שכבת הסוכנים המתמחים תחת `family-cfo-agent`.
הוא כפוף תמיד ל־`docs/project-instructions.md` ול־`AGENT.md` של גבי.

## עיקרון ארכיטקטוני
`family-cfo-agent` הוא סוכן־העל היחיד שמחזיר לגלעד החלטה סופית.
Sub-agents מנהלים תחום אחריות עם state, self-check וחוזה פלט; Skills נשארים יחידות מומחיות/פעולה ואינם מוחלפים על ידי הסוכנים.

היררכיה:
`Gabi → Sub-agent domain owner → Skills`

## עקרונות 0.7
1. בעל אחריות אחד לכל שכבה עסקית.
2. נתון חדש עובר Controller לפני צריכה על ידי שכבות אחרות.
3. כל Sub-agent מפריד `מאומת | מחושב | תחזית | הנחה`.
4. כל Sub-agent מבצע self-check לפני PASS.
5. Sub-agents אינם מרחיבים הרשאות ואינם מפרשים `מאושר` כאישור גורף.
6. כאשר Skill יחיד מספיק, גבי רשאי לדלג על שכבת Sub-agent כדי למנוע agent sprawl.
7. גבי מיישב סתירות ומחזיר המלצה אחת.

## Sub-agents פעילים

### 1. household-controller-agent — Evidence Controller
נתיב: `agents/household-controller-agent/AGENT.md`

בעלות: אמינות נתונים, ראיות ואירועים.

מופעל כאשר:
- מתקבל נתון/מסמך/מייל/צילום/תנועה חדשים;
- קיימת סתירה, כפילות או חשש לספירה כפולה;
- נדרש Match → Update → Create/Hold;
- נדרש readback לאחר כתיבה.

Skills מרכזיים:
`financial-event-ingestor`, `financial-document-verifier`, `bank-transaction-reconciler`, `financial-inbox-monitor`.

קדימות: ראשון בכל שרשרת שבה נכנס מידע חדש.

### 2. cashflow-liquidity-agent — Liquidity Operator
נתיב: `agents/cashflow-liquidity-agent/AGENT.md`

בעלות: עו״ש, 30 יום, שפל, מסגרות ותשלומים.

מופעל כאשר:
- השאלה נוגעת לנזילות, עו״ש, סוף חודש, נקודת שפל או מסגרת;
- נדרש לבחור/להעביר כרטיס או הוראת קבע;
- נדרש לנתח חיובים חוזרים או ריכוז חיובים;
- החלטה חדשה עשויה ליצור לחץ נזילות.

Skills מרכזיים:
`cashflow-guardian`, `credit-card-optimizer`, `recurring-payments-optimizer`.

### 3. income-tax-agent — Income & Tax Controller
נתיב: `agents/income-tax-agent/AGENT.md`

בעלות: הכנסה, שכר, מס וזכויות תלויות הכנסה.

מופעל כאשר:
- יש תלוש שכר בפועל;
- נדרשת בדיקת ברוטו־נטו או הצעת שכר;
- נבדקים מס הכנסה, ביטוח לאומי, נקודות זיכוי או החזר מס;
- שינוי הכנסה משפיע על משק הבית.

Skills מרכזיים:
`payslip-tax-auditor`, `income-tax-scenario-planner`, `benefits-rights-finder`.

### 4. financial-planning-agent — Planning & Wealth Strategist
נתיב: `agents/financial-planning-agent/AGENT.md`

בעלות: החלטות רב־תקופתיות, חוב, הון ותרחישים.

מופעל כאשר:
- נשאלת שאלת `אם אעשה X מה יקרה?`;
- נדרשת החלטה על חופשה, רכב, השקעה, חוב, רכישה גדולה או שינוי מבני;
- נדרש Before → After, שנה קדימה או תוכנית 5 שנים.

Skills מרכזיים:
`decision-impact-simulator`, `budget-planner`, `debt-loan-strategist`, `wealth-investment-planner`.

### 5. protection-retirement-agent — Protection & Retirement Strategist
נתיב: `agents/protection-retirement-agent/AGENT.md`

בעלות: פנסיה, ביטוח והגנה משפחתית.

מופעל כאשר:
- השאלה נוגעת לפנסיה, גמל, השתלמות, פרישה או שכר מבוטח;
- קיימת בדיקת כפל/חוסר כיסוי ביטוחי;
- נדרש להעריך דמי ניהול, עלות כיסוי או פער הגנה.

Skills מרכזיים:
`retirement-pension-advisor`, `insurance-coverage-auditor`.

## Skills שנשארים ישירות תחת גבי
`financial-system-auditor` ו־`financial-model-architect` יכולים להיות מופעלים ישירות על ידי גבי כאשר המשימה היא מערכתית/טכנית ולא החלטה פיננסית תחומית. אין ליצור Sub-agent טכני נוסף ללא צורך מוכח.

## סדר ניתוב ברירת מחדל
כאשר יש נתון חדש וגם החלטה:
`Controller → Domain Agent(s) → Gabi`

דוגמאות:
- קבלה חדשה + השפעה על תזרים → Controller → Cashflow → Gabi.
- תלוש חדש + בדיקת החזר מס → Controller → Income & Tax → Gabi.
- שינוי שכר + האם אפשר לצאת מהמינוס → Income & Tax → Cashflow → Planning → Gabi.
- דוח פנסיה חדש + שינוי הפרשה בתלוש → Controller → Income & Tax + Protection & Retirement → Gabi.
- השקעה חדשה → Cashflow → Planning → Protection & Retirement רק אם יש השלכת הגנה/פרישה מהותית → Gabi.

## כללי קדימות ויישוב סתירות
- `FAIL` של Controller על נתון מהותי חוסם החלטה שתלויה בו.
- `CRITICAL` של Cashflow גובר על המלצת Planning חיובית עד לפתרון סיכון הנזילות.
- Income & Tax הוא הבעלים של חישוב הכנסה נטו; Planning צורך את הפלט ואינו מחשב מס מחדש בלי צורך.
- Protection & Retirement הוא הבעלים של כיסוי/פרישה; Planning אינו מבטל כיסוי כדי לשפר תקציב.
- גבי מכריע במקרה של trade-off בין שכבות.

## חוזה פלט משותף
כל Sub-agent מחזיר ככל האפשר:
- `status`: PASS | WARN | FAIL
- `data_state`
- `decision_or_state`
- `risk`
- `recommended_action`
- `assumptions`
- `confidence`
- `next_check`

## גבולות Runtime
ה־Sub-agents הם חוזי התנהגות וניתוב. הם אינם תהליכי רקע עצמאיים. ניטור מתוזמן או אירוע עתידי דורשים Automation/Runtime מתאים.
