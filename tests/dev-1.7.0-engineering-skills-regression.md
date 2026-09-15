# dev-1.7.0 — DEV Engineering Skills Regression

## Scope
Issue #32 — canonical Skills layer for `dev-engineering-agent`.

## Static acceptance checks
- [x] `skills/README.md` exists and defines lazy loading.
- [x] `skills/manifest.json` exists and declares version `dev-1.7.0`.
- [x] `system-architecture/SKILL.md` exists.
- [x] `root-cause-debugging/SKILL.md` exists.
- [x] `google-apps-script/SKILL.md` exists.
- [x] `financial-data-integrity/SKILL.md` exists.
- [x] `github-release-engineering/SKILL.md` exists.
- [x] `regression-testing/SKILL.md` exists.
- [x] `observability-health-checks/SKILL.md` exists.
- [x] `AGENT.md` declares Skill System and active Skills.
- [x] `RUNTIME.md` performs Skill Resolution before execution.
- [x] financial-data-integrity explicitly preserves Gabi/Gilad authority over financial semantics.
- [x] github-release-engineering preserves explicit approval requirement for CORE promotion.
- [x] google-apps-script forbids false live-deployment claims.
- [x] regression-testing distinguishes PASS from NOT RUN.
- [x] observability-health-checks forbids false continuous-monitoring claims.

## Routing scenarios
1. Apps Script sync bug affecting balances → root-cause-debugging + google-apps-script + financial-data-integrity + observability-health-checks + regression-testing.
2. Version/promotion request → github-release-engineering + regression-testing.
3. Architecture redesign → system-architecture + technology-specific Skill + regression-testing.
4. Pure financial policy question → return to Gabi; DEV Skill layer must not decide policy.

## Release checks
- Branch release: `dev-1.7.0`.
- Approved base: `core-1.5.0`.
- Promotion target: `core-1.7.0`.
- `core-1.6.0` remains a separate in-flight Dashboard release line.

## Runtime status
No external runtime execution is required for these Markdown/JSON Skills. Runtime behavior is contractual and will be exercised on subsequent DEV tasks. Do not mark future live task execution as tested solely because this document passes.

## Promotion gate
Promotion remains blocked until Gilad explicitly approves `dev-1.7.0` → `core-1.7.0` after readback/review.
