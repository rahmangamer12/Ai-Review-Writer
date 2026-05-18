# Spec-Driven Development For AutoReview AI

This folder is the home for product and engineering specs. Use it before building non-trivial features.

## Why Specs

Specs prevent the app from drifting into demo behavior. Every important feature should define the user goal, real data source, security requirements, UI states, and acceptance criteria before code changes.

## When To Write A Spec

Write or update a spec for:

- New pages or major UI flows
- API routes
- Database model changes
- OAuth/platform integration changes
- Billing/subscription changes
- AI behavior changes
- Chrome extension behavior changes
- Security/privacy-sensitive work
- Refactors that change behavior

Tiny copy/style fixes do not need a full spec, but still need clear verification.

## File Naming

Use this format:

```text
specs/YYYY-MM-DD-feature-name.md
```

Example:

```text
specs/2026-05-18-real-platform-sync.md
```

## Spec Template

```md
# Spec: Feature Name

## Status

Draft | Approved | In Progress | Shipped

## Owner

## Problem

What user/business problem are we solving?

## Goal

What should be true after this ships?

## Non-Goals

What are we intentionally not doing?

## User Stories

- As a user, I want ...

## Acceptance Criteria

- Given ...
- When ...
- Then ...

## Data Source Of Truth

- Prisma model:
- Clerk data:
- External provider:
- Client-only preference:

## API Contract

Routes, methods, request body, response body, auth, rate limit, and errors.

## UI States

- Loading
- Empty
- Success
- Error
- Mobile
- Desktop

## Security And Privacy

- Auth:
- Ownership:
- Secrets:
- Payment data:
- PII:

## Performance

Expected latency, caching, pagination, and heavy operations.

## Error Handling

How the app behaves when provider/API/database/AI fails.

## Test Plan

- Typecheck:
- Build:
- Manual checks:
- Automated tests:

## Rollout

Environment variables, migrations, Vercel settings, provider dashboard changes.

## Open Questions

```

## Definition Of Ready

- Goal is clear.
- Real data source is known.
- Acceptance criteria are testable.
- Security/privacy concerns are listed.
- Required environment variables are known.

## Definition Of Done

- Implementation matches the spec.
- TypeScript passes.
- Production build passes for release-level changes.
- No fake/demo data is introduced.
- Empty states are honest.
- User data is authenticated and scoped.
- Final response includes verification and push status.
