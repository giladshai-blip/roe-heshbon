# Core V5.9 Cutover Validation Report

Date: 2026-09-14
Branch under test: `dev`
Target live project: Google Apps Script for `רואה חשבון - מערכת פיננסית`

## Scope
Core V5.9.0 moves planned-cashflow reconciliation logic into `src/Code.gs` in read-only cutover mode, fixes the legacy status-filter bug that incorrectly skipped `⏳ טרם בוצע`, avoids hardcoded checking-account frame values, and keeps the Dashboard version independently at V5.8.0.

## Shadow baseline
Planned Reconciliation Shadow V0.2 exposed the legacy filter defect:
- Legacy eligible: 0
- Intended eligible: 4
- High-confidence matches: 0
- Manual review: 0
- Bug confirmed: legacy substring matching treated `טרם בוצע` as completed.

## Live Core V5.9 validation
After replacing live `Code.gs` with the dev version:

1. `runRuntimeSelfTestV57()` -> 8/8 PASS.
2. `runPlannedReconciliationV59()` ->
   - Eligible: 4
   - High-confidence matches: 0
   - Manual review: 0
   - Unmatched: 4
   - Formula disagreements K-M: 0
3. Legacy `AutomationEngine.gs` removed from live Apps Script.
4. `runRuntimeSelfTestV57()` after AutomationEngine removal -> 8/8 PASS.
5. Temporary `PlannedReconciliationShadow.gs` removed from live Apps Script.
6. `runRuntimeSelfTestV57()` after Shadow removal -> 8/8 PASS.
7. `runV5Now()` before setup -> sync completed, 0 new / 0 updated, calculated checking balance -2,408.59 ILS. Expected warning: installed Core version not yet V5.9.0.
8. `setupV59()` completed successfully with no runtime error.
9. `runRuntimeSelfTestV57()` after setup -> 8/8 PASS.
10. Final `runV5Now()` ->
    - New: 0
    - Updated: 0
    - Calculated checking balance: -2,408.59 ILS
    - Installed Core version warning removed.
    - Remaining warnings only: 3 historical `firstSeenAt` items, 1 active verification item, and the standing estimated-bank-balance caveat.

## Cutover result
PASS.

No unexpected balance change was observed. No duplicate legacy automation trigger remained in use. The reconciliation engine is in Core and remains read-only at this stage, so it does not overwrite planned-cashflow formula columns K-M.

## Promotion decision
Core V5.9.0 is approved for promotion from `dev` to `main` based on successful live Runtime, reconciliation parity, cleanup, setup, and final sync validation.
