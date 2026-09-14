# Core V5.8.0 — Cutover Report

Date: 2026-09-14
Branch: `dev`

## Scope
- Preserve the canonical two-file Apps Script structure: `src/Code.gs` + `src/Dashboard.gs`.
- Remove the temporary `CoreEngineShadow.gs` after parity validation.
- Centralize critical KPI ownership in Core through `getFinancialSnapshotV58_()`.
- Make Dashboard consume Core values for current calculated checking balance, month-end, 30-day low point, checking frame and remaining frame at low point.
- Keep the user menu limited to `🔄 סנכרון עכשיו`.

## Live validation completed before cutover
- Shadow parity: `PASS`.
- Current calculated checking balance: `-2,408.59 ₪` matched.
- Month-end forecast: `-23,068.21 ₪` matched.
- 30-day low: `-27,346.93 ₪` on `2026-10-09` matched.
- Forecast coverage: `30/30` days.
- Checking frame: `27,300.00 ₪`.
- Expected frame breach: about `46.93 ₪` on `2026-10-09`.
- Existing Core runtime self-test: `7/7 PASS` before V5.8 cutover.

## Static checks
- `dev` is not behind `main`.
- `src/` contains exactly two canonical files after cleanup: `Code.gs`, `Dashboard.gs`.
- Temporary Shadow module removed after successful parity check.
- No PAT/token/password was added to repository code.
- Changing financial values remain sourced from sheets/config, not hard-coded into the new snapshot function.

## Required live validation before promotion to main
1. Replace Apps Script `Code.gs` with `dev/src/Code.gs`.
2. Replace Apps Script `Dashboard.gs` with `dev/src/Dashboard.gs`.
3. Run `setupV58()`.
4. Run `runRuntimeSelfTestV57()` and require `7/7 PASS`.
5. Run one real `runV5Now()` sync and verify no duplicate transactions, 30/30 forecast coverage and KPI consistency.
6. Only after successful live validation may V5.8.0 be promoted to `main`.

## Project instruction impact
No instruction change is required. The refactor implements the existing rule that the canonical Apps Script structure contains two full files only and that Dashboard is a display/consumer layer rather than a calculation source.
