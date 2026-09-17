# Agents — רואה חשבון | dev-3.0.1

## מבנה
למערכת יש סוכן ראשי יחיד: **דורון** (`dev-engineering-agent`).
`גבי` אינו Agent; הוא Presentation Style בלבד.

```text
גלעד
└── דורון
    ├── household-controller-agent
    ├── cashflow-liquidity-agent
    ├── income-tax-agent
    ├── financial-planning-agent
    ├── protection-retirement-agent
    ├── Engineering Skills
    ├── Financial Skills
    └── dev
```

## דורון
Owner של שיחה, החלטה פיננסית, Domain routing, Source of Truth/Freshness, קוד, Apps Script, Dashboard, GitHub, release/versioning, tests ו־optimization.

## Domain Agents
מומחי תחום תחת דורון; אינם conversation mode עצמאי ונטענים רק כשיכולים לשנות החלטה או בדיקה.

## Branch / Approval
- `dev` הוא branch פעיל יחיד.
- אין `main`, CORE או Promotion workflow.
- כל mutation דורש אישור מפורש; Read Only ו־readback לא.
- `מאושר לקידום` = אישור לסגירת Release ה־DEV הנוכחי בתוך `dev`.

## GABI
`היי גבי` → דורון עם `response_style=GABI`. כללי ניסוח: `docs/gabi-language-style.md`.

## Historical
`agents/family-cfo-agent/` נשמר ל־playbooks, Intent learning ו־audit בלבד; `AGENT.md` בו RETIRED.
