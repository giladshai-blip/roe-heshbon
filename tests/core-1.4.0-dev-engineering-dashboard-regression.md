# core-1.4.0 — DEV engineering + Dashboard release regression

## Scope
Promote only the technical surface required for the corrected Dashboard and DEV engineering ownership, without merging the full divergent `dev` branch.

## Required assertions

1. `release.json.version == core-1.4.0`.
2. `release.json.components.dashboard == core-1.4.0`.
3. `release.json.legacyBuildIds.dashboard == V5.10.0`.
4. `release.json.legacyBuildIds.appsScriptCore == V5.10.1`.
5. `src/Dashboard.gs` exposes release version `core-1.4.0` and Legacy Build ID `V5.10.0` separately.
6. Dashboard install writes `גרסת דשבורד = core-1.4.0` and writes the Legacy Build ID separately.
7. Dashboard keeps legacy compatibility entry points such as `installDashboardV5100()`.
8. `src/Code.gs` provides `getFinancialSnapshotV510_`, required by the Dashboard.
9. `agents/dev-engineering-agent/AGENT.md` and `RUNTIME.md` exist.
10. `docs/project-instructions.md` routes code/versioning/release tasks to DEV under Gabi.
11. `docs/versioning-policy.md` defines `V5.x` as Legacy Build IDs only.
12. No unrelated DEV-only files such as Wix/UserActions are promoted by this release.

## Static checks performed before promotion

- Dashboard source syntax checked with Node parser: PASS.
- Core source dependency readback: `getFinancialSnapshotV510_` present.
- Dashboard release identity separated from Legacy Build ID: PASS.
- User explicitly approved promotion in the active conversation.

## Runtime acceptance after Apps Script deployment

Run:
1. `setupV5101()` or the existing compatible setup entry point.
2. `installDashboardV5100()`.
3. `runDashboardSelfTestV5100()`.

Expected Dashboard self-test:
- release identity PASS;
- Legacy Build ID PASS;
- numeric 30-day trough;
- trough date(s) present;
- low-zone range and days present;
- numeric 30-day interest estimate;
- visible `שפל וריבית — 30 יום` panel.

## Known out-of-scope item
The targeted same-day credit-card posted-vs-due hotfix in the live sheet is not generalized by this release. Do not treat this release as closing that separate reconciliation bug.
