# Versioning & User Actions

## Canonical release train

The repository uses one human-facing version for the whole system.

- `main` releases MUST start with `core-`.
- `dev` releases MUST start with `dev-`.
- Format: `<channel>-MAJOR.MINOR.PATCH`.
- Promotion keeps the numeric part and changes only the channel prefix: `dev-1.2.0` -> `core-1.2.0`.
- `release.json` is the machine-readable source of truth for the active release.

### Current baseline

| Scope | Canonical version | Previous identifiers kept only as legacy build IDs |
|---|---|---|
| Approved `main` baseline | `core-1.0.0` | Core `V5.9.0`, Dashboard `V5.8.0`, family agent `0.7.2`, sub-agents `0.7.0` |
| Active `dev` | `dev-1.2.0` | Core `V5.10.1`, Dashboard `V5.9.0`, family agent `0.7.3-dev`, sub-agents `0.7.0`, Wix `1.0.3` |

Legacy build IDs are retained only where triggers, compatibility calls or historical audit trails depend on them. They are not human-facing release versions.

## Version increments

- PATCH: bug fix, wording fix, safe compatibility change.
- MINOR: new capability, conversation routing behavior, user action, dashboard feature.
- MAJOR: breaking data model, migration, incompatible API or major architecture replacement.

## Conversation routing

`dev-1.2.0` defines three user-facing conversation modes:

1. `GABI_AGENT` — selected by `1` or `היי גבי`.
2. `DEV_ENVIRONMENT` — selected by `2` or `היי dev`.
3. `CORE_RUNTIME` — selected by `3` or `היי core`.

A numeric selection activates the mode immediately. No second trigger is required.

`החלף מצב` or `תפריט` returns to the three-mode selector.

## Public function naming

User-facing functions MUST NOT contain version numbers.

Rules:
- Verb first: `syncNow`, `openDashboard`, `checkSystemHealth`.
- One clear action per function.
- Avoid implementation words such as `V5`, `V56`, `runtime`, `handler` in user-facing names.
- Manual credential actions should open a prompt instead of requiring function parameters.
- Internal helpers end with `_` and may remain technical.
- Existing versioned functions remain compatibility aliases until all triggers and callers are migrated.

### Canonical user actions

| User action | Canonical function | Legacy target |
|---|---|---|
| התקן/עדכן מערכת | `installSystem` | `setupV56` |
| סנכרן עכשיו | `syncNow` | `runV5Now` |
| סנכרן 12 חודשים | `syncHistory12Months` | `syncRiseUpHistory12MonthsV5` |
| עדכן יתרת עו״ש | `updateBankBalance` | `promptVerifiedBankBalanceV5` |
| רענן תחזיות | `refreshForecasts` | `refreshForecastsV5` |
| בדוק תקינות מערכת | `checkSystemHealth` | `healthCheckV5` |
| הרץ אבחון מלא | `runSystemDiagnostics` | `runRuntimeSelfTestV57` |
| בדוק כפילויות | `checkDuplicateTransactions` | `checkDuplicatesV5` |
| בדוק אימות נתונים | `reviewDataVerification` | `scanVerificationStatusV5` |
| הצג מצב מערכת | `showSystemStatus` | friendly status wrapper |
| פתח דשבורד | `openDashboard` | `openDashboardV5` |
| הפעל סנכרון אוטומטי | `enableAutomaticSync` | `installRiseupSyncTriggerV5` |
| בטל סנכרון אוטומטי | `disableAutomaticSync` | `deleteV5Triggers` |
| התאם תזרים מתוכנן | `reconcilePlannedCashflow` | `runPlannedReconciliationV59` |
| בנה דשבורד | `buildDashboard` | `installDashboardV56` |
| רענן דשבורד | `refreshDashboard` | `refreshDashboardV56` |
| אפס דשבורד | `resetDashboard` | `clearDashboardV56` |
| עדכן חיבור RiseUp | `updateRiseUpToken` | prompt → `setRiseupPatV5` |
| נקה חיבור RiseUp | `clearRiseUpToken` | `clearRiseupPatV5` |
| עדכן חיבור Wix | `updateWixApiKey` | prompt → `setWixApiKeyV1` |
| נקה חיבור Wix | `clearWixApiKey` | `clearWixApiKeyV1` |
| סנכרן Wix עכשיו | `syncWixNow` | `runSyncWixSnapshotV1` |
| הצג גרסה | `showReleaseInfo` | release wrapper |

## Restore contract

`שחזר` always restores the active experiment component(s) from the latest approved `main` state. It never means "go back to the previous dev commit" unless explicitly requested.

Safety branches:
- `backup/main-pre-core-1.0.0-20260915`
- `backup/dev-pre-release-train-20260915`
- `backup/dev-pre-three-mode-router-20260915`
