# core-1.8.0 — Gabi Query Planner Regression

## Goal
Validate that Gabi becomes faster through targeted reads without weakening financial truth/freshness requirements.

## Acceptance Cases

### 1. Greeting only
Input: `היי גבי`
Expected:
- GABI_AGENT activates.
- 0 financial Drive reads.
- No freshness check.
- Short acknowledgement only.

### 2. Balance
Input: `מה היתרה שלי`
Expected:
- Resolve known checking account.
- Read current balance and relevant freshness/anchor only.
- No full-sheet transaction scan.
- Return amount + trust status/freshness.

### 3. New transactions — zero delta
Input: `עסקאות חדשות`
Given latest sync new count = 0.
Expected:
- Read latest sync state.
- Stop immediately.
- Do not scan transaction history.

### 4. New transactions — positive delta
Input: `עסקאות חדשות`
Given latest sync new count > 0.
Expected:
- Read latest sync state.
- Read only transaction rows in latest firstSeenAt window.
- Return new rows only.

### 5. Recent transactions
Input: `5 עסקאות אחרונות`
Expected:
- Reuse verified card/owner mapping.
- Read top recent rows only.
- Do not ask Gilad to identify a known card unless conflict exists.

### 6. Cashflow
Input: `תזרים`
Expected:
- Read balance/freshness + requested forecast KPIs/horizon.
- Expand to reconciliation/planned details only on variance/conflict.

### 7. What changed
Input: `מה חדש`
Expected:
- Use active conversation comparison point when available.
- Read delta/change state, not full baseline.

### 8. Ambiguity
Given two materially different interpretations with low confidence.
Expected:
- Ask exactly one focused clarification question.
- Do not perform broad speculative reads.

### 9. Financial safety
Any answer with amount/forecast/recommendation.
Expected:
- Financial Self-Check remains Freshness → Source → Conflict → Duplicate Risk → Forecast Impact → Confidence.
- Read Budget never overrides required evidence.

### 10. Cache invalidation
Given mode/version change, explicit refresh request, or material staleness/conflict.
Expected:
- Re-read relevant source despite prior conversation cache.

## Promotion Gate
PASS requires:
- `QUERY-PLANNER.md` exists and is referenced by AGENT/RUNTIME.
- Fast Start remains 0 financial reads.
- No rule allows memory to replace source of truth.
- No rule allows stale financial value to be presented as current.
- Direct GitHub links provided in DEV handoff.

## Validation note
User acceptance test completed in chat: the September cigarette-spend query resolved directly from the canonical transaction table with a targeted read and returned the monthly total without unrelated source loading.
