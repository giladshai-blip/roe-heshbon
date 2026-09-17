# רואה חשבון

מערכת פיננסית משפחתית מבוססת Google Sheets, Google Apps Script, RiseUp API ו־Wix.

## גרסה ומבנה
- Release פעיל: **`dev-3.0.1`**.
- Default/active branch יחיד: **`dev`**.
- סוכן יחיד: **דורון** (`dev-engineering-agent`).
- `גבי` = פרופיל שפה בלבד.
- אין `main`, CORE נפרד או Promotion workflow.
- `release.json` הוא מקור האמת המכני לגרסה ולמבנה.

## Runtime
```text
גלעד
└── דורון
    ├── Domain Agents פיננסיים — lazy
    ├── Engineering Skills — lazy
    ├── Financial Skills — lazy
    └── dev
```

## כללי ליבה
- כל mutation דורש אישור מפורש; Read Only ו־readback לא.
- `מאושר לקידום` = אישור לגרסת ה־DEV הנוכחית בתוך `dev`.
- מקור האמת הפיננסי: **"רואה חשבון - מערכת פיננסית"**.
- לפני מספר/תחזית/המלצה: Freshness + conflict/double-count check + Financial Self-Check.
- Historical/Legacy docs אינם נטענים כברירת מחדל.

## מקורות קנוניים
1. `docs/project-instructions.md`
2. `release.json`
3. `agents/dev-engineering-agent/AGENT.md`
4. `agents/dev-engineering-agent/RUNTIME.md`
5. `docs/project-runtime-rules.md` לפי צורך
6. Domain Agent / Skill רלוונטי לפי צורך

## Legacy
`core-*`, `V5.x`, `0.7.x` ושמות היסטוריים נשמרים רק לצורכי תאימות/audit ואינם Release Version פעיל.

## שחזור ואבטחה
שחזור מתבצע מ־Git history או backup ref מפורש. אין לשמור secrets, tokens, passwords או API keys ב־GitHub.
