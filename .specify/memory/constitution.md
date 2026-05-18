# AutoReview AI Constitution

## Core Principles

### I. Spec-First Delivery

Every meaningful product change starts with a spec in `specs/`. A valid spec defines the user problem, real source of truth, acceptance criteria, API/data contract, security requirements, UI states, and verification plan. Code must not outrun the spec. If implementation discovers new behavior, update the spec before broadening scope.

### II. Real Data, No Demo Illusions

Production user surfaces must use real authenticated data. Profile, reviews, analytics, billing, and platform status cannot use fake rows, random metrics, local-only business state, or decorative activity. Empty states must be honest and actionable.

### III. Security And Privacy By Default

User-specific APIs require Clerk authentication and user ownership checks. Secrets, OAuth credentials, access tokens, card numbers, CVV, and raw payment details must never be stored in client storage or shipped to the browser. Use server-side validation, rate limits, CSRF protection for mutations, and encrypted credential handling where applicable.

### IV. Context-Efficient Engineering

AI assistants must minimize context use. Start with a narrow file map, read only relevant files, summarize findings, and avoid dumping large files into prompts. Prefer specs, indexes, and targeted `rg` queries over broad file reads. Keep implementation scoped to the acceptance criteria.

### V. Premium, Accessible Product UX

The UI must be responsive, readable, and useful on mobile and desktop. Use `lucide-react` icons for controls, tabs, platform cards, and compact actions. Avoid emoji and fake visual filler in app UI. Text must not overflow. Empty states should guide the user to the next real action.

## Technical Standards

- Framework: Next.js 16 App Router, React 19, TypeScript.
- Data source of truth: Prisma/PostgreSQL for production app data.
- Auth: Clerk for identity and user ownership.
- Billing: LemonSqueezy checkout and signed webhooks.
- AI: LongCat/provider APIs through server-side routes.
- Styling: Tailwind CSS, Framer Motion, lucide-react.
- Extension: Chrome Manifest V3.
- Verification: `npx tsc --noEmit` for code changes; `npm run build` for production-surface changes.

## Spec Workflow

1. Create or update `specs/[feature]/spec.md`.
2. Run planning with `.specify/templates/plan-template.md`.
3. Document research, data model, contracts, quickstart, and tasks as needed.
4. Implement in small slices.
5. Verify acceptance criteria.
6. Report changed files, verification, and remaining risks.

## Context Engineering Rules

- Do not read whole directories when `rg` can identify relevant files.
- Prefer `rg --files`, `rg -n`, and focused `Get-Content` ranges.
- Keep a compact working summary in the spec or plan instead of repeatedly rereading files.
- Only load files that are on the dependency path for the current acceptance criteria.
- Treat generated folders (`.next`, `node_modules`, build output) as off-limits unless debugging build output.
- Never include `.env` values in prompts or final responses.

## Governance

This constitution supersedes ad hoc coding preferences. Amendments require updating this file and any impacted templates or skills. Features that violate a principle must document the violation, justification, and follow-up migration plan in the feature plan.

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
