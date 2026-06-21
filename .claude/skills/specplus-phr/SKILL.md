---
name: specplus-phr
description: Record a Prompt History Record for meaningful AutoReview AI work — traceability of what was built, why, and how it was verified. Use after completing a spec, plan, implementation, debugging session, or refactor worth remembering.
---

# /specplus-phr — Prompt History Record

Preserve meaningful work so future sessions understand intent and outcome.

## Steps

1. Read `AGENTS.md` and `.specify/memory/command-rules.md`.
2. Pick the stage: `constitution`, `spec`, `plan`, `tasks`, `implementation`,
   `debugging`, `refactor`, or `general`.
3. Use `.specify/templates/phr-template.prompt.md`.
4. Save as `history/prompts/[stage]/PHR-YYYYMMDD-HHMM-short-title.md`
   (use the session date/time; do not call Date.now()).
5. Capture: user goal, summary of work, outcome, files changed (`file:line`),
   tests run and results, and any follow-up.

## Guardrails

- Never record raw secrets, `.env` values, OAuth tokens, card data, or credentials.
- Summarize long conversations — do not paste huge logs.
- Keep the user goal clear enough that a future agent can resume cold.
