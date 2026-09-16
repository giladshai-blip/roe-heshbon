# dev-1.10.0 — Security Hardening Regression

Approved base: `core-1.9.0`  
Promotion target: `core-1.10.0`

## Scope
This regression covers repository- and source-level hardening only. It does not claim that account-level GitHub settings, live Wix page permissions, or deployed Apps Script OAuth scopes were changed unless separately read back from those systems.

## Automated controls

### S1 — Strong secret scan
**Expected:** tracked source contains no strong signatures for RiseUp PATs, GitHub tokens, Google API keys, AWS access keys or private keys.  
**Mechanism:** `scripts/security-audit.sh` + `.github/workflows/security-audit.yml`.

### S2 — RiseUp PAT storage
**Expected:** source continues to store the PAT in Apps Script `ScriptProperties`; no PAT is hardcoded in repository source.  
**Expected:** token-reference metadata is not persisted into future sync-log rows.

### S3 — Spreadsheet formula injection
**Expected:** externally supplied transaction and budget identity/type strings are passed through `sheetSafeText_()` before `setValues()`.  
**Attack inputs:** strings beginning with `=`, `+`, `-`, or `@`.  
**Expected transformation:** prefix with apostrophe so Google Sheets receives text rather than executable formula syntax.

### S4 — RiseUp outbound path guard
**Expected:** `riseupGet_()` accepts only relative paths beginning `/api/external/` and rejects protocol-containing/backslash paths before `UrlFetchApp.fetch()`.

### S5 — Web endpoint gate
**Expected:** active Apps Script source contains no `doGet()` / `doPost()`.  
**Expected future behavior:** CI fails if either is introduced without an explicit `security/web-endpoints.allow` review record.

### S6 — Apps Script manifest auditability
**Expected:** `src/appsscript.json` exists, parses as JSON, and pins:
- timezone `Asia/Jerusalem`
- runtime `V8`
- exception logging `STACKDRIVER`

OAuth scopes remain unpinned until the live deployed project scopes can be verified.

### S7 — Workflow least privilege
**Expected:** permanent security CI uses `contents: read`.  
**Expected:** no long-lived workflow has `contents: write` by default.

### S8 — Release isolation
**Expected:** all changes remain on `dev-1.10.0-security-hardening`; `main` remains `core-1.9.0` until explicit promotion approval.

## Known account-level items not automatically changed
- GitHub repository is currently public.
- `main` was observed without branch protection/ruleset enforcement.
- Wix financial site page-level authorization still requires live permission verification.
- Deployed Apps Script OAuth scopes and deployment access require live project readback.

These are not marked PASS by this regression until the relevant runtime/account state is verified.
