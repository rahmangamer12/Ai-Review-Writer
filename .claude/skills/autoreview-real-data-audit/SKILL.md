---
name: autoreview-real-data-audit
description: Audit AutoReview AI for fake/demo/local-only data and migrate user-facing behavior toward real Clerk, Prisma, provider, and LemonSqueezy sources.
paths: "src/**,prisma/**,chrome-extension/**"
---

# AutoReview Real Data Audit

Use this skill when reviewing pages, APIs, analytics, profile, billing, settings, integrations, or extension behavior for production readiness.

## Steps

1. Read `AGENTS.md` and `.specify/memory/constitution.md`.
2. Search first:
   - `rg -n "demo|sample|fake|dummy|mock|placeholder|Math.random|localStorage|supabase" src chrome-extension prisma`
   - `rg -n "cardNumber|cvv|access_token|clientSecret|apiKey|secret" src chrome-extension`
3. Classify each finding:
   - Production bug
   - Development-only acceptable
   - Documentation/example only
   - Legacy migration candidate
4. For production bugs, identify the real source of truth:
   - Clerk for identity
   - Prisma/PostgreSQL for app data
   - LemonSqueezy for billing
   - Provider OAuth/API for platform data
5. Fix only scoped issues or create a spec when the migration is broad.

## Output

- Real-data issues found
- Files changed or migration plan
- Verification commands run
- Any remaining legacy risk

## Guardrails

- Never print `.env` values.
- Never store card data, OAuth tokens, or provider secrets in localStorage.
- Do not add fake rows to improve UI appearance.
