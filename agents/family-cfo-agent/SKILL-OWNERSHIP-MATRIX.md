# Gabi 0.7 — Skill Ownership Matrix

מסמך זה מגדיר בעלות תפעולית על כל Skill במערכת `רואה חשבון`.
הוא כפוף תמיד ל־`docs/project-instructions.md`, ל־`agents/family-cfo-agent/AGENT.md` ול־`SUBAGENTS.md`.

## עיקרון עליון
לכל Skill יש **Owner יחיד**. סוכנים אחרים יכולים להיות `Supporting` או `External Dependency`, אך אינם משכפלים את הלוגיקה או מקבלים בעלות מקבילה.

`Gabi → Domain Owner → Skill → Result → Gabi`

### סוגי קשר
- **Owned** — הסוכן הוא בעל האחריות ללוגיקה התחומית ולשימוש הראשי ב־Skill.
- **Supporting** — הסוכן רשאי להפעיל את ה־Skill כתומך בהחלטה שבבעלותו, בלי לשנות את משמעות הפלט.
- **External Dependency** — הסוכן צורך פלט מסוכן אחר ואינו מחשב מחדש את אותה שכבה.
- **Direct Gabi** — Skill מערכתי/אורקסטרטיבי שנשאר ישירות תחת גבי.

### רמות Write Permission
- `READ_ONLY` — ניתוח בלבד; אין כתיבה למקור האמת.
- `SCENARIO_ONLY` — סימולציה בלבד; אין כתיבת תרחיש כאירוע בפועל.
- `WRITE_IF_AUTHORIZED` — כתיבה רק אם ההנחיה/הבקשה וההרשאות מאפשרות, ולאחר readback.
- `SYSTEM_WRITE_IF_AUTHORIZED` — שינוי מערכת/מבנה רק לפי כללי dev → test → main.

## Ownership Matrix

