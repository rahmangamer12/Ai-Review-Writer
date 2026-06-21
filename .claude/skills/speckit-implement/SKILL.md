---
name: speckit-implement
description: Execute an AutoReview AI tasks.md in small verified slices. Use after /speckit-tasks to write the actual code, checking off tasks and verifying with tsc/build. Stays inside the spec's acceptance criteria.
---

# /speckit-implement — Build the Tasks

Implement `specs/NNN-feature/tasks.md` one task at a time, touching only scoped files.

## Read first

`specs/NNN-feature/spec.md`, `plan.md`, `tasks.md`, and the API Route Standard in `.claude/CLAUDE.md`.

## Loop per task

1. Read only the files that task touches.
2. Implement the smallest correct change; follow existing patterns
   (`src/lib/db.ts`, `src/lib/credits.ts`, `src/lib/plans.ts`, Clerk auth, Zod validation).
3. Check the box in `tasks.md` and note the `file:line` changed.
4. Run `npx tsc --noEmit`; fix before moving on.

## Hard rules (constitution)

- Real authenticated data only; honest empty states; no `Math.random` business metrics.
- Every user API: Clerk `auth()` + Prisma ownership scoped by `userId` + clear errors.
- No client-side secrets/tokens/cards; billing via LemonSqueezy checkout + signed webhooks.
- Credits: atomic conditional `updateMany`; correct pool (`aiCredits` vs `agnesCredits`).
- Never broaden scope silently — new work goes back to the spec as a follow-up.
- Never print `.env` values; reference secrets by env-var name only.

## Finish

- Run `npx tsc --noEmit`; run `npm run build` for production-surface changes.
- Update spec **Status** (In Progress → Shipped) and `specs/INDEX.md`.
- If a durable decision was made, run `/specplus-adr`. Record the work with `/specplus-phr`.
- Report: what changed, what was verified, remaining risk, and commit/push status.
