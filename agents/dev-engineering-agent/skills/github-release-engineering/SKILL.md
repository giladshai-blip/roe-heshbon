---
name: github-release-engineering
owner: dev-engineering-agent
version: dev-1.7.0
---

# GitHub Release Engineering

## Load when
Branch, PR, release, version, promotion, restore, rollback, merge, GitHub handoff or source/version drift.

## Procedure
1. Read `main/release.json`, active DEV/release metadata and `docs/versioning-policy.md`.
2. Inspect relevant branches, PRs, commits and divergence before assigning a version.
3. Separate release version from Legacy Build IDs.
4. Classify change: PATCH, MINOR or MAJOR from actual compatibility impact.
5. Work on an isolated DEV/release branch; preserve a restore point for risky changes.
6. Keep release metadata, agent docs, tests and changed source consistent.
7. Run tests/readback before PR/promotion.
8. Promotion to `main` requires explicit Gilad approval.
9. After merge, read back `main` and canonical source URLs.
10. Handoff must include direct GitHub links to changed source and PR/commit when relevant.

## Guards
- never guess version numbers from chat memory;
- never present `V5.x`/legacy IDs as system release version;
- never claim merge/promotion/deployment before readback;
- do not mix unrelated experimental files into a release branch;
- do not overwrite newer main state with an older dev snapshot.

## Restore
`שחזר` means restore the active experiment surface from the latest approved `main`, unless the user explicitly names another revision.

## Done when
Version lineage is proven, metadata agrees with source, tests/readback pass, GitHub links are provided and promotion state is unambiguous.