| Skill | Owner | Supporting / Dependencies | Inputs עיקריים | Outputs עיקריים | Write Permission | Conflict Rule |
|---|---|---|---|---|---|---|
| `financial-skill-router` | **Gabi / Direct** | כל ה־Sub-agents | intent, active_goal, new_evidence, required_action | lead skill/agent, support chain | READ_ONLY | `active_goal` + evidence precedence גוברים על keyword routing |
| `financial-event-ingestor` | **Evidence Controller** | Cashflow, Planning | אירוע חדש, סכום, תאריך, אמצעי תשלום, source | match/update/create/hold, duplicate risk, impact | WRITE_IF_AUTHORIZED | אין Create אם Match מהימן; סתירת זהות/סכום → HOLD |
| `financial-document-verifier` | **Evidence Controller** | כל Domain Agent | מסמך/צילום/דוח/אישור | verified facts, contradictions, data_state | WRITE_IF_AUTHORIZED | מסמך חדש קודם להחלטה תלויה; סתירה מהותית חוסמת PASS |
| `bank-transaction-reconciler` | **Evidence Controller** | Cashflow | תנועות בנק/כרטיס, planned events | matches, recurring signals, unmatched items | WRITE_IF_AUTHORIZED | actual transaction replaces matched planned event; אין double counting |
| `financial-inbox-monitor` | **Evidence Controller** | Income & Tax, Protection | Gmail/Drive connected sources | new financial items, routing, duplicates skipped | READ_ONLY | scan אינו אישור למחיקה/ארכוב/כתיבה פיננסית |
| `cashflow-guardian` | **Liquidity Operator** | Planning | balance anchor, future events, limit | 30d low, month end, headroom, liquidity risk | READ_ONLY | `CRITICAL` liquidity גובר על Planning חיובי |
| `credit-card-optimizer` | **Liquidity Operator** | Planning | card mappings, limits, billing dates, charges | preferred card, utilization, timing impact | READ_ONLY | רק כרטיסים מאומתים; identity conflict → דורש אימות |
| `recurring-payments-optimizer` | **Liquidity Operator** | Planning, Protection | recurring charges, cards, dates, categories | annualized cost, move/cancel candidates | READ_ONLY | אין ביטול ביטוח/בריאות/פנסיה רק משיקול מחיר |
| `credit-profile-optimizer` | **Liquidity Operator** | Planning | utilization, overdraft, returned payments, limits | credit-risk actions, utilization plan | READ_ONLY | תזרים ויכולת החזר קודמים לשיפור ציון תיאורטי |
| `decision-impact-simulator` | **Planning & Wealth Strategist** | Cashflow, Income & Tax, Protection | baseline + scenario delta | Before→After, delta, GO/GO_IF/DEFER/NO_GO | SCENARIO_ONLY | תרחיש אינו נכתב למקור אמת ללא הוראה מפורשת |
| `budget-planner` | **Planning & Wealth Strategist** | Cashflow | income/expense baseline, categories, goals | budget targets, variances, corrective action | READ_ONLY | חריג חד־פעמי אינו הופך לבסיס חוזר בלי ראיה |
| `forecast-calibration-analyst` | **Planning & Wealth Strategist** | Evidence Controller, Cashflow | history, actual vs forecast, seasonality | calibrated baseline, confidence, drift signal | READ_ONLY | actual verified data גובר על baseline ישן |
| `debt-loan-strategist` | **Planning & Wealth Strategist** | Cashflow, Income & Tax | balances, rates, terms, cashflow | payoff/refinance priority, cost comparison | READ_ONLY | אין הלוואה חדשה רק כדי לדחות בעיית תזרים מבנית |
| `wealth-investment-planner` | **Planning & Wealth Strategist** | Cashflow, Protection | liquidity, debt, assets, horizon, risk | allocation/wealth plan, 5y impact | READ_ONLY | אין השקעה לפני בדיקת נזילות, חוב וכרית ביטחון |
| `income-tax-scenario-planner` | **Income & Tax Controller** | Planning | salary assumptions, credits, benefits | gross→net scenarios, household net impact | READ_ONLY | Planning צורך net output ואינו מחשב מס מחדש |
| `payslip-tax-auditor` | **Income & Tax Controller** | Evidence Controller, Protection | payslips, YTD, tax letters, credits | anomalies, tax check, refund signal | READ_ONLY | תלוש בודד אינו בסיס לקביעת החזר מס שנתי סופי |
| `benefits-rights-finder` | **Income & Tax Controller** | Planning | household status, income, official eligibility data | rights/benefits candidates, verified eligibility | READ_ONLY | הטבה לא מאומתת נשארת תרחיש ולא הכנסה קיימת |
| `retirement-pension-advisor` | **Protection & Retirement Strategist** | Income & Tax, Planning | pension statements, insured salary, fees | pension state, gaps, retirement projection | READ_ONLY | תחזית פרישה אינה ערך מובטח; שינוי מוצר דורש אישור מתאים |
| `insurance-coverage-auditor` | **Protection & Retirement Strategist** | Cashflow, Planning | policies, premiums, coverage, owners | duplication/gap/cost signals | READ_ONLY | אין ביטול כיסוי רק בגלל מחיר; coverage risk קודם לחיסכון |
| `financial-system-auditor` | **Gabi / Direct** | Evidence Controller | sync logs, formulas, validations, architecture | system health, defects, remediation | SYSTEM_WRITE_IF_AUTHORIZED | תקלה מערכתית אינה משנה נתון פיננסי בלי אימות מתאים |
| `financial-model-architect` | **Gabi / Direct** | System Auditor, Planning | formulas, KPI ownership, code/sheet model | Map→Owner→Shadow→Parity→Cutover plan | SYSTEM_WRITE_IF_AUTHORIZED | אין Big Bang; owner אחד לכל KPI/חישוב |

## כללי Cross-Agent
1. **Evidence Controller** קובע אמינות וזהות אירוע; הוא אינו קובע אסטרטגיה.
2. **Liquidity Operator** קובע השפעת נזילות; `CRITICAL` שלו חוסם החלטה חיובית עד פתרון הסיכון.
3. **Income & Tax Controller** הוא בעל חישוב הנטו, המס והחזרי המס; Planning צורך את הפלט.
4. **Planning & Wealth Strategist** הוא בעל התרחיש, החוב וההון; הוא אינו משנה נתוני מקור ולא מחשב מחדש מס/כיסוי בבעלות סוכן אחר.
5. **Protection & Retirement Strategist** הוא בעל כיסוי, פנסיה ופרישה; שום סוכן אחר אינו מבטל כיסוי כדי לשפר תקציב.
6. **Gabi** הוא היחיד שמיישב trade-off בין Domain Agents ומחזיר החלטה סופית לגלעד.

## Conflict Resolution Order
כאשר פלטים מתנגשים:
1. `docs/project-instructions.md`.
2. נתון מאומת ועדכני ממקור האמת / מקור רשמי.
3. `FAIL` של Evidence Controller על נתון מהותי.
4. `CRITICAL` של Liquidity Operator.
5. Domain Owner של השכבה המקצועית הרלוונטית.
6. גבי מכריע trade-off ומציג המלצה אחת.

## שינוי בעלות
שינוי Owner של Skill הוא שינוי ארכיטקטוני משמעותי ולכן דורש:
`dev → ownership regression → readback → PR → main`.

אין לשכפל Skill לתיקיית Sub-agent כדי ליצור “גרסה מקומית”. אם חסרה יכולת — משפרים את ה־Skill הקנוני או יוצרים Skill חדש עם Owner יחיד.