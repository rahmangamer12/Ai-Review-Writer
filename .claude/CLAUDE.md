# CLAUDE.md - AutoReview AI God-Tier Engineering Guide

This file is the operating manual for AI assistants working on AutoReview AI. It is intentionally direct, production-focused, and spec-driven.

Last updated: 2026-05-18
Primary domain: https://ai-review-writer.vercel.app

## Mission

AutoReview AI is a SaaS application for businesses that need to import, analyze, manage, and reply to customer reviews across platforms. The product must feel real, secure, fast, and commercially credible. No fake dashboards, fake cards, fake profile stats, or demo activity should appear in user-facing production flows.

## Current Stack

- App framework: Next.js 16 App Router, React 19, TypeScript
- Styling: Tailwind CSS, Framer Motion, lucide-react
- Auth: Clerk
- Database: PostgreSQL through Prisma
- AI: LongCat AI and configured provider routes
- Payments: LemonSqueezy checkout and webhooks
- Email: Resend where configured
- Deployment: Vercel
- Extension: Chrome extension Manifest V3
- Optional monitoring: Sentry

## Non-Negotiable Product Principles

1. Real data wins.
   - Use Prisma and authenticated APIs for production user data.
   - Empty states must say what is actually missing.
   - Never use random numbers for business metrics.

2. Security first.
   - Every user-specific API route must check Clerk auth.
   - Enforce user ownership in Prisma queries.
   - Do not expose secrets to the client.
   - Do not store card numbers, CVV, OAuth secrets, or tokens in localStorage.
   - Payment methods belong to LemonSqueezy checkout, not custom client forms.

3. Spec before code.
   - Any non-trivial feature must start with a spec.
   - If no spec exists, create or update one in `specs/`.
   - Implementation must map back to acceptance criteria.

4. UI should feel premium but useful.
   - Use lucide icons for controls and compact labels.
   - Avoid emoji in product UI unless a specific brand decision says otherwise.
   - Mobile layouts must be usable without overlap.
   - Avoid fake marketing cards where a working tool is expected.

5. Keep the codebase honest.
   - If a feature is not wired to production data, label it as coming soon or implement the real backend.
   - Do not hide broken flows behind optimistic UI.

## Spec-Driven Development Workflow

Use this workflow for features, refactors, integrations, billing, security, profile, reviews, analytics, platform connections, AI behavior, and extension changes.

### Installed Spec Kit Tooling

GitHub Spec Kit is installed locally through `uv`:

```powershell
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.8.7
```

SpecKit Plus is also installed locally:

```powershell
uv tool install specifyplus
```

Use `specifyplus` on PowerShell. The short `sp` command conflicts with PowerShell's built-in `Set-ItemProperty` alias.

The repo contains a checked-in Spec Kit scaffold:

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `.specify/memory/constitutionplus.md`
- `.specify/memory/command-rules.md`
- `.specify/templates/`
- `.specify/scripts/powershell/`
- `.agents/skills/speckit-*`
- `.agents/skills/specplus-*`
- `.agents/skills/context-engineering`
- `.agents/skills/autoreview-real-data`
- `specs/README.md`
- `specs/context-engineering.md`

If the `specify init` command hangs on Windows, use the checked-in scaffold and skills directly. The templates are already installed.

SpecKit Plus adds:

- ADR workflow for durable architecture decisions.
- Prompt History Records for meaningful work traceability.
- Reverse-engineering workflow before changing legacy behavior.
- Task-to-issue preparation when GitHub issue tracking is requested.

### Claude Project Skills

Project skills live in `.claude/skills/<skill-name>/SKILL.md`. Claude Code can load them automatically from their descriptions or the user can invoke them directly with `/skill-name`.

Installed project skills:

- `speckit-plus-autoreview`: umbrella spec-driven workflow (spec, plan, tasks, ADR, PHR, reverse-engineering).
- `speckit-specify`: write/update a feature spec at `specs/NNN-feature/spec.md` before coding.
- `speckit-plan`: turn an approved spec into `plan.md` (API, data, UI, security, verification).
- `speckit-tasks`: break a plan into dependency-ordered `tasks.md` checkboxes.
- `speckit-implement`: build the tasks in small verified slices with `tsc`/`build` checks.
- `specplus-adr`: record a durable architecture decision in `history/adr/`.
- `specplus-phr`: record a Prompt History Record in `history/prompts/[stage]/`.
- `autoreview-real-data-audit`: finds demo/fake/local-only behavior and maps it to real sources.
- `autoreview-security-review`: checks auth, ownership, billing, OAuth, secrets, and unsafe storage.
- `autoreview-ui-polish`: improves responsive SaaS UI with icons and honest states.
- `autoreview-extension-workflow`: Chrome extension review scraping and AI reply workflow.
- `autoreview-release-verify`: manual release verification before commit/push/deploy.

