# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]`  
**Date**: [DATE]  
**Spec**: `specs/[feature]/spec.md`  
**Input**: Feature specification and acceptance criteria

## Summary

[One paragraph: what will change, why, and the safest technical approach.]

## Context Budget

**Files already read**:

- [path] - [why it mattered]

**Files to read next**:

- [path] - [specific question]

**Do not read unless blocked**:

- `.next/`
- `node_modules/`
- `package-lock.json`
- `tsconfig.tsbuildinfo`
- `.env*` values

## Technical Context

**Framework**: Next.js 16 App Router, React 19, TypeScript  
**UI**: Tailwind CSS, Framer Motion, lucide-react  
**Auth**: Clerk  
**Database**: PostgreSQL via Prisma  
**AI**: LongCat/provider APIs through server routes  
**Payments**: LemonSqueezy checkout/webhooks  
**Extension**: Chrome Manifest V3 where applicable  
**Testing**: `npx tsc --noEmit`, `npm run build`, focused manual checks  
**Target**: Vercel production plus responsive desktop/mobile UI

## Constitution Check

Must pass before implementation:

- [ ] Spec exists and acceptance criteria are testable.
- [ ] Real data source is named.
- [ ] User ownership/auth is handled for user data.
- [ ] No raw secrets/payment/OAuth tokens in client storage.
- [ ] No fake/demo/random production metrics.
- [ ] UI has loading, empty, success, and error states.
- [ ] Context loaded is minimal and listed above.

## Data Source Of Truth

| Data | Source | Notes |
|------|--------|-------|
| User identity | Clerk | Never trust client user ID |
| App user/credits/plan | Prisma `User` | Sync from trusted webhook/API |
| Reviews | Prisma `Review` | Scope by `userId` |
| Platforms | Prisma `ConnectedPlatform` | Encrypt sensitive credentials |
| Billing | LemonSqueezy | No local card storage |
| UI preferences | localStorage allowed | Non-sensitive only |

## Project Structure For This Feature

```text
src/app/[page-or-api]/
src/components/[component]/
src/lib/[domain]/
prisma/schema.prisma
chrome-extension/[area]
specs/[feature]/
```

Replace with exact paths before coding.

## Phase 0 - Research

- [ ] Existing implementation reviewed with targeted search.
- [ ] Provider/API docs checked if behavior is external or unstable.
- [ ] Legacy Supabase/localStorage areas identified if touched.
- [ ] Risks and decisions recorded in `research.md` if needed.

## Phase 1 - Design

- [ ] API contract written.
- [ ] Data model impact documented.
- [ ] UI states listed.
- [ ] Security and privacy notes written.
- [ ] Migration/rollout notes written.

## Phase 2 - Tasks

Create `tasks.md` with independently testable tasks:

1. Backend/data contract
2. UI state and interaction
3. Error/empty states
4. Verification
5. Docs/spec updates

## Verification Plan

```powershell
npx tsc --noEmit
npm run build
git diff --check
```

Manual checks:

- [ ] Desktop
- [ ] Mobile
- [ ] Authenticated user
- [ ] Empty state
- [ ] Error state

## Rollout Notes

- Env vars:
- Vercel settings:
- Provider dashboard changes:
- Migration:
- Backout plan:
