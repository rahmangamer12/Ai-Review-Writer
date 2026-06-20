# BLOCKERS.md — Items Only You Can Resolve

**Last Updated:** 2026-06-20

---

## 🔴 Critical (Must Fix Before Deploy)

### B1: Fix DATABASE_URL
- **Error:** `FATAL: (ENOTFOUND) tenant/user postgres.vwtcudgyojqqzuxikoqw not found`
- **Why:** Your old project was deleted. New project URL is different.
- **What you must do:**
  1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
  2. Select your new project
  3. Go to **Settings** → **Database** → **Connection String**
  4. Copy the **Direct Connection** URL
  5. Update `.env` with the correct URL
  6. Run: `npx prisma migrate deploy`

### B2: Set Environment Variables in Vercel Dashboard
- **What's blocked:** Production deployment
- **Why:** These env vars must be set in Vercel before deploy

**Copy this list to Vercel Dashboard → Settings → Environment Variables:**

| Variable Name | Description | Required |
|--------------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `DIRECT_URL` | Direct DB connection (for Prisma) | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk backend key | ✅ Yes |
| `LONGCAT_AI_API_KEY` | AI provider key | ✅ Yes |
| `ENCRYPTION_KEY` | 64-char hex encryption key | ✅ Yes |
| `SCHEDULER_SECRET` | Cron job secret | ✅ Yes |
| `ADMIN_KEY` | Admin access key | ✅ Yes |
| `LEMONSQUEEZY_API_KEY` | Payment API key | Optional |
| `LEMONSQUEEZY_STORE_ID` | Payment store ID | Optional |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signing secret | Optional |
| `LEMONSQUEEZY_VARIANT_STARTER` | Starter plan variant ID | Optional |
| `LEMONSQUEEZY_VARIANT_GROWTH` | Growth plan variant ID | Optional |
| `LEMONSQUEEZY_VARIANT_BUSINESS` | Business plan variant ID | Optional |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL | Optional |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | Optional |
| `RESEND_API_KEY` | Email API key | Optional |
| `RESEND_FROM_EMAIL` | Email sender | Optional |
| `SENTRY_DSN` | Sentry error tracking | Optional |
| `ENABLE_SENTRY` | Enable Sentry (true/false) | Optional |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Optional |
| `SENTRY_ORG` | Sentry org name | Optional |
| `SENTRY_PROJECT` | Sentry project name | Optional |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret | Optional |
| `NEXT_PUBLIC_APP_URL` | App URL | Optional |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Optional |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook app ID | Optional |
| `FACEBOOK_APP_SECRET` | Facebook app secret | Optional |
| `CHROME_EXTENSION_ID` | Chrome extension ID | Optional |
| `CHROME_EXTENSION_SHARED_SECRET` | Chrome extension secret | Optional |
| `REVIEWS_WEBHOOK_SECRET` | Reviews webhook secret | Optional |

---

## 🔴 SECURITY — Rotate exposed Clerk dev key (added autonomous run 2)

### B0: `.clerk/.tmp/keyless.json` (Clerk `sk_test_…` secret) was committed to git
- **What I did:** removed `.clerk/` from tracking and added it to `.gitignore`, so it
  will not be committed again. The secret is now out of the working index.
- **Still required from you:** the key remains in **git history**. Because purging
  history needs a force-push (a destructive op I will not run autonomously):
  1. Rotate the Clerk dev/test keys in the Clerk Dashboard (treat the leaked
     `sk_test_…` as compromised).
  2. Optionally scrub history with `git filter-repo`/BFG before publishing the repo.
- These are **dev/test** keys (not `sk_live_`), so production is not directly exposed,
  but rotate anyway as good hygiene.

## 🔴 New — Cron Authentication & Plan (added autonomous run 2)

### B5: Set `CRON_SECRET` in Vercel = your `SCHEDULER_SECRET`
- **Why:** Vercel Cron sends `Authorization: Bearer $CRON_SECRET` to scheduled
  requests. Our cron routes (`/api/scheduler`, `/api/cron/reset-credits`,
  `/api/agentic/triage`, `/api/cron/weekly-insights`) authorize against
  `SCHEDULER_SECRET`. If `CRON_SECRET` ≠ `SCHEDULER_SECRET`, every cron returns 401.
- **Action:** In Vercel → Settings → Environment Variables, set `CRON_SECRET` to the
  exact same value as `SCHEDULER_SECRET`.

### B6: Vercel plan must allow 4 cron jobs
- `vercel.json` now defines **4** crons. Vercel **Hobby allows only 2**; **Pro allows 40**.
- **Action:** Use a Pro plan, or remove crons you don't need from `vercel.json`.

## 🟢 Nice-to-Have (Can Add Later)

### B3: Verify LemonSqueezy Store
- Complete store verification in LemonSqueezy dashboard
- Also set `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`,
  `LEMONSQUEEZY_WEBHOOK_SECRET`, and `LEMONSQUEEZY_VARIANT_{STARTER,GROWTH,BUSINESS}`.
  Until set, checkout shows a maintenance state (by design).

### B4: Chrome Extension
- Publish extension to Chrome Web Store

### B7: (Optional) Premium AI escalation
- The AI provider abstraction (`src/lib/ai/provider.ts`) escalates hard/negative
  reviews when `PREMIUM_AI_API_KEY` is set. Until then it logs intent and uses LongCat.
  Set `PREMIUM_AI_API_KEY` only if you want premium routing (wiring to the premium
  model itself is a future task).

## ⏸️ Deferred Agentic Sub-Phases (not blockers — scoped for later)

- **3.4 Review-Fetcher (scheduled platform ingest):** depends on working Google/Meta
  OAuth + API access, which is gated by provider verification (see Google/Meta notes).
  Manual + webhook review ingestion works today; automated polling deferred until
  platform credentials are verified.
- **3.5 Brand-Voice RAG:** requires an embeddings/vector store; deferred to keep the
  core agentic loop shipping. The provider seam is ready to accept brand-voice context.

---

## ✅ Resolved Blockers Log

| Date | Blocker | Resolution |
|------|---------|------------|
| 2026-06-20 | Credits not deducted on AI reply | Fixed: Added atomic credit deduction |
| 2026-06-20 | Webhook credit amounts inconsistent | Fixed: Aligned with CreditsManager |
| 2026-06-20 | Chat credit race condition | Fixed: Atomic transaction |
| 2026-06-20 | No audit log | Fixed: Added CreditUsage model |
| 2026-06-20 | UI components missing | Fixed: Recreated all UI components |
| 2026-06-20 | Lint errors | Fixed: All lint errors resolved |
| 2026-06-20 | Build failing | Fixed: Build passes |

---

**When you resolve a blocker:**
1. Test the affected flow manually
2. Tell me "done" and I'll continue
