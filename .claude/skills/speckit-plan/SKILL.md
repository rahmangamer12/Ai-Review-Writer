---
name: speckit-plan
description: Turn an approved AutoReview AI spec into a technical implementation plan. Use after /speckit-specify to map API, data model, components, migrations, and verification before writing code. Produces specs/NNN-feature/plan.md.
---

# /speckit-plan — Design Before Build

Convert `specs/NNN-feature/spec.md` into an executable plan. No broad refactors; stay inside the acceptance criteria.

## Read first

1. The target `specs/NNN-feature/spec.md`
2. `.specify/memory/constitution.md` and `.specify/templates/plan-template.md`
3. Only the existing files this feature will touch (use `rg`, not whole-dir reads)

## Produce `specs/NNN-feature/plan.md`

Cover, concretely:

- **Architecture**: which pages/components/API routes/libs change, and how data flows.
- **Data model**: Prisma model/field changes; migration vs `db push`; RLS impact.
- **API contract**: each route — method, Zod schema, auth check, ownership scope, errors.
- **State & UI**: loading/empty/error/mobile states; lucide icons; no emoji/fake filler.
- **Security**: auth, ownership, secrets (env names only), payment safety, rate limit, CSRF.
- **External providers**: LongCat/Agnes routing, LemonSqueezy, Clerk, OAuth dashboard steps.
- **Verification**: `npx tsc --noEmit`, `npm run build` for production surfaces, manual checks.
- **Risks & rollback**: what could break, how to revert, feature-flag if risky.

## Rules

- If a durable architecture/data-ownership/billing/auth/AI-routing decision appears, flag it
  and hand off to `/specplus-adr` — do not bury it in the plan.
- Surface every `[NEEDS CLARIFICATION]` from the spec; resolve or escalate before tasks.
- Prefer existing patterns: `src/lib/db.ts`, `src/lib/credits.ts`, `src/lib/plans.ts`,
  the API Route Standard in `.claude/CLAUDE.md`.

## Done when

Plan maps every acceptance criterion to concrete file changes and a verification step.
Then suggest: run `/speckit-tasks` for `specs/NNN-feature`.
