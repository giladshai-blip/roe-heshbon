---
name: observability-health-checks
owner: dev-engineering-agent
version: dev-1.7.0
---

# Observability & Health Checks

## Load when
Sync status, health check, runtime diagnostics, logs, alerts, freshness, trigger state, operational monitoring or incident investigation.

## Procedure
1. Define the health surface: source/API, sync, triggers, data freshness, Core, Dashboard, bridge/site.
2. Prefer machine-readable status with one timestamp and explicit source.
3. Separate `OK`, `WARNING` and `ERROR`; every non-OK state must include one actionable next step.
4. Track last success, last attempt, duration, record counts and error category where relevant.
5. Avoid noisy technical warnings that do not change user action; retain detail in logs.
6. Detect stale state explicitly using configured freshness thresholds.
7. Health checks must be read-only unless the operation is clearly named as repair/remediation.
8. Read back the same state that the user-facing status consumes to prevent contradictory status screens.

## Guards
- do not equate HTTP/API success with correct data state;
- do not call a system healthy when critical freshness or reconciliation checks are unknown;
- do not claim continuous monitoring unless an actual Automation/trigger/CI job exists;
- logs must not expose secrets/tokens.

## Done when
A single coherent status can say what is healthy, stale or broken, when it was checked, and what action is next.