### Step 1: Discovery

Read the existing code before deciding. Identify:

- Affected pages
- Affected components
- API routes
- Database models
- Environment variables
- Auth and ownership requirements
- External provider limits
- Mobile behavior
- Empty and error states

### Step 2: Write Or Update A Spec

Specs live in `specs/`.

Minimum spec sections:

- Problem
- Goal
- Non-goals
- User stories
- Acceptance criteria
- Data model and source of truth
- API contract
- Security and privacy requirements
- UI states
- Error states
- Testing and verification
- Rollout notes

### Step 3: Implement Only The Spec

Do not broaden scope silently. If you discover an adjacent issue, add it to the spec as a follow-up unless it blocks the feature.

### Step 4: Verify

Required checks:

```bash
npx tsc --noEmit
```

Run this for production-surface changes:

```bash
npm run build
```

For focused behavior, also test the relevant API/page manually where practical.

### Step 5: Report

Final response should include:

- What changed
- What was verified
- Any remaining risk
- Commit/push status if applicable

## Definition Of Ready

A task is ready to implement when:

- User goal is understandable.
- Source of truth is identified.
- Acceptance criteria can be checked.
- Security and privacy implications are known.
- The difference between production behavior and temporary fallback is explicit.

## Definition Of Done

A task is done when:

- It works with real authenticated data.
- It has honest empty states.
- It does not introduce client-side secret/payment storage.
- TypeScript passes.
- Build passes for release-level work.
- UI is responsive enough for mobile and desktop.
- Changes are committed/pushed when requested and credentials allow it.

## Project Map

### App Pages

- `src/app/dashboard/page.tsx`: overview and analytics entry point
- `src/app/reviews/page.tsx`: review management
- `src/app/reviews/add/page.tsx`: manual review entry
- `src/app/analytics/page.tsx`: analytics
- `src/app/profile/page.tsx`: real profile, stats, activity, achievements
- `src/app/settings/page.tsx`: settings, billing, notifications, integrations
- `src/app/connect-platforms/page.tsx`: platform connection flows
- `src/app/chat/page.tsx`: Sarah AI chat
- `src/app/subscription/page.tsx`: plans and checkout
- `src/app/privacy/page.tsx`: privacy policy
- `src/app/terms/page.tsx`: terms
- `src/app/status/page.tsx`: API status
- `src/app/compliance/page.tsx`: compliance overview

### Key APIs

- `src/app/api/user/me/route.ts`: current user basics
- `src/app/api/user/profile/route.ts`: real profile DTO and profile save
- `src/app/api/user/profile/avatar/route.ts`: Clerk profile image upload
- `src/app/api/reviews/list/route.ts`: Prisma-backed review list
- `src/app/api/reviews/generate-reply/route.ts`: AI reply generation
- `src/app/api/platforms/**`: platform connections and sync
- `src/app/api/checkout/route.ts`: LemonSqueezy checkout
- `src/app/api/webhooks/lemonsqueezy/route.ts`: subscription webhooks
- `src/app/api/integrations/test-webhook/route.ts`: webhook test delivery

### Core Libraries

- `src/lib/db.ts`: Prisma client
- `src/lib/prisma.ts`: Prisma export
- `src/lib/longcatAI.ts`: AI integration
- `src/lib/platformIntegrations.ts`: platform config and legacy client-side connection utilities
- `src/lib/credits.ts`: credit plan logic
- `src/lib/csrfProtection.ts`: CSRF helpers
- `src/lib/ratelimit.ts`: rate limiting
- `src/lib/encryption.ts`: sensitive data encryption

### Chrome Extension

- `chrome-extension/manifest.json`
- `chrome-extension/content/scraper.js`
- `chrome-extension/content/styles.css`
- `chrome-extension/background/background.js`
- `chrome-extension/popup/popup.html`

## Current Production Truths

Profile:

- Real profile data comes from Clerk plus Prisma through `src/app/api/user/profile/route.ts`.
- Avatar upload uses Clerk profile image API.
- Profile stats must not use Supabase, Math.random, or localStorage.

Billing:

- The app must not collect raw card details.
- Use LemonSqueezy checkout and webhooks.
- Payment method UI should explain secure provider-managed checkout.

Reviews:

- Review data source should be Prisma `Review`.
- Manual/imported reviews must be user-owned.
- AI replies can be generated, edited, saved, and listed from real records.

Settings:

- Lightweight UI preferences can use localStorage.
- Anything security-sensitive or account-level must be server-backed.

Platform integrations:

- OAuth and credential flows need provider verification in production.
- Meta business verification limitations are product constraints, not frontend bugs.
- User-supplied credentials must not be stored in raw client storage for production.

