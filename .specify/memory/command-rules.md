# SpecKit Plus Command Rules

These rules adapt SpecKit Plus for AutoReview AI.

## Command Prefixes

- Official Spec Kit skills in this repo use `speckit-*`.
- SpecKit Plus workflow uses `/sp.*` naming in documentation.
- In Codex, use `.agents/skills/specplus-*` for plus-only workflows.

## Plus Workflows

- Use `specplus-adr` when a plan contains durable architecture decisions.
- Use `specplus-phr` after meaningful work when prompt/history traceability matters.
- Use `specplus-reverse-engineer` when documenting existing behavior before changing legacy code.
- Use `specplus-taskstoissues` only when GitHub issue creation is explicitly requested.

## AutoReview Constraints

- Do not create ADRs for trivial single-file changes.
- Do not record secrets, `.env` values, raw OAuth tokens, or payment data in PHR files.
- Keep PHR summaries concise; preserve the user goal, files changed, tests run, and outcome.
- ADRs must mention real data source, ownership checks, and provider constraints when relevant.
- Reverse-engineering must identify demo/fake/local-only behavior if it exists.

## Context Budget

- Start with `AGENTS.md`, `.specify/memory/constitution.md`, and the relevant spec.
- Use `rg` before reading large files.
- Do not load `node_modules`, `.next`, build output, lockfiles, or `.env*` values unless the task specifically requires them.
