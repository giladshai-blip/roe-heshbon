---
name: financial-data-integrity
owner: dev-engineering-agent
version: dev-1.7.0
---

# Financial Data Integrity

## Load when
Balance, cashflow, credit cards, bank movements, reconciliation, forecasts, transaction ingestion, duplicate prevention or any technical change that can alter monetary outputs.

## Core invariants
- one economic event affects household balance once;
- source records are immutable identifiers where possible; corrections are reconciled, not duplicated;
- planned liability remains until matched to actual posting or explicitly verified;
- internal transfer is not household income/expense;
- card purchase and card settlement are not double-counted as two household expenses;
- partial posting removes only the matched liability amount;
- date rollover alone never proves settlement;
- current balance anchor and forecast liabilities are separate concepts.

## Procedure
1. Identify economic event identity, source, account/card, direction, amount and relevant dates.
2. Separate `observed/posted`, `planned/due`, `verified anchor` and `derived forecast` states.
3. Reconcile before create: exact ID first, then guarded fingerprint/tolerance rules.
4. Make matching deterministic and idempotent; record why a match occurred.
5. Handle corrections, deletions, reversals and partial matches explicitly.
6. Recompute downstream forecast from authoritative state instead of incrementally drifting totals where practical.
7. Test same-day billing, month boundary, timezone boundary, retry, partial posting and deleted-upstream cases.
8. Read back monetary outputs to 0.01 tolerance unless the source has a different precision contract.

## Guard
This Skill protects technical accounting semantics but does not invent financial policy. Any change to what a transaction *means* for the household requires Gabi/Gilad approval.

## Done when
No event is missing or counted twice, reconciliation is explainable, retries are safe, and affected balance/forecast outputs pass regression checks.
