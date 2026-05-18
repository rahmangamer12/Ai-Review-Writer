# AutoReview AI SpecKit Plus Constitution

This file extends `.specify/memory/constitution.md` with SpecKit Plus practices.

## Plus Principles

### I. Architecture History Is A Product Asset

Durable architecture decisions should be captured as ADRs in `history/adr/`. ADRs are required when a change affects data ownership, authentication, payments, AI provider routing, browser extension architecture, deployment strategy, or platform integration strategy.

### II. Prompt History Is Traceability, Not Noise

Use PHR files in `history/prompts/` for meaningful implementation, debugging, planning, or production-readiness work. Do not record every tiny message. Never include secrets or raw environment values.

### III. Reverse Engineer Before Replacing Legacy Behavior

Before rewriting legacy Supabase, localStorage, payment, OAuth, review-sync, or extension behavior, document what exists, what is real, what is demo/local-only, and what must be migrated.

### IV. Multi-Agent Work Must Have Ownership Boundaries

If work is split between agents, each agent must own distinct files or modules. Workers must not revert unrelated edits and must report paths changed.

### V. Measure Before Broad Refactor

Performance, UI, and security changes should include a measurable before/after target where practical. Avoid broad refactors without a spec, plan, and verification path.

## Plus Artifacts

- ADRs: `history/adr/ADR-YYYYMMDD-short-title.md`
- Prompt History Records: `history/prompts/[stage]/PHR-YYYYMMDD-HHMM-short-title.md`
- Reverse engineering notes: `specs/[feature]/reverse-engineering.md` or `history/reverse-engineering/`

## Governance

This plus constitution complements the main constitution. If they conflict, the stricter security, privacy, and real-data rule wins.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
