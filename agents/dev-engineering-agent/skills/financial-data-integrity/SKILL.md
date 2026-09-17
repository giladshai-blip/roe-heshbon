---
name: financial-data-integrity
owner: dev-engineering-agent
version: dev-3.0.1
---

# Financial Data Integrity

## Load when
Balance, cashflow, card/bank movement, reconciliation, forecast, transaction, duplicate or double-count risk.

## Procedure
`Resolve Source → Freshness → Entity → Match → Duplicate Risk → Reconcile → Recalculate → Readback`

## Rules
- One event must affect each financial layer once.
- Separate actual, planned, forecast and assumption.
- Dashboard is a consumer, not source of truth.
- Never replace a verified value with weaker evidence silently.
- mutation requires Approval Gate; success requires readback.
