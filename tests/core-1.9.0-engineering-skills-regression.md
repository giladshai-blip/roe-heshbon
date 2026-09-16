# core-1.9.0 — DEV Engineering Skills Regression

## Scope
Canonical lazy-loaded Skills layer for `dev-engineering-agent`, promoted from `dev-1.9.0` after explicit Gilad approval.

## Static acceptance checks
- [x] `skills/README.md` exists and defines lazy loading.
- [x] `skills/manifest.json` exists and declares `core-1.9.0` with lineage from `core-1.8.0`.
- [x] `system-architecture/SKILL.md` exists.
- [x] `root-cause-debugging/SKILL.md` exists.
- [x] `google-apps-script/SKILL.md` exists.
- [x] `financial-data-integrity/SKILL.md` exists.
- [x] `github-release-engineering/SKILL.md` exists.
- [x] `regression-testing/SKILL.md` exists.
- [x] `observability-health-checks/SKILL.md` exists.
- [x] `AGENT.md` declares the Skill System and active Skills.
- [x] `RUNTIME.md` performs Skill Resolution before execution.
- [x] financial-data-integrity preserves Gabi/Gilad authority over financial semantics.
- [x] github-release-engineering preserves explicit approval for CORE promotion.
- [x] google-apps-script forbids false live-deployment claims.
- [x] regression-testing distinguishes PASS from NOT RUN.
- [x] observability-health-checks forbids false continuous-monitoring claims.

## Routing scenarios
1. Apps Script sync bug affecting balances → root-cause-debugging + google-apps-script + financial-data-integrity + observability-health-checks + regression-testing.
2. Version/promotion request → github-release-engineering + regression-testing.
3. Architecture redesign → system-architecture + technology-specific Skill + regression-testing.
4. Pure financial policy question → return to Gabi; DEV Skill layer does not decide policy.

## Release / drift checks
- Release: `core-1.9.0`.
- Previous approved base: `core-1.8.0`.
- Dashboard source is not changed by this release.
- Apps Script source is not changed by this release.
- `docs/versioning-policy.md` baseline is aligned to `core-1.9.0`.
- `release.json`, Startup Kernel and Skills manifest agree on `core-1.9.0`.

## Runtime status
No external Apps Script runtime execution is required for these Markdown/JSON Skills. The contractual routing is validated statically here and will be exercised during subsequent DEV tasks. Do not mark future live execution as tested solely because this file passes.

## Promotion gate
PASS: explicit Gilad approval received; readback and metadata consistency must still be verified after merge to `main`.