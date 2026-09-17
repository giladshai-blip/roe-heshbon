# Engineering Skills — דורון | dev-3.0.1

שכבת Skills טכנית בטעינה עצלה. **אין Skill שנטען כברירת מחדל.**

## Router
| Skill | טען כאשר |
|---|---|
| `system-architecture` | architecture, boundaries, contracts, source of truth, refactor רחב |
| `root-cause-debugging` | bug, wrong output, drift, race, duplicate/double-count |
| `google-apps-script` | Apps Script, Sheets, triggers, PropertiesService, LockService |
| `financial-data-integrity` | יתרות, תזרים, reconciliation, idempotency, double-count |
| `github-release-engineering` | GitHub, branch, release, version, restore/rollback |
| `regression-testing` | שינוי קוד, bugfix, refactor, release gate |
| `observability-health-checks` | logs, sync, health, freshness, alerts |
| `context-instruction-audit` | latency, context bloat, startup, lazy loading, duplicate rules |

## כללי טעינה
1. טען רק Skill שיכול לשנות את דרך הביצוע או למנוע תקלה.
2. אל תטען Skill אם ה־Kernel וה־source הפעיל מספיקים.
3. Historical tests/specs אינם dependency של Skill פעיל.
4. שילוב Skills מותר רק כשיש cross-domain אמיתי.

## שילובים שכיחים
- bug פיננסי ב־Apps Script → debugging + Apps Script + data integrity + regression.
- release/version → GitHub release + regression.
- תקלה בסנכרון → debugging + Apps Script + observability; data integrity רק אם יש השפעה כספית.
- אופטימיזציית context → context audit + architecture; regression אם משתנה חוזה טעינה.

## Boundary
Skills הם ידע/פרוצדורה תחת דורון. הם אינם Agent, אינם עוקפים Approval Gate ואינם מקור אמת פיננסי.
