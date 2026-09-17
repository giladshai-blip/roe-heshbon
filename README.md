# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסאות
- Production מאושר ב־`main`: **`core-1.10.0`**.
- DEV ארכיטקטוני חדש: **`dev-2.1.0`**.
- `release.json` הוא מקור האמת המכני לגרסה הפעילה בכל branch.

## סוכן ראשי יחיד
החל מ־`dev-2.1.0` הסוכן הראשי היחיד הוא **דורון** (`dev-engineering-agent`).

דורון אחראי גם על פיננסים וגם על הנדסה: שיחה, החלטה פיננסית, Domain routing, מקור אמת, Freshness, קוד, Apps Script, Dashboard, GitHub, release ו־versioning.

## גבי
**גבי אינו Agent.**
השם גבי נשמר כפרופיל שפה וסגנון תשובה:
- `היי גבי` → דורון עם `response_style=GABI`.
- `היי דורון` / `היי dev` → דורון עם `response_style=DORON`.
- `היי core` → דורון מול Runtime ה־CORE המאושר.

פרופיל השפה: `docs/gabi-language-style.md`.

## היררכיה

```text
גלעד
└── דורון — Unified System Orchestrator
    ├── Domain Sub-agents פיננסיים
    ├── Engineering Skills
    ├── Financial Playbooks
    └── Runtime
        ├── CORE / main
        └── DEV / dev
```

CORE ו־DEV הם סביבות Runtime ולא Agents.

## מקור אמת פיננסי
**"רואה חשבון - מערכת פיננסית"**.
לפני מספר, תחזית, המלצה או פעולה פיננסית מהותית נדרשים Freshness, בדיקת סתירות/כפילויות ו־Financial Self-Check.

## מדיניות גרסאות
- `main` → `core-*`.
- `dev` → `dev-*`.
- Legacy Build IDs כמו `V5.10.1` / `V5.10.0` נשמרים לצורכי תאימות בלבד ואינם Release Version.

Legacy Builds הנוכחיים:
- Apps Script Core: `V5.10.1`
- Dashboard: `V5.10.0`
- Domain sub-agents legacy: `0.7.x`

## מקורות קנוניים
- `docs/project-instructions.md` — Startup Kernel וניתוב.
- `release.json` — גרסה ובעלות.
- `agents/dev-engineering-agent/AGENT.md` — דורון.
- `agents/dev-engineering-agent/RUNTIME.md` — Runtime מאוחד.
- `docs/project-runtime-rules.md` — כללים פיננסיים/מערכתיים.
- `docs/gabi-language-style.md` — שפת גבי בלבד.
- `docs/versioning-policy.md` — מדיניות גרסאות.

`agents/family-cfo-agent/` נשמר זמנית כתאימות/היסטוריה ו־financial playbooks; הוא אינו Agent פעיל.

## פיתוח וקידום
פיתוח חדש נעשה ב־DEV. קידום ל־main/CORE דורש tests, readback, metadata עקבי ואישור מפורש של גלעד.

## אבטחה
אין לשמור סודות או מפתחות גישה בקוד או ב־GitHub.
