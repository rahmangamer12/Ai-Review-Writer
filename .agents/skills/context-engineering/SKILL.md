---
description: Minimize token usage and load only the context needed for an AutoReview AI task.
---

# Context Engineering For AutoReview AI

Use this skill before deep code work, large analysis, or any spec-driven feature.

## Goal

Produce better results with less context. Do not read the whole project unless the task genuinely requires it.

## Workflow

1. Read `AGENTS.md`.
2. If the task is non-trivial, read `.specify/memory/constitution.md`.
3. Search before reading:
   - `rg --files`
   - `rg -n "keyword" src chrome-extension prisma`
4. Open only the files directly needed for the acceptance criteria.
5. Keep a short working summary:
   - Known
   - Files read
   - Decision
   - Next
6. Verify with targeted commands.

## Hard Limits

- Avoid `.next`, `node_modules`, lockfiles, generated assets, and full build logs.
- Do not paste `.env` values.
- Do not read large files fully when a line range is enough.
- Do not carry unrelated context between tasks.

## AutoReview AI Source Of Truth

- Production data: Prisma/PostgreSQL.
- Auth: Clerk.
- Billing: LemonSqueezy checkout.
- Profile: `src/app/api/user/profile/route.ts`.
- Reviews: Prisma `Review`.
- Specs: `specs/`.

## Output

When done, report:

- Context loaded
- Context intentionally skipped
- Risk or missing info
- Next implementation step
