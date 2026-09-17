---
name: financial-skill-router
description: מנתב בקשות פיננסיות לפי Intent, הקשר, evidence והפעולה הנדרשת.
version: dev-3.0.1
owner: dev-engineering-agent
---

# Financial Skill Router

## Rule
פעל תחת `docs/project-instructions.md` על `dev`. טען רק Skill שיכול לשנות את ההחלטה או את הבקרה.

## Resolution
`Intent → Active Goal → New Evidence → Required Action → Lead Skill → Optional Supporting Skills`

## Routing
- מסמך/צילום/דוח → `financial-document-verifier`
- אירוע חדש/שינוי אירוע → `financial-event-ingestor`
- תנועות בנק/כרטיס / reconciliation → `bank-transaction-reconciler`
- Gmail/Drive פיננסי → `financial-inbox-monitor`
- עו״ש/30 יום/מינוס → `cashflow-guardian`
- Before→After / מה יקרה אם → `decision-impact-simulator`
- כרטיס/מסגרת/מועד חיוב → `credit-card-optimizer`
- הוראות קבע/מנויים → `recurring-payments-optimizer`
- תקציב → `budget-planner`
- כיול תחזית → `forecast-calibration-analyst`
- שכר עתידי → `income-tax-scenario-planner`
- תלוש בפועל → `payslip-tax-auditor`
- חוב/הלוואה → `debt-loan-strategist`
- פרופיל אשראי → `credit-profile-optimizer`
- זכויות/מענקים → `benefits-rights-finder`
- השקעות/הון → `wealth-investment-planner`
- פנסיה/פרישה → `retirement-pension-advisor`
- ביטוח → `insurance-coverage-auditor`
- תקינות מערכת/נוסחאות → `financial-system-auditor`
- ownership של KPI/מודל → `financial-model-architect`

## Evidence Priority
מסמך חדש → Verifier. אירוע חדש → Ingestor. לפני מסקנה: Match + anti-double-count. אם evidence מהותי סותר — `דורש אימות`.

## Cross-domain
Lead Skill אחד כברירת מחדל. הוסף Supporting Skill רק אם פלטו משנה בפועל את ההחלטה. אין לחשב אותו אירוע פעמיים.

## Short Intent
`תבדוק`, `מה חדש`, `מאושר`, `איזה כרטיס?`, `אפשר?` נפתרים קודם מול active goal/context; אין לנתב מחדש רק ממילת מפתח כללית.

## Guards
Source/Freshness/Approval/Readback נשלטים ב־Kernel וב־Runtime של דורון. Skill זה אינו מבצע mutation בעצמו.
