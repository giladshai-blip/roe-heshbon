# core-1.2.0 — Three-Mode Conversation Router

Status: Approved / main
Date: 2026-09-15

## Startup menu
Every new conversation in project `רואה חשבון` starts in `UNSET` and displays exactly:

1. **גבי — סוכן פיננסי אישי** (`היי גבי`)
2. **DEV — סביבת פיתוח ובדיקות** (`היי dev`)
3. **CORE — המערכת הפעילה והמאושרת** (`היי core`)

No financial data is loaded merely to render the menu.

## Direct routing
- `1` or `היי גבי` → `GABI_AGENT`
- `2` or `היי dev` → `DEV_ENVIRONMENT`
- `3` or `היי core` → `CORE_RUNTIME`

Selecting a number activates the mode immediately. No second trigger is required.

## Mode behavior

### GABI_AGENT
Activates `family-cfo-agent` and the financial workflow. Financial truth comes from `רואה חשבון - מערכת פיננסית` with Freshness and entity resolution checks.

### DEV_ENVIRONMENT
Development and experiments operate against branch `dev`. `main` is not modified as part of an experiment. `שחזר` restores active experiment components from the latest approved main.

### CORE_RUNTIME
Operates and inspects the approved system from `main`. New development is routed through DEV and promotion rather than edited experimentally in CORE.

## Switching
- `היי גבי`, `היי dev`, `היי core` can switch mode during a conversation.
- `החלף מצב` or `תפריט` returns to the three-option selector.
- Conversation history is preserved when switching.
