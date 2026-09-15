# dev-1.4.0 — DEV engineering + Dashboard versioning regression

## Goal
Validate the new DEV engineering ownership contract and the corrected Dashboard release numbering before promotion to `core-1.4.0`.

## Static acceptance checks

1. `release.json` on `dev` reports `dev-1.4.0` and promotion target `core-1.4.0`.
2. `release.json.components.dashboard` is `dev-1.4.0`.
3. `release.json.legacyBuildIds.dashboard` is `V5.10.0`.
4. `src/Dashboard.gs` exposes `DASHBOARD_V56.VERSION = 'dev-1.4.0'`.
5. `src/Dashboard.gs` exposes `DASHBOARD_V56.LEGACY_BUILD_ID = 'V5.10.0'`.
6. Dashboard install writes `גרסת דשבורד` from the release version, and writes the Legacy Build ID separately.
7. Dashboard self-test validates both release identity and Legacy Build ID.
8. Dashboard keeps compatibility entry points such as `installDashboardV5100()` without presenting `V5.10.0` as the current release.
9. `src/Code.gs` Legacy Build `V5.10.1` provides `getFinancialSnapshotV510_`, required by the promoted Dashboard.
10. `agents/dev-engineering-agent/AGENT.md` exists and assigns technical architecture, coding, debugging and versioning ownership to DEV under Gabi.
11. `agents/dev-engineering-agent/RUNTIME.md` defines Inspect → Reproduce → Root Cause → Design → Implement → Test → Readback → Self-Review → Version Check → Report.
12. Promotion to `main` requires explicit user approval. This release has explicit approval in the active conversation.

## Runtime acceptance checks after installation

Run `installDashboardV5100()` and then `runDashboardSelfTestV5100()`.

Expected:
- Dashboard release value equals the promoted branch release (`core-1.4.0` after promotion).
- Legacy Build ID equals `V5.10.0`.
- 30-day trough is numeric.
- trough date(s) are present.
- low-zone range and day count are present.
- 30-day interest estimate is numeric.
- panel title `שפל וריבית — 30 יום` is visible.

## Promotion gate

PASS only when:
- static syntax check passes;
- release metadata and source readback agree;
- Core dependency `getFinancialSnapshotV510_` exists in the promoted source;
- changed-file review shows no accidental promotion of unrelated DEV files;
- main readback after merge reports `core-1.4.0`.
