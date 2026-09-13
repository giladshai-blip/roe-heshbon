# Sub-Agents V0.1 — Regression Report

Date: 2026-09-13
Branch: `dev-agent-architecture`
Scope: `household-controller-agent`, `cashflow-liquidity-agent`, `financial-planning-agent`, Family CFO routing registry.

## Method
Contract-level regression against the agent definitions and routing rules. No Apps Script or production formula code was changed in this release.

## Test 1 — one-off budget must not become recurring baseline
Input: a monthly budget contains a one-off cash reserve; user clarifies regular monthly cash budget is zero.
Expected:
1. Controller matches the existing budget/assumption.
2. Keeps the one-off amount in the relevant month.
3. Removes it from recurring forecast baseline.
4. Recalculates dependent forecasts.
5. Verifies the recalculated outputs.
Result: PASS.
Evidence: Controller explicitly requires classification of one-off vs recurring and `Match → Update → Recalculate → Verify`; Planning and Cashflow both prohibit treating a single exceptional month as recurring baseline.

## Test 2 — new recurring debit and anti-double-counting
Input: a new recurring payment is moved from checking account to credit card.
Expected:
1. Controller checks for an existing planned/actual record before creating a new event.
2. Cashflow uses the actual bank-outflow date of the card charge.
3. The transaction and the aggregate card debit are not both counted as checking-account outflows.
Result: PASS.
Evidence: Controller owns matching/anti-double-counting; Cashflow explicitly prohibits double-counting card charge and underlying transactions.

## Test 3 — affordability decision with liquidity risk
Input: user asks whether a discretionary purchase/vacation is affordable.
Expected routing: Controller if data changed → Cashflow → Planning → Family CFO.
Expected decision rule: a `CRITICAL` liquidity finding overrides a positive long-term planning scenario until the liquidity risk is solved.
Result: PASS.
Evidence: Registry defines routing order and precedence; Cashflow defines intra-month-low checks; Planning requires Cashflow when liquidity is relevant.

## Test 4 — contradictory or missing material data
Input: material amount/date/account identity is contradictory or cannot be matched safely.
Expected:
1. Controller returns `FAIL`.
2. Dependent financial decision is blocked rather than guessed.
3. Family CFO receives the unresolved risk and next action.
Result: PASS.
Evidence: Controller stop rules and Registry `FAIL` precedence are explicit.

## Test 5 — avoid agent sprawl
Input: simple question fully covered by one Skill and no cross-domain orchestration is needed.
Expected: Family CFO may call the Skill directly without invoking all Sub-agents.
Result: PASS.
Evidence: Registry explicitly allows direct Skill routing.

## Result
PASS — 5/5 contract-level regression scenarios.

## Release boundary
This release adds orchestration contracts only. It does not create background Runtime, change Apps Script, alter dashboard code, or independently authorize irreversible financial actions.