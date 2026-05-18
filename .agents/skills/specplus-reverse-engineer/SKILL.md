# SpecKit Plus Reverse Engineer

Use this skill before changing legacy or unclear behavior.

## Workflow

1. Read `AGENTS.md`, `.specify/memory/constitution.md`, and relevant specs.
2. Use `rg` to locate only the affected code paths.
3. Document current behavior, data source, auth boundaries, UI states, and provider dependencies.
4. Mark any demo, fake, localStorage-only, Supabase legacy, or template fallback behavior.
5. Save findings to `specs/[feature]/reverse-engineering.md` or `history/reverse-engineering/`.
6. Recommend the smallest migration path to real Prisma/Clerk/server-backed behavior.

## Output Sections

- Current Behavior
- Real Data Source
- Legacy/Demo Risks
- Security And Privacy Risks
- Files Involved
- Recommended Migration
- Verification Plan

## Guardrails

- Do not rewrite code during reverse engineering unless the user explicitly asks.
- Do not read broad directories when targeted search is enough.
