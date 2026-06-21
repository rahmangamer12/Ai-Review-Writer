---
name: speckit-specify
description: Create or update a feature specification before coding. Use for any non-trivial AutoReview AI feature, refactor, integration, billing, OAuth, AI behavior, security, profile, reviews, analytics, or extension change. Produces specs/NNN-feature/spec.md tied to acceptance criteria.
---

# /speckit-specify — Write the Spec First

Turn a natural-language feature request into a reviewable spec. Code must not outrun the spec.

## Read first (in order, only what's needed)

1. `AGENTS.md`
2. `.specify/memory/constitution.md` (non-negotiable principles)
3. `.specify/memory/constitutionplus.md`
4. Existing `specs/` entries for overlap (avoid duplicates)
5. Only the source files on the dependency path for this feature

## Steps

1. Pick the next number: list `specs/`, take `max(NNN)+1`, zero-pad to 3 digits.
2. Create folder `specs/NNN-feature-slug/` and file `spec.md` inside it.
3. Fill `spec.md` using the template at `.specify/templates/spec-template.md`.
   If that template is generic, use the section list below.
4. Mark unknowns explicitly as `[NEEDS CLARIFICATION: question]` — do not invent answers.
5. Set **Status: Draft** and add a one-line entry to `specs/INDEX.md`.
6. Do NOT write implementation code in this skill. Hand off to `/speckit-plan`.

## Required spec sections

Problem · Goal · Non-Goals · User Stories · Acceptance Criteria (Given/When/Then) ·
Data Source Of Truth (Prisma model / Clerk / provider / client-only) · API Contract
(routes, auth, validation, errors) · UI States (loading/empty/success/error/mobile) ·
Security And Privacy (auth, ownership, secrets, payment, PII) · Performance ·
Error Handling · Test Plan (`npx tsc --noEmit`, `npm run build`, manual, automated) ·
Rollout (env vars, migrations, Vercel, provider dashboard) · Open Questions

## AutoReview guardrails (from the constitution)

- Real data only — no demo rows, no `Math.random` metrics, honest empty states.
- Every user API checks Clerk auth + Prisma ownership by `userId`.
- No client-side secret/token/card storage; billing = LemonSqueezy checkout + signed webhooks.
- Credits/AI: dual pools (`aiCredits` LongCat, `agnesCredits` Agnes); atomic conditional `updateMany`.
- Keep context small; cite `file:line`; never print `.env` values.

## Done when

Spec has testable acceptance criteria, a named source of truth, listed security concerns,
known env vars, and Status:Draft. Then suggest: run `/speckit-plan` for `specs/NNN-feature-slug`.
