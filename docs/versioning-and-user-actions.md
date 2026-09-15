# Versioning & User Actions

## Canonical release train

The repository uses one human-facing version for the whole system.

- `main` releases MUST start with `core-`.
- `dev` releases MUST start with `dev-`.
- Format: `<channel>-MAJOR.MINOR.PATCH`.
- Promotion keeps the numeric part and changes only the channel prefix: `dev-1.1.0` -> `core-1.1.0`.
- `release.json` is the machine-readable source of truth for the active release.

### Current reset baseline

| Scope | Canonical version | Previous identifiers kept only as legacy build IDs |
|---|---|---|
| Approved `main` baseline | `core-1.0.0` | Core `V5.9.0`, Dashboard `V5.8.0`, Agent `0.7.2` |
| Active `dev` | `dev-1.1.0` | Core `V5.10.1`, Dashboard `V5.9.0`, Agent `0.7.3-dev`, Wix `1.0.3` |

Legacy build IDs are retained only where existing triggers, function calls or historical audit trails depend on them. They are not valid human-facing release versions.

## Version increments

- PATCH: bug fix, wording fix, safe compatibility change.
- MINOR: new capability, new conversation mode, new user action, dashboard feature.
- MAJOR: breaking data model, migration, incompatible API or major architecture replacement.

## Public function naming

User-facing functions MUST NOT contain version numbers.

Rules:
- Verb first: `syncNow`, `openDashboard`, `checkSystemHealth`.
- One clear action per function.
- Avoid implementation words such as `V5`, `V56`, `runtime`, `handler` in user-facing names.
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
| הצג מצב מערכת | `showSystemStatus` | `showSystemStatusV5` |
| פתח דשבורד | `openDashboard` | `openDashboardV5` |
| הפעל סנכרון אוטומטי | `enableAutomaticSync` | `installRiseupSyncTriggerV5` |
| בטל סנכרון אוטומטי | `disableAutomaticSync` | `deleteV5Triggers` |
| התאם תזרים מתוכנן | `reconcilePlannedCashflow` | `runPlannedReconciliationV59` |
| בנה דשבורד | `buildDashboard` | `installDashboardV56` |
| רענן דשבורד | `refreshDashboard` | `refreshDashboardV56` |
| אפס דשבורד | `resetDashboard` | `clearDashboardV56` |
| שמור מפתח Wix | `saveWixApiKey` | `setWixApiKeyV1` |
| נקה מפתח Wix | `clearWixApiKey` | `clearWixApiKeyV1` |
| סנכרן Wix עכשיו | `syncWixNow` | `runSyncWixSnapshotV1` |
| הצג גרסה | `showReleaseInfo` | new wrapper |

## Restore contract

`שחזר` always restores the active experiment component(s) from the latest approved `main` state. It never means "go back to the previous dev commit" unless explicitly requested.

Before destructive refactors, keep a safety branch. For this refactor: `backup/dev-pre-release-train-20260915`.
