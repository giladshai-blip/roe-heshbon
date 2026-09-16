---
name: regression-testing
owner: dev-engineering-agent
version: dev-1.7.0
---

# Regression Testing

## Load when
Any bugfix, behavioral change, release candidate, promotion gate, refactor or high-risk integration change.

## Procedure
1. Translate the bug/requirement into observable acceptance conditions.
2. Add at least one test that would fail on the previous behavior when practical.
3. Cover the normal path plus the highest-risk boundary/failure paths.
4. Prefer deterministic fixtures over live mutable external state for logic tests.
5. Test idempotency for retries and duplicate execution.
6. Test date/month/timezone boundaries when dates affect logic.
7. For financial logic, test 0.01 precision, double-count prevention, partial matches and corrections.
8. For release work, verify metadata/source/version parity and no unintended files.
9. Record PASS/FAIL and unresolved limitations; never convert an unrun runtime test into PASS.

## Test layers
- syntax/static;
- unit/pure logic;
- integration/contract;
- regression;
- runtime/readback;
- promotion gate.

## Guard
A test document describing expected behavior is not evidence that live runtime passed. Mark unavailable runtime checks as NOT RUN or REQUIRES LIVE TEST.

## Done when
Acceptance criteria are mapped to tests, regressions are covered, failures are explicit, and promotion has a clear gate.
