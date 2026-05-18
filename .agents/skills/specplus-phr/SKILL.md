# SpecKit Plus Prompt History Record

Use this skill when meaningful work should be recorded for traceability, learning, or handoff.

## Workflow

1. Read `AGENTS.md` and `.specify/memory/command-rules.md`.
2. Decide the stage: `constitution`, `spec`, `plan`, `tasks`, `implementation`, `debugging`, `refactor`, or `general`.
3. Use `.specify/templates/phr-template.prompt.md`.
4. Save the record under `history/prompts/[stage]/`.
5. Include user goal, summary, outcome, files changed, tests run, and follow-up.

## Naming

Use `history/prompts/[stage]/PHR-YYYYMMDD-HHMM-short-title.md`.

## Guardrails

- Never record raw secrets, `.env` values, OAuth tokens, card data, or private credentials.
- Summarize long conversations instead of pasting huge logs.
- Preserve the user goal clearly enough that future agents understand the work.
