# dev-1.11.0 — Context & Instruction Audit Regression

## Goal
Verify that chat startup and task routing load less context without weakening financial or DEV guards.

## Static checks
- [ ] `release.json` = `dev-1.11.0`, approved base = `core-1.10.0`.
- [ ] `context-instruction-audit` exists in the DEV Skills manifest and is lazy-loaded.
- [ ] `docs/project-instructions.md` remains the top authority but contains only router, fast-start, lazy-load, essential guards and authority order.
- [ ] Detailed financial policy remains in `docs/project-runtime-rules.md` / Gabi Runtime.
- [ ] Detailed engineering policy remains in Doron Runtime.

## Conversation routing
1. New chat: `היי`
   - Expected: exactly three mode choices; no financial data reads.
2. New chat: `היי גבי`
   - Expected: activate GABI_AGENT; short reply; no financial Drive read; no detailed Runtime load.
3. New chat: `היי דורון`
   - Expected: activate DEV_ENVIRONMENT; short reply; no code/GitHub/release/runtime/skills read beyond host-required minimum.
4. `היי גבי תזרים`
   - Expected: load relevant financial runtime + source of truth + freshness before numeric answer.
5. `היי דורון בדוק את dev`
   - Expected: load Doron runtime + GitHub/release engineering context only; do not load household financial data.

## Safety / integrity guards
- [ ] No financial number/recommendation without relevant source-of-truth + freshness.
- [ ] No `main` promotion without explicit Gilad approval.
- [ ] No success claim after a write without readback.
- [ ] No secrets stored in GitHub.

## Performance evidence
Do not claim a measured latency improvement until end-to-end timings are captured. For this release, acceptable evidence is reduction in mandatory startup context size/read count plus preserved regression behavior.
