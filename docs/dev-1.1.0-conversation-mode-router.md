# Dev experiment — Conversation Mode Router — dev-1.1.0

Date: 2026-09-15
Branch: `dev`
Status: Experimental

## Goal
Replace the automatic opening financial report with a pre-agent conversation-topic selector. Gabi is activated only after a topic is selected and the explicit trigger `היי גבי` is used.

## Conversation modes
1. תפעול מערכת
2. שיחה על התזרים
3. שיחה על הון אישי

## Stable restore base
- Approved release: `core-1.0.0`
- Stable branch: `main`
- `main` SHA when this experiment was opened: `edfd70321f646777d7f4d5012a65c95f05944a58`
- Safety backup before release-train refactor: `backup/dev-pre-release-train-20260915`

## Restore command
`שחזר` restores the component(s) belonging to the active experiment from the latest approved version currently in `main`, followed by readback/compare verification. It must not roll the entire `dev` branch backward and must not overwrite unrelated development work.

## Release naming
This experiment is part of `dev-1.1.0`. If approved, it promotes as `core-1.1.0` without changing the numeric portion.

## Production safety
`main` remains the approved restore source. Promotion requires regression tests, Runtime validation and explicit approval from Gilad.
