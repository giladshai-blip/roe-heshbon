# Financial Skills — רואה חשבון | dev-3.0.1

חבילת Skills פיננסיים בטעינה עצלה תחת דורון. ההנחיה הקנונית היא `docs/project-instructions.md` על `dev`; מקור האמת הפיננסי הוא **"רואה חשבון - מערכת פיננסית"**.

## עקרונות
- אין Skill שטוען את עצמו כברירת מחדל; דורון מנתב לפי Intent והקשר.
- Skill אינו Agent ואינו מקור אמת.
- אין להמציא נתונים או לדווח `עודכן/סונכרן/אומת` ללא פעולה ו־readback.
- כל mutation כפוף ל־Approval Gate.
- אין Skill sprawl: צורך שכבר מכוסה משפר Skill קיים.
- Historical tests/package labels כגון `V1.6` נשארים audit history בלבד ואינם Release Version.

## Routing
- מסמך/צילום/דוח חדש → `financial-document-verifier`
- אירוע חדש → `financial-event-ingestor`
- תנועות בנק/כרטיס / reconciliation → `bank-transaction-reconciler`
- Gmail/Drive פיננסי → `financial-inbox-monitor`
- עו״ש / תזרים / 30 יום → `cashflow-guardian`
- Before → After / החלטה → `decision-impact-simulator`
- כרטיסים / מסגרות / מועד חיוב → `credit-card-optimizer`
- הוראות קבע / מנויים → `recurring-payments-optimizer`
- תקציב → `budget-planner`
- כיול תחזית → `forecast-calibration-analyst`
- שכר עתידי / ברוטו־נטו → `income-tax-scenario-planner`
- תלוש בפועל / ניכויים → `payslip-tax-auditor`
- חוב / הלוואה / מחזור → `debt-loan-strategist`
- פרופיל אשראי → `credit-profile-optimizer`
- זכויות / מענקים / הנחות → `benefits-rights-finder`
- השקעות / הון → `wealth-investment-planner`
- פנסיה / גמל / פרישה → `retirement-pension-advisor`
- ביטוחים → `insurance-coverage-auditor`
- בריאות מערכת / נוסחאות / sync integrity → `financial-system-auditor`
- בעלות KPI / מודל חישוב → `financial-model-architect`
- בקשה משולבת → `financial-skill-router`

## אירוע חדש
`Verify Evidence → Match → Update/Create Plan → Approval → Execute → Anti-Double-Count → Recalculate → Readback → Domain Analysis`

## Cross-domain
טען יותר מ־Skill אחד רק כאשר הפלט של תחום אחד משנה מהותית תחום אחר. לדוגמה: רכישה גדולה → תזרים + החלטת Before/After; שינוי עבודה → שכר/מס + תכנון + פנסיה לפי הצורך.

## אבטחה
אין לשמור PAT, token, password, API secret או נתון פיננסי אישי רגיש ב־GitHub.
