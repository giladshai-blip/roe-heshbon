# Core V5.8.0 — Cutover Report

Date: 2026-09-14
Branch: `dev`

## Scope
- Preserve the canonical two-file Apps Script structure: `src/Code.gs` + `src/Dashboard.gs`.
- Remove the temporary `CoreEngineShadow.gs` after parity validation.
- Centralize critical KPI ownership in Core through `getFinancialSnapshotV58_()`.
- Make Dashboard consume Core values for current calculated checking balance, month-end, 30-day low point, checking frame and remaining frame at low point.
- Keep the user menu limited to `🔄 סנכרון עכשיו`.

## Live validation completed
- Shadow parity: `PASS`.
- Current calculated checking balance: `-2,408.59 ₪` matched.
- Month-end forecast: `-23,068.21 ₪` matched.
- 30-day low: `-27,346.93 ₪` on `2026-10-09` matched.
- Forecast coverage: `30/30` days.
- Checking frame: `27,300.00 ₪`.
- Expected frame breach: about `46.93 ₪` on `2026-10-09`.
- Existing Core runtime self-test before cutover: `7/7 PASS`.
- V5.8 runtime self-test after replacing `Code.gs` + `Dashboard.gs`: `7/7 PASS`.
- `setupV58()` completed without Runtime error.
- V5.8 runtime self-test after setup: `7/7 PASS`.
- Real `runV5Now()` sync after setup completed successfully: 0 new, 0 updated, calculated checking balance `-2,408.59 ₪`.
- Version warnings for Core and Dashboard disappeared after setup.

## Remaining non-blocking warnings after final sync
- 3 historical transactions have missing/same-day `firstSeenAt`; historical intake time is not verified.
- 1 active verification item remains in `אימות נתונים`.
- Calculated checking balance remains an estimate anchored to the last verified bank balance; same-day anchor transactions, corrections and deleted RiseUp transactions require bank reconciliation.

These warnings are data-quality/verification warnings and did not indicate a V5.8 code/runtime failure.

## Static / structural checks
- `dev` was not behind `main` before development.
- `src/` contains exactly two canonical Apps Script files after cleanup: `Code.gs`, `Dashboard.gs`.
- Temporary Shadow module removed after successful parity check.
- No PAT/token/password was added to repository code.
- Changing financial values remain sourced from sheets/config, not hard-coded into the new snapshot function.

## Promotion decision
`V5.8.0` passed the required Shadow parity, Runtime, setup and real-sync validation gates. It is eligible for promotion to `main`.

## Project instruction impact
No instruction change is required. The refactor implements the existing rule that the canonical Apps Script structure contains two full files only and that Dashboard is a display/consumer layer rather than a calculation source.