## Known Legacy Areas To Treat Carefully

These areas may still contain older Supabase/localStorage patterns. Do not copy them into new production code without a migration spec.

- `src/lib/auto-reply/db-backed-scheduler.ts`
- `src/lib/integrations/reviewManager.ts`
- `src/lib/supabase.ts`
- `src/lib/supabase-client.ts`
- Some `src/lib/platformIntegrations.ts` client-side storage utilities
- Payment method storage was replaced with LemonSqueezy checkout guidance; do not reintroduce local card forms.

## API Route Standard

Use this pattern for user-specific route handlers:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const result = await prisma.user.update({
    where: { id: userId },
    data: { name: parsed.data.name },
  })

  return NextResponse.json({ success: true, result })
}
```

Requirements:

- Validate input.
- Authenticate with Clerk.
- Scope database access by `userId`.
- Return clear errors.
- Do not leak stack traces or secrets.

## Prisma Rules

- Use `src/lib/db.ts` or `src/lib/prisma.ts`.
- Prefer explicit `select` for API responses.
- Never trust a client-provided user ID.
- For review updates/deletes, include `userId` in the `where` logic or verify ownership before mutation.
- Do not perform broad destructive queries.

## AI Rules

- Review replies must be specific to the review text, rating, author, business context, and tone.
- If an AI provider fails, return a clear fallback/error.
- Template fallback is acceptable only when clearly marked as offline/error fallback.
- Do not pretend a template is real-time AI.
- For negative or sensitive reviews, prefer human review over auto-posting.

## Billing Rules

- Never collect card number, CVV, or bank credentials in app forms.
- Use LemonSqueezy checkout.
- If LemonSqueezy env vars are missing, show a clear maintenance/coming-soon state.
- Webhooks must validate signatures.
- Subscription changes must update Prisma user plan/credits through trusted webhook or server action.

## OAuth And Platform Rules

- Google OAuth errors can be caused by consent screen verification, app publishing state, test users, redirect URI mismatch, or sensitive scopes.
- Meta errors can be caused by app mode, business verification, page permissions, or missing approved permissions.
- Always distinguish provider verification problems from app code bugs.
- Keep redirect URIs using the production domain unless explicitly developing locally.

## UI Rules

- Use `lucide-react` icons for buttons, tabs, compact labels, and empty states.
- Avoid emoji in app UI.
- Keep cards to actual repeated items, modals, or framed tools.
- Mobile navigation must remain usable.
- Text must not overflow buttons/cards.
- Empty states should include the next real action.
- Do not add fake demo rows to make the page look populated.

## Chrome Extension Rules

- Keep DOM scraping defensive; review platforms change markup often.
- Do not duplicate AI reply buttons.
- Popup should support multiple detected reviews, search, and navigation.
- Use the production app URL unless the user explicitly requests local development.
- Extension must call backend APIs for AI generation instead of local templates.

## Environment Variables

Core required groups:

- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Database: `DATABASE_URL`
- App URL: `NEXT_PUBLIC_APP_URL`
- AI: `LONGCAT_AI_API_KEY`, optional configured model provider keys
- LemonSqueezy: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, variants, webhook secret
- Security: `ENCRYPTION_KEY`, `SCHEDULER_SECRET`, `ADMIN_KEY`
- Email: `RESEND_API_KEY` if email flows are enabled
- Sentry: optional

Never print real `.env` values in responses.

## Verification Playbook

Fast code check:

```bash
npx tsc --noEmit
```

Production check:

```bash
npm run build
```

Targeted scans:

```bash
rg -n "demo|sample|fake|dummy|Math.random|localStorage|supabase" src
rg -n "cardNumber|cvv|payment-methods|access_token|clientSecret" src
rg -n "TODO|FIXME|placeholder" src
```

Git hygiene:

```bash
git status --short --branch
git diff --check
```

## Spec Template

Use this for new files in `specs/`:

```md
# Spec: Feature Name

## Problem

## Goal

## Non-Goals

## Users And Stories

## Acceptance Criteria

- Given ...
- When ...
- Then ...

## Data Source Of Truth

## API Contract

## UI States

## Security And Privacy

## Performance

## Mobile Behavior

## Error Handling

## Test Plan

## Rollout
```

## Response Style For Future Assistants

- Be honest about what is real and what is not.
- Prefer fixing over proposing when the user asks for action.
- Answer in Roman Urdu when the user asks in Roman Urdu.
- Keep final summaries short but include verification and push status.
- If push fails due credentials, say exactly that and keep the commit local.

## North Star

AutoReview AI should feel like a real SaaS product a small business can trust with customer reviews, billing, profile data, and AI replies. Every change should move the product toward that standard.
