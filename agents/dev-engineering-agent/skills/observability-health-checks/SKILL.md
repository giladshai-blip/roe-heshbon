---
name: observability-health-checks
owner: dev-engineering-agent
version: dev-3.0.1
---

# Observability & Health Checks

## Load when
Sync status, logs, health, freshness, alerts, diagnostics or monitoring.

## Procedure
`Resolve Surface → Read Current State → Check Freshness → Compare Expected → Identify Active Risk → Report Actionable Status`

## Rules
- Show active/actionable risk, not historical technical noise by default.
- Distinguish last sync, last verified balance and current time.
- Static inspection does not prove live runtime health.
- Ongoing monitoring requires Automation/CI/trigger, not chat memory.
- Any repair mutation requires Approval Gate.
