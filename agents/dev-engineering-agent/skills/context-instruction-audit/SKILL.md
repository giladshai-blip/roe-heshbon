# Context & Instruction Audit

## Purpose
Optimize chat response latency and context quality by reducing unnecessary instruction/context loading without weakening correctness, safety, routing, or source-of-truth guarantees.

## Triggers
Use this skill for requests about chat speed, slow responses, prompt/context size, instruction bloat, duplicate rules, lazy loading, agent startup, context routing, unnecessary file reads, or archival of inactive guidance.

## Scope
Audit only the conversational/context layer unless the task explicitly includes runtime code. Primary surfaces:
- `docs/project-instructions.md`
- `docs/project-runtime-rules.md`
- agent `AGENT.md` / `RUNTIME.md`
- Skill indexes/manifests
- decision/pattern/reference documents
- startup routing and lazy-loading rules
- historical guidance files that may pollute discovery/search

## Procedure
1. Map the startup path for the requested conversation mode.
2. Classify every context source as one of:
   - `BOOT_REQUIRED` — needed before the first response;
   - `TASK_REQUIRED` — load only for matching intent;
   - `OPTIONAL` — useful only when it can change a decision;
   - `HISTORICAL` — audit/reference only, never runtime-loaded by default;
   - `REDUNDANT` — duplicated by a canonical source and candidate for removal/archive.
3. Detect duplicated rules across project instructions, runtime, agent and skill files.
4. Detect stale names, versions, routes, aliases and superseded specifications.
5. Measure practical context cost using file size, number of mandatory reads and dependency depth. Do not claim token/latency savings that were not measured directly.
6. Prefer these optimizations in order:
   - remove mandatory reads;
   - narrow reads to specific files/sections;
   - move rules from startup to lazy runtime;
   - collapse duplicated rules into one canonical source plus short references;
   - archive historical files away from active discovery paths;
   - shorten wording without changing semantics.
7. Preserve explicit safety, financial integrity, promotion and freshness gates.
8. Make changes only in `dev`, then perform readback and regression checks.

## Guards
- Never delete a rule only because it looks repetitive; first identify the canonical owner and all references.
- Never optimize by skipping a source-of-truth read required before a financial number, forecast, recommendation or write.
- Historical files may be archived only after confirming they are not active dependencies.
- Do not treat repository file count alone as chat latency evidence.
- Do not modify Apps Script or dashboard performance code unless separately requested.

## Done Criteria
A context optimization is complete only when:
- startup/task loading paths are documented;
- every removed/moved rule has a canonical replacement or is proven obsolete;
- active routing remains unambiguous;
- release metadata is consistent;
- regression checks cover greeting, DEV routing, financial task loading, and no-unnecessary-load behavior;
- readback confirms the intended files and version on `dev`.
