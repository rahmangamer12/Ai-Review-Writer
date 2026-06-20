# SUMMARY — Autonomous Engineering Run (2026-06-20)

**Branch:** `autonomous/phase-1-5` (NOT merged to `main` — left for your review).
**Build:** `npm run build` ✅ success · `npx tsc --noEmit` ✅ 0 errors · `vitest run` ✅ 34/34.
**Why a branch:** pushing straight to the `main` deploy branch while you were away (auto-deploying to production) was riskier than the rule "never break a working feature" allows. Review and merge when ready.

---

## The live blocker — found and fixed

Your symptom was "AI does not respond / credits don't work." The prior session's docs claimed this was fixed, but the **live database had 0 users** and there was **no just-in-time user provisioning**. Every signed-in Clerk user had no Prisma row → the credit check returned `user_not_found` → the AI route returned 401 **before** ever calling LongCat. Root cause C1. Fixed in Phase 1.1. I also found and fixed a real concurrency double-spend bug (C2) the "atomic" comment hid.

---

## What changed, by phase

### Phase 1 — AI + credit system (the blocker)
- **1.1 JIT provisioning** — `src/lib/requireUser.ts` (`ensureUserProvisioned`) creates the Prisma user on first authenticated request; wired into `generate-reply`. No more `user_not_found`.
- **1.2 Atomic deduction** — `CreditsManager.useCredits` rewritten to a single conditional `updateMany` (`WHERE aiCredits >= n … decrement n`). `grantCredits` → atomic `increment`. **Verified:** `scripts/test-credit-concurrency.mjs` → 60 parallel deductions on 20 credits = exactly 20, balance 0, never negative.
- **1.3 Refund-on-failure** — `refundCredits`; `generate-reply` refunds automatically if LongCat fails after deduction.
- **1.4 Credit model** — unified to **1 credit = 1 AI response**; converted Sarah chat off the "10 prompts" model; neutralized `promptCount` (kept column — db-push repo can't provide a down migration); removed "X/10 prompts" UI; fixed wrong plan names in Sarah's prompt.
- **1.5 Error states** — reviews page maps 401/402/429/502/503 to distinct, honest messages.

### Phase 2 — Payments integrity & entitlements
- **2.3 Honest pricing (done first, per your instruction)** — `src/lib/plans.ts` is now the single source of truth (price, credits, platform cap, marketing features w/ `available` flag, enforced capabilities). `CreditsManager` + new `src/lib/entitlements.ts` derive from it (kills the old 3-way drift). Pricing page now shows **"Coming soon"** for Slack notifications, API access, team members, custom integrations; **"Unlimited platforms" → real caps**. **Platform-connection cap is now enforced** (was advertised, never enforced) on `platforms` PUT + Google/Facebook OAuth callbacks.
- **2.1 Idempotent webhooks** — new `WebhookEvent` table; LemonSqueezy webhook claims `provider:event:id` atomically (works without Redis); processing failure rolls back the claim for safe retry. Payment grant made atomic. **Verified:** `scripts/test-webhook-idempotency.mjs` → 4 replays = 1 grant.
- **2.2 Monthly reset** — `creditsRenewAt` field + secured `GET /api/cron/reset-credits` + `vercel.json` cron. Makes "X / month" truthful. **Verified** in the same script (reset → allotment).
- **2.4 Hardening** — LemonSqueezy verification **fails closed in production**.

### Phase 3 — Agentic system
- **3.1 Provider abstraction** — `src/lib/ai/provider.ts`: LongCat default, premium-escalation seam (`PREMIUM_AI_API_KEY`), payload/token guardrails at the gateway. Wired into `generate-reply` + agentic; negative/low-star reviews flag escalation.
- **3.2 Auto-Reply Agent** — already drafts-only (never auto-posts publicly); now routed through the gateway. Human approval preserved; max 5/run; audit-logged.
- **3.3 Triage** — hourly cron creates **de-duplicated damage-control notifications**; wired in `vercel.json`.
- **3.6 Weekly insights** — Monday 09:00 cron wired.
- **3.4 Review-Fetcher** & **3.5 Brand-Voice RAG** — **deferred** (see BLOCKERS): 3.4 needs verified Google/Meta OAuth; 3.5 needs a vector store. Provider seam is ready for brand voice.

### Phase 4 — Premium UI rebuild — ⏸️ STAGED (intentionally)
A full "premium standard" redesign needs visual iteration and risks breaking working pages — doing it blind in an autonomous batch conflicts with "never break a working feature." Delivered safely: honest pricing page redesign, cleaned Navigation credits UI, confirmed `prefers-reduced-motion` baseline. Remaining (design tokens, landing/dashboard rebuild, Three.js bundle optimization, full WCAG 2.2 AA audit) is documented as a supervised follow-up. **No working page was degraded.**

### Phase 5 — Hardening & tests
- **5.6** New vitest tests lock the truthful-pricing invariants + gateway guardrails. **Full suite 34/34 pass.** Plus two real-DB verification scripts.
- **Security fix** — a committed Clerk `sk_test_` key (`.clerk/.tmp/keyless.json`) was untracked + `.clerk/` added to `.gitignore`. **Rotate it (B0).**
- Verified Clerk middleware auth coverage + `userId`-scoped queries; Sentry, Upstash rate-limit, CSRF, AES-256-GCM already present.

---

## How I verified (per phase)
| Check | Result |
|------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` (Vercel's build) | ✅ success, 57 pages |
| `npx vitest run` | ✅ 34/34 |
| Credit concurrency (real DB) | ✅ 60 parallel → exactly 20, never negative |
| Webhook replay (real DB) | ✅ 4 replays → 1 grant; monthly reset → allotment |
| Secret scan | ✅ no `.env`/keys tracked (after `.clerk/` fix) |
| ESLint standalone | ⚠️ blocked by corrupted `node_modules/has-symbols` (env rot) — fix via clean reinstall |

---

## ⚠️ Items only YOU can resolve (full detail in BLOCKERS.md)
- **B0 (security):** rotate the leaked Clerk `sk_test_` key; optionally scrub git history (needs force-push).
- **B5:** set `CRON_SECRET` in Vercel = your `SCHEDULER_SECRET` (else all 4 crons 401).
- **B6:** Vercel **Pro** plan (4 cron jobs; Hobby allows only 2) — or trim `vercel.json`.
- **B3:** LemonSqueezy store verification + set `LEMONSQUEEZY_*` envs (checkout shows maintenance until then — by design).
- **B7 (optional):** `PREMIUM_AI_API_KEY` to enable premium AI escalation.
- **Deferred:** 3.4 Review-Fetcher (needs Google/Meta OAuth verification), 3.5 Brand-Voice RAG, Phase 4 visual rebuild.

---

## Env var NAMES to set in Vercel
**Required:** `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `LONGCAT_AI_API_KEY`, `ENCRYPTION_KEY`, `SCHEDULER_SECRET`, **`CRON_SECRET`** (new — set equal to `SCHEDULER_SECRET`), `ADMIN_KEY`, `NEXT_PUBLIC_APP_URL`

**Payments (when store verified):** `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `LEMONSQUEEZY_VARIANT_STARTER`, `LEMONSQUEEZY_VARIANT_GROWTH`, `LEMONSQUEEZY_VARIANT_BUSINESS`

**Optional:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SENTRY_DSN`, `ENABLE_SENTRY`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `CHROME_EXTENSION_ID`, `CHROME_EXTENSION_SHARED_SECRET`, `REVIEWS_WEBHOOK_SECRET`, `DATABASE_POOL_SIZE`, **`PREMIUM_AI_API_KEY`** (new, optional)

---

## New DB schema (already pushed to your Supabase via `prisma db push`)
- `WebhookEvent` table (idempotency ledger) — additive.
- `User.creditsRenewAt` (monthly reset anchor) — additive, nullable.
- `User.promptCount` marked DEPRECATED (retained, unused).

## Commits on this branch
`Phase 1` → `Phase 2` → `Phase 3` → `Phase 5` (each self-verified). Phase 4 intentionally staged.
