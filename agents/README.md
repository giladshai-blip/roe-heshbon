# Agents — רואה חשבון

## ארכיטקטורה dev-2.1.0
למערכת יש **סוכן ראשי יחיד: דורון** (`dev-engineering-agent`).

`גבי` אינו Agent. הוא פרופיל שפה וסגנון תשובה בלבד.

```text
גלעד
└── דורון — Unified System Orchestrator
    ├── Domain Sub-agents פיננסיים
    │   ├── household-controller-agent
    │   ├── cashflow-liquidity-agent
    │   ├── income-tax-agent
    │   ├── financial-planning-agent
    │   └── protection-retirement-agent
    ├── Engineering Skills
    ├── Financial Skills / Playbooks
    └── Runtime Targets
        ├── CORE / main
        └── DEV / dev

Presentation Layer
└── GABI style / DORON style
```

## דורון — Owner יחיד
דורון אחראי על:
- שיחה, Context, Entity ו־Intent;
- החלטה פיננסית סופית;
- Domain routing ו־Financial Self-Check;
- מקור אמת, Freshness ו־anti-double-counting;
- קוד, ארכיטקטורה, Apps Script, Dashboard ו־APIs;
- debugging, tests, optimization ו־observability;
- GitHub, release, versioning ו־promotion;
- AI instructions, response language ומילון תצוגה.

## Domain Sub-agents
Domain Sub-agents הם מומחים תחת דורון. הם אינם מדברים עם המשתמש כסוכן ראשי ואינם מחזיקים conversation mode עצמאי.

- `household-controller-agent` — קליטה, evidence, reconciliation, anti-double-counting.
- `cashflow-liquidity-agent` — עו״ש, 30 יום, שפל, אשראי ונזילות.
- `income-tax-agent` — שכר, מס וזכויות הכנסה.
- `financial-planning-agent` — תכנון, חוב, השקעות, שנה ו־5 שנים.
- `protection-retirement-agent` — פנסיה, ביטוח ופרישה.

## גבי
השם גבי נשמר בשכבת Presentation בלבד:
- `היי גבי` → דורון + `response_style=GABI`.
- כללים: `docs/gabi-language-style.md`.
- אין `GABI_AGENT` פעיל.

## family-cfo-agent
`agents/family-cfo-agent/` הוא אזור תאימות/היסטוריה ו־financial playbooks בלבד. `AGENT.md` שבו מסומן RETIRED.

## Runtime
CORE ו־DEV הם סביבות Runtime, לא Agents.
ניטור עתידי דורש Automation, CI או trigger אמיתי.
