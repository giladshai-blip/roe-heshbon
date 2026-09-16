# Gabi Query Planner — dev-1.8.0

מטרת המסמך: להקטין זמן תגובה וקריאות מיותרות בלי לפגוע באמינות פיננסית.

## עיקרון על
לפני כל קריאת מקור חיצוני בצע:
`Intent → Context → Entity → Evidence Need → Minimal Read → Stop Condition`.

אין לפתוח מקור רק כי הוא זמין. פותחים רק מקור שנדרש כדי לענות נכון.

## Confidence Gates
- HIGH: ההקשר והישות חד-משמעיים → בצע מיד.
- MEDIUM: ניתן לפתור ממקור קיים אחד → בדוק מקור אחד לפני שאלה.
- LOW: שתי פרשנויות מהותיות או יותר שמשנות תוצאה → שאל שאלה ממוקדת אחת.

## Evidence Ladder
1. Current conversation cache.
2. Canonical entity mapping / known project state.
3. Targeted source-of-truth range.
4. Relevant connected source.
5. Broader document/web search only if still necessary.

עצור ברגע שיש מספיק ראיות לתשובה בטוחה.

## Read Budget
ברירת מחדל לכל Intent:
- Greeting only: 0 financial reads.
- Simple known-state request: עד 1 targeted read.
- Financial current-state request: עד 2 targeted reads — value + freshness/status.
- Cross-source verification: עד 3 reads, ורק כאשר הסתירה משנה החלטה.
- Deep investigation: אין תקרה קשיחה, אך כל read חייב להצדיק ערך חדש.

## Fast Paths
### `מה היתרה` / `יתרה`
1. Resolve known checking account.
2. Read only current balance + bank anchor timestamp/freshness.
3. Return value, status and freshness.

### `עסקאות חדשות`
1. Read latest sync status/log row.
2. If new count = 0, stop and report 0.
3. If new count > 0, read only rows whose firstSeenAt belongs to latest sync window.
4. Do not scan all transaction history unless needed for conflict resolution.

### `5 עסקאות אחרונות`
1. Resolve requested owner/card if specified.
2. Read top recent transaction rows only.
3. Reuse verified card mapping; do not ask again unless conflict exists.

### `תזרים`
1. Read freshness + current balance anchor.
2. Read only the required forecast horizon/KPIs.
3. Expand to planned cashflow/reconciliation only when a variance or conflict is detected.

### `מה חדש`
1. Use the last successful check in the active conversation as comparison point when available.
2. Read only sync delta / changed records / alerts since that point.
3. Do not reload unchanged baseline data.

### `מה הכי דחוף`
1. Read active alerts/risks and minimum forecast KPIs.
2. Rank by financial impact, time sensitivity and irreversibility.
3. Return one primary action, not a broad report.

## Conversation Cache
Within the same conversation, retain:
- resolved entity identities;
- last freshness timestamp inspected;
- last sync row inspected;
- last requested forecast horizon;
- latest canonical GitHub references from DEV handoffs.

Re-read only when the user requests refresh, enough time has passed to make staleness material, or a conflicting source appears.

## Entity Reuse
Known mappings must be reused by default: card hash ↔ owner/card, checking account, income source, recurring merchant, pension entity, source system.

If a new source conflicts with mapping:
`detect conflict → verify canonical source → update mapping owner → readback`.

## Stop Conditions
Stop reading when all are true:
- requested value/action is resolved;
- freshness is sufficient for the claim;
- no unresolved conflict can materially change the answer;
- no duplicate/double-count risk remains for the requested result.

## Anti-Patterns
- No full-sheet read for a single KPI.
- No repeated Kernel/AGENT reload in same mode/version.
- No repeated Drive search when spreadsheet ID is already known.
- No request for Gilad to repeat an entity that can be resolved canonically.
- No Web call for data already available in the financial source of truth.
- No loading LEARNED-PATTERNS or DECISION-MEMORY unless they can change the decision.

## Output Contract
Answer first. Then only the evidence/status that changes trust or action.
For a simple query, prefer 1–3 compact paragraphs over a system report.
