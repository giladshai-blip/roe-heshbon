# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסה פעילה
**`dev-3.0.0`** היא גרסת המערכת הפעילה.
`release.json` הוא מקור האמת המכני לגרסה ולמבנה.

## מבנה
- סוכן ראשי יחיד: **דורון** (`dev-engineering-agent`).
- ענף פעיל יחיד ו־Default Branch: **`dev`**.
- אין `main`, אין Production branch נפרד ואין CORE Runtime נפרד.
- אין Promotion workflow.
- `גבי` אינו Agent; הוא פרופיל שפה בלבד.

```text
גלעד
└── דורון — Unified System Orchestrator
    ├── Domain Sub-agents פיננסיים
    ├── Engineering Skills
    ├── Financial Playbooks
    └── dev — סביבת העבודה היחידה

Presentation
├── DORON style
└── GABI style
```

## שיחה
- `היי דורון` / `היי dev` → דורון בסגנון DORON.
- `היי גבי` → אותו דורון בסגנון GABI.
- `היי core` הוא alias היסטורי בלבד ואינו מחליף Runtime או branch.

## Approval Gate
כל פעולה שמשנה מצב דורשת אישור מפורש של גלעד מראש.
קריאה, ניתוח, אבחון, בדיקה סטטית ו־readback אינם דורשים אישור.
האישור מוגבל ל־scope שהוגדר.

## מקור אמת פיננסי
**"רואה חשבון - מערכת פיננסית"**.
לפני מספר, תחזית, המלצה או שינוי פיננסי מהותי נדרשים Freshness, בדיקת סתירות/כפילויות ו־Financial Self-Check.

## גרסאות
גרסה פעילה אחת לכל המערכת בפורמט `dev-MAJOR.MINOR.PATCH`.

Legacy Build IDs כמו `V5.10.1`, `V5.10.0` ו־`0.7.x` נשמרים לצורכי תאימות והיסטוריה בלבד ואינם Release Version.

## מקורות קנוניים
- `docs/project-instructions.md` — Startup Kernel.
- `release.json` — גרסה ומבנה.
- `agents/dev-engineering-agent/AGENT.md` — דורון.
- `agents/dev-engineering-agent/RUNTIME.md` — Runtime מאוחד.
- `docs/project-runtime-rules.md` — כללים פיננסיים/מערכתיים.
- `docs/gabi-language-style.md` — שפת גבי בלבד.
- `docs/versioning-policy.md` — מדיניות גרסאות.

`agents/family-cfo-agent/` נשמר כהיסטוריה ו־financial playbooks בלבד; הוא אינו Agent פעיל.

## שחזור
שחזור מתבצע מ־Git history או מ־backup ref מפורש. אין restore base נפרד מענף `main`.

## אבטחה
אין לשמור secrets, tokens, passwords או API keys בקוד או ב־GitHub.
