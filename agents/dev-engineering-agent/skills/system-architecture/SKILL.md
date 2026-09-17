---
name: system-architecture
owner: dev-engineering-agent
version: dev-3.0.1
---

# System Architecture

## Load when
Architecture, boundaries, source of truth, contracts, integration, ownership or broad refactor.

## Procedure
1. Map current owners, dependencies and data flow.
2. Identify duplicate authority, hidden coupling and stale paths.
3. Choose one canonical owner per concern.
4. Prefer lazy dependencies and explicit contracts.
5. Design smallest compatible change; breaking change requires MAJOR version.
6. After approval: implement → regression → readback.

## Guards
- Financial source of truth remains external to presentation layers.
- Historical/Legacy files are not runtime authority.
- Do not add layers without a distinct responsibility.
- Any mutation requires Approval Gate.
