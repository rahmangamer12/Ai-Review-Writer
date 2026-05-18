# AGENTS.md - AutoReview AI Context Guide

This file is the first context file for AI coding agents. Keep it short. Load deeper files only when needed.

## Project Summary

AutoReview AI is a Next.js SaaS app for importing, analyzing, managing, and replying to business reviews. The app includes a Chrome extension, AI chat/reply generation, Clerk auth, Prisma/PostgreSQL data, LemonSqueezy billing, and Vercel deployment.

## Must-Follow Rules

- Use spec-driven development for non-trivial work.
- Use real data, not demo rows or random metrics.
- Use Prisma/PostgreSQL for production user data.
- Use Clerk auth and user ownership checks for user-specific APIs.
- Do not store card numbers, CVV, OAuth secrets, access tokens, or platform secrets in localStorage.
- Payment details are managed by LemonSqueezy checkout.
- Use lucide-react icons instead of emoji/text placeholders in product UI.
- Run `npx tsc --noEmit` for code changes.
- Run `npm run build` for release-level changes.

## Spec Kit Workflow

Official Spec Kit CLI is installed with:

```powershell
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.8.7
```

This repo contains:

- `.specify/memory/constitution.md`
- `.specify/templates/`
- `.specify/scripts/powershell/`
- `.agents/skills/speckit-*`
- `specs/README.md`

Recommended flow:

1. Create or update a spec in `specs/[feature]/spec.md`.
2. Use `speckit-specify` skill to refine requirements.
3. Use `speckit-plan` skill to produce implementation plan.
4. Use `speckit-tasks` skill to create task list.
5. Use `speckit-implement` skill to implement.
6. Verify with typecheck/build.

## Token Optimization And Context Engineering

Use less context deliberately:

- Start with `rg --files` and `rg -n`, not broad file reads.
- Read focused line ranges only.
- Keep a short working summary instead of rereading the same files.
- Load specs and contracts before source files.
- Load only the modules directly affected by the acceptance criteria.
- Avoid reading `.next`, `node_modules`, large lockfiles, and generated output.
- Prefer structured summaries in `specs/[feature]/research.md` or `plan.md`.

## High-Value File Map

- `src/app/reviews/page.tsx`: review management UI
- `src/app/api/reviews/list/route.ts`: real review list
- `src/app/api/reviews/generate-reply/route.ts`: AI reply generation
- `src/app/profile/page.tsx`: real profile UI
- `src/app/api/user/profile/route.ts`: real profile API
- `src/app/settings/page.tsx`: settings, integrations, billing UI
- `src/components/PaymentMethodManager.tsx`: LemonSqueezy billing guidance
- `src/app/api/checkout/route.ts`: checkout creation
- `src/app/api/webhooks/lemonsqueezy/route.ts`: billing webhook
- `src/lib/db.ts`: Prisma client
- `prisma/schema.prisma`: database schema
- `chrome-extension/`: extension source

## Known Legacy Areas

Treat these carefully and migrate with a spec before extending:

- `src/lib/auto-reply/db-backed-scheduler.ts`
- `src/lib/integrations/reviewManager.ts`
- `src/lib/supabase.ts`
- `src/lib/supabase-client.ts`
- client-side parts of `src/lib/platformIntegrations.ts`

## Verification Commands

```powershell
npx tsc --noEmit
npm run build
git diff --check
git status --short --branch
```

## Response Style

When reporting back, keep it concise:

- What changed
- What was verified
- What remains
- Commit/push status
