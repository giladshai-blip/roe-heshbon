# Versioning Policy

## Rule
The repository has one human-facing release version for the entire active system.

- Approved releases on `main` use prefix `core-`.
- Development releases on `dev` use prefix `dev-`.
- Format: `<channel>-MAJOR.MINOR.PATCH`.
- Promotion keeps MAJOR.MINOR.PATCH and changes the prefix only.
- `release.json` is the machine-readable source of truth.
- דורון (`dev-engineering-agent`) owns version resolution, release mechanics and promotion readiness.

## Current baseline
- approved `main`: `core-1.10.0`.
- active unified DEV architecture: `dev-2.1.0`.
- promotion target for this line: `core-2.1.0`.
- approved restore base: `core-1.10.0`.

`dev-2.0.0-readable-dashboard-functions` is an older unpromoted experiment and does not define the active DEV release. Because that number was already used on an experimental branch, the unified Doron breaking architecture uses `2.1.0` to avoid version collision.

## Version resolution — mandatory checks
Before assigning or changing a release number, דורון must inspect:
1. `release.json` on `main` and the active DEV branch;
2. relevant Git history, branches and PR state;
3. whether a previous DEV line was promoted or abandoned;
4. applicable live/installed build identifiers when verifiable;
5. Legacy Build IDs separately from Release Version.

Never infer a version from conversation memory alone.

### Change class
- `PATCH` — compatible bugfix only.
- `MINOR` — new compatible capability/contract/workflow/behavior.
- `MAJOR` — breaking compatibility or non-compatible architecture/contract change.

Retiring `family-cfo-agent` as an active agent and moving all ownership to Doron is a MAJOR architectural change.

## Components
All active components share the branch release number. In the unified architecture this includes:
- Apps Script Core;
- Dashboard;
- Doron unified orchestrator;
- Gabi language style;
- financial Domain Sub-agents;
- router and active bridge/application components.

`family-cfo-agent` is retired as an active component from `dev-2.1.0`; its legacy files may remain for compatibility and history.

## Dashboard numbering
Dashboard has two identifiers:
- **Release Version** — the integrated system release, e.g. `dev-2.1.0`.
- **Legacy Build ID** — compatibility identifier such as `V5.10.0`.

Legacy Build ID must never be presented as the current Release Version.

## Legacy identifiers
Identifiers such as `V5.x`, `0.7.x` and archived version labels may remain in compatibility code, triggers, historical specs and regression history. They are not active system release numbers.

## Files and tests
New active versioned docs/tests start with the branch release prefix. Historical files retained for auditability keep their old identifiers.

## Promotion gate
A DEV release may be promoted only when:
- required tests pass;
- readback passes;
- no unresolved source/runtime/version drift remains;
- `release.json` and canonical docs agree;
- Gilad explicitly approves promotion.

## GitHub handoff
For code/script/release work, דורון surfaces direct GitHub links to changed canonical source and, when applicable, PR/commit.

## Restore
`שחזר` restores the active experiment surface from the latest approved `main` unless another revision is explicitly requested.

Current restore base: `core-1.10.0`.
