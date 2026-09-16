---
name: root-cause-debugging
owner: dev-engineering-agent
version: dev-1.7.0
---

# Root Cause Debugging

## Load when
Bug, wrong output, intermittent failure, source/runtime drift, race, duplicate, double-count, stale state or unexpected behavior.

## Procedure
1. State the observable symptom without assuming cause.
2. Reproduce with the smallest reliable case or prove the mismatch with direct evidence.
3. Trace the full data/control path from source to visible result.
4. Identify the first point where expected and actual state diverge.
5. Classify root cause: data, state, logic, concurrency, boundary, integration, deployment or observability.
6. Fix the earliest authoritative layer that owns the invariant.
7. Add a regression test that fails on the old behavior and passes after the fix.
8. Read back source and, where possible, runtime result.

## Required probes
Check stale version references, hardcoded dates/amounts, timezone/day rollover, retry behavior, locks, partial writes, duplicate keys, deleted/updated upstream records and compatibility aliases.

## Guard
Do not hide a bug with a display-only patch when the source remains wrong. A temporary hotfix must be explicitly marked temporary and must not be reported as the permanent fix.

## Done when
Root cause is evidenced, authoritative source is corrected, regression coverage exists, and no adjacent invariant is broken.
