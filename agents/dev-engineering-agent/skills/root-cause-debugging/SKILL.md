---
name: root-cause-debugging
owner: dev-engineering-agent
version: dev-3.0.1
---

# Root Cause Debugging

## Load when
Bug, wrong output, failure, drift, race, duplicate, double-count or stale state.

## Procedure
`Reproduce → Narrow Surface → Compare Expected/Actual → Identify Root Cause → Design Minimal Fix → Approval → Fix → Regression → Readback`

## Rules
- Fix root cause, not only symptom.
- Separate data error, code error, config error and stale state.
- For finance, verify duplicate risk and source freshness before changing logic.
- Do not mutate live state while diagnosing unless explicitly approved.
