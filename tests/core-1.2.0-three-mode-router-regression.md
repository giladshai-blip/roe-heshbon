# Regression — core-1.2.0 Three-Mode Conversation Router

## PASS cases

1. New chat + `היי` → show exactly Gabi / DEV / CORE.
2. New chat + `היי גבי` → enter GABI_AGENT immediately.
3. New chat + `היי dev` → enter DEV_ENVIRONMENT immediately.
4. New chat + `היי core` → enter CORE_RUNTIME immediately.
5. Selection `1` → GABI_AGENT immediately; no second trigger.
6. Selection `2` → DEV_ENVIRONMENT immediately.
7. Selection `3` → CORE_RUNTIME immediately.
8. Selected mode persists for the current conversation.
9. `החלף מצב` or `תפריט` → return to the three-option menu without losing conversation history.
10. DEV uses branch `dev` for experiments and does not modify `main` as part of an experiment.
11. CORE uses `main` as the approved source and routes new development through DEV.
12. Gabi performs source/Freshness checks before material financial answers.

## FAIL cases

- Showing the previous topic menu: תפעול מערכת / תזרים / הון אישי.
- Requiring `היי גבי` after selection `1`.
- Treating `היי dev` as Gabi activation.
- Treating `היי core` as DEV.
- Writing experimental changes directly to `main` from CORE.
