---
name: regression-testing
owner: dev-engineering-agent
version: dev-3.0.1
---

# Regression Testing

## Load when
Code/behavior change, bugfix, refactor, integration or release gate.

## Procedure
1. Define changed contract and invariants.
2. Cover happy path + relevant boundary/error/idempotency cases.
3. Prefer static/pure tests before live side-effect tests.
4. Side-effect test must be inside approved scope.
5. Read back changed files/config/results.
6. Record PASS/FAIL; do not mark release approved while a material gate fails.

## Release Gate
For current `dev` release: metadata alignment, required tests, readback and no unresolved drift in changed surfaces.
