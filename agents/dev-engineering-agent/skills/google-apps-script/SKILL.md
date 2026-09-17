---
name: google-apps-script
owner: dev-engineering-agent
version: dev-3.0.1
---

# Google Apps Script

## Load when
Apps Script, Sheets, triggers, PropertiesService, LockService, UrlFetch, quotas or Web App behavior.

## Procedure
1. Inspect real source and execution surface.
2. Check idempotency, locking, retries, quota and error handling.
3. Separate pure calculation from I/O when practical.
4. Avoid repeated sheet reads/writes; batch ranges when safe.
5. Preserve compatibility wrappers only while callers/triggers still require them.
6. Any mutation/test with side effect requires Approval Gate.

## Guards
- Never store secrets in source.
- Financial writes require source-of-truth and readback rules.
- Do not claim deployed/runtime behavior from static code alone.
