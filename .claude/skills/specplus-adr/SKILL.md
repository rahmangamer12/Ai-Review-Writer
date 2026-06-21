---
name: specplus-adr
description: Record a durable architecture decision for AutoReview AI as an ADR. Use when a plan or implementation locks in a choice affecting architecture, data ownership, auth, billing, AI provider routing, platform integration, deployment, or the Chrome extension.
---

# /specplus-adr — Architecture Decision Record

Capture decisions that future engineers should not silently reverse. Skip tiny choices.

## When to write one

Only when the decision affects: architecture, data ownership, auth (Clerk), billing
(LemonSqueezy), AI provider routing (LongCat/Agnes), platform OAuth (Google/Meta),
deployment (Vercel/GitHub Actions), database (Prisma/RLS/migrations), or extension design.

## Steps

1. Read `.specify/memory/constitution.md`, `constitutionplus.md`, and the related
   `specs/NNN-feature/plan.md` / `research.md` if present.
2. Use `.specify/templates/adr-template.md`.
3. Save as `history/adr/ADR-YYYYMMDD-short-title.md` (today via the session date).
4. Include: Context · Decision · Alternatives Considered · Consequences ·
   Real-data & Security notes · References (spec link, `file:line`, provider docs).
5. Set Status (Proposed/Accepted) and link it from the feature's `plan.md` and `specs/INDEX.md`.

## Guardrails

- One decision cluster per ADR; don't dump many unrelated choices.
- Never include `.env` values, tokens, or credentials — reference by name.
- State the security/real-data implication explicitly; that is why the record exists.
