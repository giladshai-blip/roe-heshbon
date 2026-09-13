# Changelog

## Core V5.6.3 / Dashboard V5.6.1 — 2026-09-13 — dev

Adapted against read-only inspection of the supplied live workbook; not yet deployed to Apps Script.

### Core

- Preserve the batched upsert introduced in `38a4b08`; skip the write for unchanged data, grow full grids, retain columns beyond U.
- Map documented `cashflowDate`, `totalNumberOfInstallments`, and legacy `totalNumberOfPayments`. Retain the requested month as fallback, not the transaction calendar month.
- Reject malformed responses, invalid dates/amounts, and unknown directions. Never infer income from a positive absolute amount.
- Normalize RiseUp day dates in Asia/Jerusalem, including UTC-midnight aliases. Month windows use Jerusalem's calendar even across year boundaries.
- Compute duplicate status independently of U. Preserve legacy U values; do not manufacture observation timestamps.
- Bound bank-balance estimates through today. Later-day transactions do not depend on arrival time; anchor-day transactions still use firstSeenAt and require reconciliation.
- Guard existing schema before mutation. Preserve manually maintained forecast assumptions and formatting. Repair only the observed `C5 = B15 + C15*12` mistake to `B5 + C15*12`, plus direct goal/end-of-month source links.
- Validate budget before clearing; write replacement before clearing stale tail; preserve numeric zero; omit request metadata from hash.
- Preserve historical log columns and map new records by header. Do not expose HTTP response bodies in errors; preserve original sync errors if logging fails.
- Health checks cover source links, chronology, 30-day coverage, duplicate IDs, missing months, legacy timestamps, active verification lifecycle, dashboard KPI agreement and formula errors across used ranges.
- Serialize balance anchor and refresh mutations with sync; report warnings as warnings.

### Dashboard

- Clear old merges before rebuilding; record the dashboard version only after installation.
- Use unavailable states instead of zero or `1E+99`; guard recommendations and conditional colors.
- Require 30 distinct forecast dates (today through today + 29).
- Filter card labels and ratios identically; preserve ratios over 100%; take target from settings.
- Label the measure as upcoming bill / stated limit, not complete utilization. Exclude missing-limit/ratio rows and the observed identity-conflict status from the compared subset.

### Delivery

- Canonical full files remain `src/Code.gs` and `src/Dashboard.gs` on `dev`.
- README corrected; audit, installation, rollback and 40 passing synthetic tests added.
- No live workbook writes, Apps Script execution, PAT access or automatic merge to main performed.
- Existing project instructions already require grounded edits, preservation of assumptions, dev-first work and manual installation. No change to `docs/project-instructions.md` was needed.
