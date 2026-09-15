# Versioning Policy

## Rule

The repository has one human-facing release version for the entire active system.

- Active approved releases on `main` MUST use prefix `core-`.
- Active development releases on `dev` MUST use prefix `dev-`.
- Format: `<channel>-MAJOR.MINOR.PATCH`.
- Promotion keeps MAJOR.MINOR.PATCH and changes the prefix only.
- `release.json` on each branch is the machine-readable source of truth for the active release.
- `dev-engineering-agent` owns version resolution, release mechanics and promotion readiness checks.

## Current baseline

- approved `main`: `core-1.4.0`
- latest promoted capability: DEV engineering ownership + corrected Dashboard release identity + Core source reconciliation to Legacy Build `V5.10.1`.
- the next `dev` release must use a version greater than `1.4.0` and list `core-1.4.0` as its approved base.

## Version resolution — mandatory checks

Before assigning or changing a release number, DEV must inspect:
1. `release.json` on `main` and `dev`;
2. relevant Git history / branches / PR state;
3. whether the previous DEV line has already been promoted;
4. applicable live/installed build identifiers when directly verifiable;
5. Legacy Build IDs separately from the release version.

Never infer the next version from conversation memory alone.

### Change class
- `PATCH` — compatible bugfix only; no new capability or contract.
- `MINOR` — new compatible capability, agent, contract, workflow or user-visible behavior.
- `MAJOR` — breaking compatibility or a non-compatible architectural contract change.

Promotion preserves `MAJOR.MINOR.PATCH`: for example `dev-1.4.0` → `core-1.4.0`.

## Components

All active components share the branch release number, including Apps Script Core, Dashboard, Gabi, DEV engineering agent, financial sub-agents, router and any active bridge/application component included in that branch.

This release number describes the integrated branch state. It does **not** replace component-specific Legacy Build IDs used for compatibility and traceability.

## Dashboard numbering

Dashboard has two distinct identifiers:
- **Release version**: the system release, e.g. `dev-1.4.0` or `core-1.4.0`.
- **Legacy Build ID**: compatibility identifier such as `V5.10.0` used by existing function names/history.

The Dashboard MUST display/store the release version as `גרסת דשבורד`. A Legacy Build ID may be stored separately but MUST NOT be presented as the current release version.

## Legacy identifiers

Old identifiers such as `V5.x`, `0.7.x` and `1.0.x` are Legacy Build IDs only. They may remain inside compatibility code, triggers, historical specifications, archived version folders and regression history when renaming them would damage traceability or compatibility. They MUST NOT be presented as the current release version.

Example: Apps Script may still carry Legacy Build ID `V5.10.1`, while the active repository release is `core-1.4.0`.

## Files and tests

New active versioned docs/tests must start with the branch release prefix (`core-` on main, `dev-` on dev). Historical files explicitly stored as version history are exempt and retain their original identifiers for auditability.

## Promotion gate

A DEV release may be promoted only when:
- required tests pass;
- readback passes;
- no unresolved source/runtime/version drift remains for the promoted surface;
- `release.json` and docs agree;
- user explicitly approves promotion.

## Restore

The command `שחזר` restores the active dev experiment component(s) from the latest approved `main` release, not from a previous dev revision unless explicitly requested.

Current restore base: `core-1.4.0`.
