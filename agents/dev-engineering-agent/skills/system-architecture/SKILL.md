---
name: system-architecture
owner: dev-engineering-agent
version: dev-1.7.0
---

# System Architecture

## Load when
Architecture, system design, boundaries, source of truth, API/contracts, integration design, major refactor or component ownership.

## Procedure
1. Map actors, components, data stores, external systems and trust boundaries.
2. Identify one source of truth per datum and one owner per behavior.
3. Trace write path, read path, failure path and recovery path.
4. Define contracts: inputs, outputs, invariants, versioning and compatibility.
5. Minimize duplicated logic and implicit coupling.
6. Prefer reversible migration with adapters over simultaneous breaking rewrites.
7. Define observability and acceptance tests before implementation.

## Architecture checks
- no circular ownership;
- no display layer used as calculation source;
- no duplicate financial calculation across Core/Dashboard/Sheet;
- explicit timezone/date semantics;
- idempotent write paths where retries are possible;
- secrets outside source control;
- failure isolation and safe degraded behavior.

## Guard
A technical architecture may preserve or expose financial semantics, but changing those semantics requires Gabi/Gilad approval.

## Done when
The design states source of truth, ownership, contracts, failure/recovery behavior, migration path and tests.
