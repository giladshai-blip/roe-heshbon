# Versioning Policy

## Rule

The repository has one human-facing release version for the entire active system.

- Active approved releases on `main` MUST use prefix `core-`.
- Active development releases on `dev` MUST use prefix `dev-`.
- Format: `<channel>-MAJOR.MINOR.PATCH`.
- `release.json` on each branch is the machine-readable source of truth for the active release.

## Current baseline

- approved `main`: `core-1.2.0`
- active `dev`: `dev-1.3.0`
- next promotion target: `core-1.3.0`
- approved router: Gabi / DEV / CORE from `core-1.2.0`

## Components

All active components share the branch release number, including Apps Script Core, Dashboard, Gabi, sub-agents, router and any active bridge/application component included in that branch.

## Legacy identifiers

Old identifiers such as `V5.x`, `0.7.x` and `1.0.x` are Legacy Build IDs only. They may remain inside compatibility code, triggers, historical specifications, archived version folders and regression history when renaming them would damage traceability or compatibility. They MUST NOT be presented as the current release version.

## Files and tests

New active versioned docs/tests must start with the branch release prefix (`core-` on main, `dev-` on dev). Historical files explicitly stored as version history are exempt and retain their original identifiers for auditability.

## Restore

The command `שחזר` restores the active dev experiment component(s) from the latest approved `main` release, not from a previous dev revision unless explicitly requested.

Current restore base: `core-1.2.0`.
