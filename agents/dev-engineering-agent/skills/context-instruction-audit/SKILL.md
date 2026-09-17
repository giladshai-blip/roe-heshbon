---
name: context-instruction-audit
owner: dev-engineering-agent
version: dev-3.0.1
---

# Context & Instruction Audit

## Purpose
Reduce unnecessary context/instruction loading without weakening correctness, safety, routing or source-of-truth guarantees.

## Load when
Chat latency, context size, duplicate rules, startup, lazy loading, stale routes/names/versions or historical guidance pollution.

## Classification
`BOOT_REQUIRED | TASK_REQUIRED | OPTIONAL | HISTORICAL | REDUNDANT`

## Procedure
1. Map startup/task loading path.
2. Identify duplicate authority and stale references.
3. Keep one canonical owner per rule.
4. Move non-startup rules to lazy runtime/skills.
5. Keep historical files out of default loading.
6. Shorten wording without changing semantics.
7. Regression + readback after approved changes.

## Guards
- Do not remove safety, Approval, financial Source/Freshness or readback gates.
- Historical files may remain for audit but are not runtime dependencies.
- Do not claim latency/token savings unless measured.
- Apps Script/dashboard performance code is separate from context optimization unless explicitly included.
