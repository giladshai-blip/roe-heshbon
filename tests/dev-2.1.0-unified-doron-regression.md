# dev-2.1.0 — Unified Doron Regression

## Required invariants
- [ ] `docs/project-instructions.md` states that Doron is the single active agent.
- [ ] No active router target named `GABI_AGENT` exists in the canonical Startup Kernel.
- [ ] `היי גבי` routes to Doron with GABI response style.
- [ ] `היי דורון` routes to the same Doron agent with DORON response style.
- [ ] `היי core` routes Doron to CORE runtime; CORE is not an agent.
- [ ] `agents/family-cfo-agent/AGENT.md` is RETIRED and has no active ownership.
- [ ] `release.json` sets both financialOwnership and technicalOwnership to `dev-engineering-agent`.
- [ ] `release.json` version is `dev-2.1.0` and promotion target is `core-2.1.0`.
- [ ] Gabi is defined only as language/style in `docs/gabi-language-style.md`.
- [ ] Financial source of truth remains `רואה חשבון - מערכת פיננסית`.
- [ ] Freshness, Financial Self-Check, anti-double-counting and readback guards remain mandatory.
- [ ] Development defaults to DEV and promotion to main still requires explicit Gilad approval.

## Compatibility
Historical files under `agents/family-cfo-agent/` may remain for playbooks and traceability, but must not be referenced as the active agent by the canonical router.

## Result
PASS only after readback of the canonical files and branch compare confirms that the change is isolated to architecture/docs/release metadata and does not modify financial data.
