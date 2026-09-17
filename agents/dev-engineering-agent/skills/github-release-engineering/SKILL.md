---
name: github-release-engineering
owner: dev-engineering-agent
version: dev-3.0.1
---

# GitHub Release Engineering

## Load when
GitHub, branch, release, version, restore, rollback, merge or source/version drift.

## Current model
- Active/default branch: `dev` only.
- Release format: `dev-MAJOR.MINOR.PATCH`.
- No `main`, CORE or cross-branch Promotion workflow.
- `מאושר לקידום` = approve current DEV release inside `dev`.

## Procedure
`Inspect release.json → Check history/drift → Classify version → Approval → Mutate → Test/Status → Readback → Handoff`

## Guards
- Never infer version from memory.
- Legacy Build IDs are not Release Version.
- Restore uses Git history or explicit backup ref.
- Every write/branch/release mutation requires Approval Gate.
