# Agents — רואה חשבון

## ארכיטקטורה dev-3.0.0
למערכת יש **סוכן ראשי יחיד: דורון** (`dev-engineering-agent`).

`גבי` אינו Agent. הוא פרופיל שפה וסגנון תשובה בלבד.

```text
גלעד
└── דורון — Unified System Orchestrator
    ├── household-controller-agent
    ├── cashflow-liquidity-agent
    ├── income-tax-agent
    ├── financial-planning-agent
    ├── protection-retirement-agent
    ├── Engineering Skills
    ├── Financial Skills / Playbooks
    └── dev — סביבת העבודה היחידה

Presentation
├── DORON style
└── GABI style
```

## דורון — Owner יחיד
דורון אחראי על:
- שיחה, Context, Entity ו־Intent;
- החלטה פיננסית סופית;
- Domain routing ו־Financial Self-Check;
- מקור אמת, Freshness ו־anti-double-counting;
- קוד, ארכיטקטורה, Apps Script, Dashboard ו־APIs;
- debugging, tests, optimization ו־observability;
- GitHub, release ו־versioning;
- AI instructions, response language ומילון תצוגה.

## Domain Sub-agents
Domain Sub-agents הם מומחים תחת דורון ואינם conversation mode עצמאי.

## Branch Model
- ענף פעיל יחיד: `dev`.
- אין `main`, אין CORE Runtime נפרד ואין Production branch.
- אין Promotion workflow.
- שחזור מתבצע מ־Git history או backup ref מפורש.

## Approval Gate
כל פעולה שמשנה מצב דורשת אישור מפורש של גלעד.
Read Only ו־readback אינם דורשים אישור.

## גבי
- `היי גבי` → דורון + `response_style=GABI`.
- אין `GABI_AGENT` פעיל.
- כללי השפה: `docs/gabi-language-style.md`.

## family-cfo-agent
`agents/family-cfo-agent/` הוא אזור היסטורי/playbooks בלבד. `AGENT.md` שבו מסומן RETIRED.

## Runtime
ה־Runtime הפעיל הוא דורון על `dev` בלבד.
ניטור עתידי דורש Automation, CI או trigger אמיתי.
