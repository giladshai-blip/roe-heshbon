# Dev experiment — Conversation Mode Router 0.7.3

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
- Stable branch: `main`
- `main` SHA when this experiment was opened: `edfd70321f646777d7f4d5012a65c95f05944a58`
- Existing `dev` head before this experiment: `8ec48438a13f494e106eba35e89963911ceb1387`
- Safety backup: `backup/dev-pre-conversation-mode-20260915`

## Restore command
`שחזר` restores the component(s) belonging to the active experiment from the latest approved version currently in `main`, followed by readback/compare verification. It must not roll the entire `dev` branch backward and must not overwrite unrelated development work.

The opening `main` SHA above is retained as an audit/fallback reference if a historical base restore is explicitly requested.

## Production safety
`main` is intentionally unchanged by this experiment. Promotion requires regression tests and explicit approval from Gilad.
