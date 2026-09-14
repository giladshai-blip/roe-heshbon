# Financial Model Architect — Regression Report v0.1

Date: 2026-09-14
Branch: `dev`
Scope: logical/static architecture regression only. No Apps Script Runtime execution was performed.

## Result
**10/10 PASS**

1. PASS — Architecture request routes to `financial-model-architect`.
2. PASS — System health/fault request remains routed to `financial-system-auditor`.
3. PASS — New Skill requires reading central instructions from `main`.
4. PASS — New Skill requires `dev` to be synchronized with `main` before changes.
5. PASS — New Skill defines single canonical owner per KPI.
6. PASS — New Skill explicitly detects code-vs-live-sheet drift.
7. PASS — Migration forbids Big Bang and requires Shadow before Cutover.
8. PASS — Parity checks include amount/date for 30-day low and overdraft breach.
9. PASS — Rollback is required before Cutover.
10. PASS — Runtime claims are prohibited when Apps Script live execution was not actually performed.

## Static evidence from current system audit
- `src/Code.gs` contains shared `getForecast30DayMetrics_()` / `forecastWindow_()`.
- Live Dashboard independently calculates low-point date/amount in helper cells (`Z4`/`Z19`) and breach in `Z20:Z21`.
- Canonical `src/Dashboard.gs` expects a different helper contract for the low-point KPI, creating drift risk.
- `תזרים`, `גאנט תזרים שנתי` and `תזרים מתוכנן` contain material business logic in spreadsheet formulas.

## Promotion gate
The Skill/Router/docs may be promoted after read-back verification. Application code changes remain separate and require a Shadow implementation + static tests + live Runtime/Parity test before `main`.
