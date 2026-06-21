---
name: speckit-tasks
description: Break an AutoReview AI plan into small, dependency-ordered, independently testable tasks. Use after /speckit-plan. Produces specs/NNN-feature/tasks.md with checkboxes mapped to acceptance criteria.
---

# /speckit-tasks — Slice the Plan

Convert `specs/NNN-feature/plan.md` into an ordered task list small enough to verify each step.

## Read first

`specs/NNN-feature/spec.md`, `plan.md`, and `.specify/templates/tasks-template.md`.

## Produce `specs/NNN-feature/tasks.md`

- One checkbox per task: `- [ ] T01 <verb> <file/area> — <result>`.
- Order by dependency (schema → lib → API → UI → wiring → tests → docs).
- Each task touches the fewest files possible and is independently verifiable.
- Tag the acceptance criterion each task satisfies, e.g. `(AC-2)`.
- Add a final verification task: `npx tsc --noEmit`, `npm run build` (if production surface),
  manual check, and update spec **Status**.
- Note any task that needs a provider-dashboard step (Clerk/Google/Meta/LemonSqueezy) or env var.

## Rules

- No task may introduce demo data, client-side secrets, or raw card forms.
- Database tasks must scope by `userId` and respect ownership.
- Keep tasks parallel-safe where possible; mark blockers explicitly.

## Done when

Every acceptance criterion is covered by at least one task and the order is buildable
top-to-bottom. Then suggest: run `/speckit-implement` for `specs/NNN-feature`.
