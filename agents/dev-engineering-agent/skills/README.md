# DEV Skills — דורון

שכבת Skills טעינה לפי צורך עבור `dev-engineering-agent`.

## כלל טעינה
דורון אינו טוען את כל ה-Skills בכל משימה. לאחר זיהוי ה-surface, נטענים רק ה-Skills שעשויים לשנות את דרך הביצוע או למנוע תקלה.

## Skill Router
| Skill | טען כאשר |
|---|---|
| `system-architecture` | תכנון מערכת, boundaries, source of truth, API/contracts, refactor רחב |
| `root-cause-debugging` | bug, התנהגות לא צפויה, drift, failure, race/double-count |
| `google-apps-script` | Apps Script, Sheets, triggers, PropertiesService, LockService, quotas |
| `financial-data-integrity` | כסף, יתרות, תזרים, אשראי, reconciliation, idempotency, double-count |
| `github-release-engineering` | branch, PR, release, version, promotion, restore, GitHub handoff |
| `regression-testing` | שינוי קוד, bugfix, promotion gate, boundary/date/idempotency tests |
| `observability-health-checks` | logs, sync status, health, runtime diagnostics, alerts, freshness |
| `context-instruction-audit` | מהירות תגובת צ׳אט, context/instruction bloat, startup path, lazy loading, duplicate rules, archival |

## שילובים שכיחים
- bug פיננסי ב-Apps Script: `root-cause-debugging` + `google-apps-script` + `financial-data-integrity` + `regression-testing`.
- release: `github-release-engineering` + `regression-testing`.
- ארכיטקטורה חדשה: `system-architecture` + skill טכנולוגי מתאים + `regression-testing`.
- תקלה בסנכרון: `root-cause-debugging` + `google-apps-script` + `observability-health-checks` + `financial-data-integrity` אם יש השפעה כספית.
- אופטימיזציית מהירות צ׳אט: `context-instruction-audit` + `system-architecture` + `regression-testing` כאשר משתנה חוזה טעינה.

## Boundary
Skills הם ידע/פרוצדורה טכניים בלבד. הם אינם מחליפים את גבי בהחלטות פיננסיות או עסקיות, ואינם מאפשרים promotion ל-CORE ללא אישור מפורש של גלעד.
