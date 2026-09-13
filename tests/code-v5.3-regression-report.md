# Code V5.3 — Regression Report

Date: 2026-09-13
Branch: `dev`
Scope: modular refactor and performance optimization of RiseUp Sync / Google Apps Script code.

## Safety boundary
This report covers syntax, structural compatibility and mocked logic tests. It is **not** a live Google Apps Script execution against the production spreadsheet or RiseUp API.

## Changes under test
- Split monolithic `src/Code.gs` into six focused modules.
- Execution-local cache for Spreadsheet, Sheet objects and config map.
- Batched RiseUp transaction requests with controlled batch size and retry fallback.
- Grouped contiguous transaction updates instead of one Sheets write per changed row.
- Duplicate formulas refreshed only for newly appended rows during normal sync.
- Bounded bank-balance SUMIFS ranges with dynamic headroom instead of full-column ranges.
- Quick health check for normal/hourly sync; deep formula scan retained for manual/setup checks.
- RTL formatting restricted to used ranges instead of full max grid.
- Public V5 function names retained for menu/trigger compatibility.

## Automated checks
1. Public entry points preserved — PASS
2. Spreadsheet object cached once per execution — PASS
3. Sheet list cached once per execution — PASS
4. Stable stringify deterministic — PASS
5. `transactionId` remains primary key — PASS
6. Fallback transaction fingerprint deterministic — PASS
7. Batched API fetch preserves response order — PASS
8. 9-request batch splits as 4/4/1 — PASS
9. Contiguous transaction updates grouped into minimal writes — PASS
10. Bank-balance formula no longer uses whole-column SUMIFS — PASS
11. Quick/deep health modes present and deep mode retained for manual health — PASS

## Result
**PASS — 11/11 static/mocked regression checks.**

## Promotion status
`dev` only. Do not promote to `main` until a live Apps Script smoke test confirms at least:
- `setupV5()` completes without error.
- `syncRiseUpV5()` completes against the connected RiseUp API.
- current account balance remains correct after sync.
- no duplicate transaction is created.
- dashboard opens and gauges can be refreshed.
- manual deep `healthCheckV5()` returns expected status.

## Rollback
Pre-refactor `dev` state is preserved in branch `dev-backup-20260913-pre-refactor`.
