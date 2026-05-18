# SpecKit Plus ADR

Use this skill when a plan or implementation introduces a durable architecture decision.

## Workflow

1. Read `AGENTS.md`, `.specify/memory/constitution.md`, and `.specify/memory/constitutionplus.md`.
2. Read the relevant `specs/[feature]/plan.md` and `research.md` if they exist.
3. Identify decision clusters, not tiny choices.
4. Create an ADR only when the decision affects architecture, data ownership, auth, billing, AI provider routing, platform integration, deployment, or extension design.
5. Use `.specify/templates/adr-template.md`.
6. Save ADRs under `history/adr/`.
7. Include alternatives, consequences, real-data/security notes, and references.

## Naming

Use `history/adr/ADR-YYYYMMDD-short-title.md`.

## Guardrails

- Do not write ADRs for trivial UI copy or single-file cleanup.
- Do not include secrets or `.env` values.
- Keep the ADR concise enough to review quickly.
