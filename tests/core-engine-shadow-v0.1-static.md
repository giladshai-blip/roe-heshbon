# Core Engine Shadow V0.1 — Static Check

Date: 2026-09-14
Branch: `dev`

## Scope
Static review only. No live Apps Script runtime was executed.

## Checks
- PASS — Shadow file is isolated and uses unique `shadow*` function names.
- PASS — Shadow does not write financial values or dashboard KPI cells.
- PASS — Reads only `תזרים`, `גאנט תזרים שנתי`, `הגדרות`, and dashboard helper cells for parity.
- PASS — Computes current calculated balance, month-end, 30-day low amount/date, checking-frame margin, and first forecast breach.
- PASS — Supports both dashboard helper contracts observed in the project: `Z4=amount` and live drift case `Z4=date / Z19=amount`.
- PASS — Compares Shadow 30-day low to existing Core `getForecast30DayMetrics_()` when available.
- PASS — No trigger is created by the Shadow file.
- PASS — No source-of-truth data is changed.

## Runtime gate
Before any Cutover or deletion of legacy calculation code, copy `src/CoreEngineShadow.gs` into the live Apps Script project and run `runShadowParityV01()`.

Required result before proceeding: `status = PASS` and all parity comparisons `ok = true`, or every mismatch must be explained before migration continues.
