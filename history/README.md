# Engineering History (SpecKit Plus)

Durable traceability for AutoReview AI. Created and maintained by the SpecKit Plus workflow.

## Structure

- `adr/` — Architecture Decision Records. One durable decision cluster per file.
  Naming: `ADR-YYYYMMDD-short-title.md`. Created via `/specplus-adr`.
- `prompts/[stage]/` — Prompt History Records for meaningful work.
  Naming: `PHR-YYYYMMDD-HHMM-short-title.md`. Created via `/specplus-phr`.
  Stages: `constitution`, `spec`, `plan`, `tasks`, `implementation`, `debugging`,
  `refactor`, `general`.

## Rules

- Never store secrets, `.env` values, OAuth tokens, or card data here.
- Link records back to their `specs/NNN-feature/` and to `file:line` references.
- These are documentation, not code — they don't affect the build.
