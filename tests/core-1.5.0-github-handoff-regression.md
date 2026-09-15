# core-1.5.0 — GitHub Handoff Regression

## Goal
Ensure every DEV code/script/release completion exposes canonical GitHub references and Gabi treats them as known project state.

## Acceptance cases

1. **DEV changes code**
   - Given a DEV task changes one or more canonical source files.
   - Then the final DEV response includes a direct GitHub link to the relevant changed source file(s).
   - If a PR exists, the response also includes the PR link.
   - If a commit is the execution reference, the response also includes the commit link.

2. **No local-only handoff**
   - A local sandbox file, filename, SHA or textual path alone is insufficient when an accessible GitHub link exists.

3. **Gabi technical continuity**
   - Given DEV previously stored code/version state in canonical GitHub.
   - When Gabi receives a later technical question.
   - Then Gabi checks `main`, `release.json`, agent contracts and relevant GitHub handoff references before claiming the code/version is unknown or unavailable.

4. **No repeated user recall request**
   - If code/version/PR is discoverable from canonical GitHub references, Gabi must not ask Gilad to repeat it.

5. **Version resolution**
   - `release.json` reports `core-1.5.0`.
   - `docs/project-instructions.md`, `agents/family-cfo-agent/AGENT.md` and `docs/versioning-policy.md` agree on `core-1.5.0`.
   - Legacy Build IDs remain separate and unchanged unless their component source actually changed.

## Fail conditions
- DEV finishes code/release work without a GitHub code link.
- Gabi says "לא ידעתי" / "אין לי את הקוד" without checking canonical GitHub state.
- Current release is presented as a Legacy Build ID such as `V5.x`.
