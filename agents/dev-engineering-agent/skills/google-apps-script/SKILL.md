---
name: google-apps-script
owner: dev-engineering-agent
version: dev-1.7.0
---

# Google Apps Script

## Load when
Google Apps Script, Sheets, triggers, Script Properties, Web Apps, custom menus, scheduled jobs or Google Workspace automation.

## Procedure
1. Identify execution context: manual, simple trigger, installable trigger, web app or scheduled trigger.
2. Verify required scopes, properties, spreadsheet IDs, sheet names and runtime dependencies.
3. Use `LockService` around non-idempotent shared writes.
4. Design writes for retries: stable keys, upsert before append, no duplicate trigger creation.
5. Batch spreadsheet I/O; avoid per-cell loops when ranges can be read/written together.
6. Keep secrets in PropertiesService or approved secret storage, never in GitHub.
7. Make timezone explicit for financial/date logic; project default is `Asia/Jerusalem` unless source contract says otherwise.
8. Validate trigger installation and remove duplicate triggers by handler identity when appropriate.
9. After writes: `SpreadsheetApp.flush()` when result depends on formulas, then read back the visible/runtime result.

## Failure checks
- quotas/timeouts;
- stale formulas not recalculated before readback;
- trigger duplication;
- concurrent executions;
- missing permissions after deployment;
- web-app identity (`execute as`) mismatch;
- script vs spreadsheet timezone drift;
- range size mismatch and hidden/merged-cell side effects.

## Guard
Do not claim code is deployed into the live Apps Script project unless the Apps Script source was actually written/deployed or direct runtime evidence proves it.

## Done when
Source is valid, execution context is safe, writes are idempotent/concurrency-aware, and runtime/readback evidence is recorded where access permits.
