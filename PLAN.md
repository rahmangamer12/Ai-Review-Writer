# AutoReview AI — Phase 0 Audit & Plan

**Audit Date:** 2026-06-20
**Auditor:** Senior Full-Stack Engineer (Autonomous Session)

---

## A. Repo Map

### Directory Structure
```
autoreview-ai/
├── src/
│   ├── app/                    # Next.js 16 App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── agentic/reviews/    # Agentic review processing
│   │   │   ├── chat/               # AI chat streaming
│   │   │   ├── checkout/           # LemonSqueezy checkout
│   │   │   ├── data-hub/           # Dashboard analytics
│   │   │   ├── platforms/          # Platform connections
│   │   │   ├── reviews/            # Review CRUD + AI reply
│   │   │   ├── user/               # User profile/me
│   │   │   └── webhooks/lemonsqueezy/ # Payment webhooks
│   │   ├── chat/page.tsx           # Sarah AI chat UI
│   │   ├── dashboard/page.tsx      # Main dashboard
│   │   ├── profile/page.tsx        # User profile
│   │   ├── subscription/page.tsx   # Pricing/plans
│   │   ├── reviews/page.tsx        # Review management
│   │   └── settings/page.tsx       # Settings
│   ├── components/
│   │   ├── dashboard/              # Dashboard tabs
│   │   ├── chat-internal/          # Chat components
│   │   └── ui/                     # Shared UI (Toast, etc.)
│   ├── lib/
│   │   ├── longcatAI.ts            # LongCat AI service
│   │   ├── credits.ts              # CreditsManager class
│   │   ├── lemonsqueezy.ts         # Payment integration
│   │   ├── ratelimit.ts            # Rate limiting (Upstash)
│   │   ├── csrfProtection.ts       # CSRF validation
│   │   ├── userAccount.ts          # User sync on login
│   │   ├── db.ts                   # Prisma client
│   │   └── email.ts                # Resend emails
│   └── middleware.ts               # [MISSING - no global middleware]
├── prisma/
│   └── schema.prisma               # Database schema
├── next.config.ts                  # Next.js + Sentry config
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

### Database Tables (Prisma)

| Model | Key Fields | Relationships |
|-------|-----------|---------------|
| User | id, email, name, planType, aiCredits, promptCount, maxPlatforms | 1:N reviews, platforms, chatSessions, feedbacks |
| ConnectedPlatform | id, userId, platformType, status, credentials | N:1 User, 1:N Review |
| Review | id, platformId, userId, authorName, content, rating, sentimentLabel, status, aiReplyText, sourceDate | N:1 User, N:1 ConnectedPlatform |
| ChatSession | id, userId, title | N:1 User, 1:N ChatMessage |
| ChatMessage | id, sessionId, role, content | N:1 ChatSession |
| Notification | id, userId, title, message, type, read | N:1 User |
| Feedback | id, userId?, rating, category, message, email, status | N:1 User (optional) |

### API Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| /api/user/me | GET | Clerk | Current user info + credits |
| /api/user/profile | GET/PATCH | Clerk | Profile CRUD |
| /api/reviews/list | GET | Clerk | List user's reviews |
| /api/reviews/generate-reply | POST | Clerk/Extension | Generate/save AI reply |
| /api/data-hub | GET | Clerk | Dashboard analytics |
| |api/agentic/reviews | POST | Clerk | Batch AI processing |
| /api/chat | POST | Clerk | Streaming chat |
| /api/checkout | POST | Clerk | Create LemonSqueezy checkout |
| /api/webhooks/lemonsqueezy | POST | Signature | Payment webhooks |

### External Integrations
- **Clerk**: Authentication (JWT tokens, session management)
- **LongCat AI**: Primary LLM (OpenAI-compatible API at api.longcat.chat)
- **LemonSqueezy**: Payments (checkout + webhooks, store verification pending)
- **Supabase**: PostgreSQL via Prisma (system of record)
- **Upstash Redis**: Rate limiting + webhook idempotency
- **Sentry**: Error monitoring (source maps opt-in)
- **Resend**: Transactional emails

---

## B. End-to-End Flow

### Happy Path: Signup → Subscribe → Credits → AI Reply → Deduction

```
1. SIGNUP (Clerk)
   User signs up via Clerk → Clerk creates user with JWT
   ↓
2. ACCOUNT SYNC (ensureUserAccount)
   App calls /api/user/me → ensureUserAccount() creates User in Prisma
   Default: planType='free', aiCredits=20, promptCount=0, maxPlatforms=1
   ✓ WORKS
   ↓
3. SUBSCRIBE (LemonSqueezy Checkout)
   User selects plan → POST /api/checkout → LemonSqueezy hosted checkout
   ✓ WORKS (when env vars configured)
   ⚠ BLOCKED: Needs LEMONSQUEEZY_API_KEY, STORE_ID, VARIANT IDs, WEBHOOK_SECRET
   ↓
4. PAYMENT SUCCESS WEBHOOK
   LemonSqueezy POST /api/webhooks/lemonsqueezy (signed)
   → Signature verified via HMAC-SHA256
   → Idempotency check via Redis (or memory fallback)
   → handlePaymentSuccess() updates user:
     - starter: 100 credits, 3 platforms
     - growth: 500 credits, 10 platforms  ← INCONSISTENT (should be 300)
     - business: 5000 credits, 100 platforms ← INCONSISTENT (should be 1000)
   → Sends upgrade email via Resend
   ✓ WORKS (when env vars configured)
   ⚠ BUG: Credit amounts inconsistent with CreditsManager and subscription page
   ↓
5. GENERATE AI REPLY
   User clicks "Generate Reply" → POST /api/reviews/generate-reply
   → Auth check (Clerk)
   → Rate limit check
   → Sentiment analysis via LongCat AI
   → Reply generation via LongCat AI
   → Returns reply text (NOT saved to DB yet)
   ⚠ BUG: NO CREDIT CHECK OR DEDUCTION HAPPENS HERE
   → User must click "Save" to persist → separate POST with replyText
   ↓
6. SAVE REPLY (separate call)
   POST /api/reviews/generate-reply { replyText, reviewId, aiGenerated }
   → Auth + ownership check
   → Updates review.aiReplyText, status
   ✓ WORKS
   ⚠ STILL NO CREDIT DEDUCTION
   ↓
7. CHAT CREDIT DEDUCTION (different path!)
   POST /api/chat → streams response
   → onFinish: if promptCount >= 10, deduct 1 credit, reset promptCount
   → else: increment promptCount
   ✓ WORKS (atomic transaction)
```

### Race Conditions Identified

1. **Credit deduction race in chat**: The chat API reads `promptCount`, streams response, then writes in `onFinish`. If two requests overlap, both read same `promptCount`, both increment, credit deduction missed.
   → Partially mitigated by `$transaction` but read is outside transaction.

2. **Webhook idempotency**: Uses Redis with 5-min TTL. If Redis unavailable, falls through to memory (per-instance). In serverless, multiple instances may process same webhook.
   → Acceptable risk for current scale.

3. **No credit deduction in generate-reply**: Multiple concurrent generate-reply calls all succeed without deduction → free generations.

---

## C. Root-Cause Analysis: "AI Does Not Respond / Credit System Broken"

### Primary Bug: Credits Never Deducted on AI Reply Generation

**Location:** `src/app/api/reviews/generate-reply/route.ts` (lines 144-217)

**Evidence:**
```typescript
// Line 144: AI generation starts
console.log('[Generate Reply API] Using LongCat AI to generate reply')

// Line 148-161: Sentiment analysis (NO credit check)
// Line 174-194: Reply generation (NO credit check)

// Line 196: Returns success — NEVER deducts credits
return NextResponse.json({
  success: true,
  reply: aiReply,
  metadata: { ... }
})
```

**Root Cause:** The `generate-reply` API route:
1. Does NOT import `CreditsManager`
2. Does NOT call `CreditsManager.getCredits()` to check balance
3. Does NOT call `CreditsManager.useCredits()` to deduct
4. Does NOT use Prisma transactions for atomicity
5. Simply returns the generated reply without any payment logic

**Secondary Bug: Credit Amount Inconsistency**

Three different credit allocations exist:
| Plan | Subscription Page | CreditsManager | Webhook |
|------|------------------|---------------|---------|
| starter | 100 | 100 | 100 ✓ |
| growth | 300 | 300 | **500** ✗ |
| business | 1000 | 1000 | **5000** ✗ |

**Location:** `src/app/api/webhooks/lemonsqueezy/route.ts` lines 214-223

---

## D. Prioritized Bug & Risk List

### Critical (P0) — Blocking Revenue

| # | Issue | Severity | Exploitability | Location |
|---|-------|----------|----------------|----------|
| 1 | **No credit deduction on AI reply generation** | Critical | High | `generate-reply/route.ts:196` |
| 2 | **Webhook credit amounts inconsistent** | Critical | N/A | `webhooks/lemonsqueezy/route.ts:214-223` |
| 3 | **No API key validation at startup** | High | N/A | All AI routes |

### High (P1) — Security/Correctness

| # | Issue | Severity | Exploitability | Location |
|---|-------|----------|----------------|----------|
| 4 | **Race condition in chat credit deduction** | High | Medium | `chat/route.ts:174-193` |
| 5 | **No middleware for route protection** | High | Low | Missing `middleware.ts` |
| 6 | **Webhook replay possible without Redis** | High | Medium | `webhooks/lemonsqueezy/route.ts:21-32` |
| 7 | **CSRF not checked on generate-reply** | Medium | Medium | `generate-reply/route.ts` |

### Medium (P2) — UX/Reliability

| # | Issue | Severity | Exploitability | Location |
|---|-------|----------|----------------|----------|
| 8 | **Circuit breaker blocks all AI for 60s after 5 failures** | Medium | Low | `longcatAI.ts:67-114` |
| 9 | **No retry on webhook DB failure** | Medium | Low | `webhooks/lemonsqueezy/route.ts:256-258` |
| 10 | **Review list returns 200 with empty array when no auth** | Low | N/A | `reviews/list/route.ts:46-48` |

---

## E. Phased Plan (24 Phases)

### Phase 1: Fix AI Reply Credit Deduction (BLOCKER FIX)
**Goal:** Make generate-reply atomically check, deduct, and generate — no free generations.
**Files:** `src/app/api/reviews/generate-reply/route.ts`, `src/lib/credits.ts`
**Changes:**
- Import CreditsManager in generate-reply route
- Add credit check BEFORE AI call (return 402 if insufficient)
- Use Prisma transaction: deduct credit + create/update review in single transaction
- Add CreditUsage logging table
**Acceptance:** Every AI reply costs 1 credit; 402 returned when 0 credits; no double-charge possible.
**Rollback:** Revert generate-reply.ts to previous state.

### Phase 2: Fix Webhook Credit Amounts
**Goal:** Align webhook credit grants with subscription page.
**Files:** `src/app/api/webhooks/lemonsqueezy/route.ts`
**Changes:** Update handlePaymentSuccess to use CreditsManager.getPlanCredits()
**Acceptance:** Starter=100, Growth=300, Business=1000 credits granted.
**Rollback:** Revert credit amounts.

### Phase 3: Atomic Credit Deduction in Chat
**Goal:** Fix race condition by moving credit check/deduction inside transaction.
**Files:** `src/app/chat/route.ts`
**Changes:** Wrap read + write in single Prisma transaction with row-level lock
**Acceptance:** Concurrent requests never both succeed with same credit.
**Rollback:** Revert chat.ts.

### Phase 4: Add Credit Usage Audit Log
**Goal:** Immutable log of every credit transaction.
**Files:** `prisma/schema.prisma`, `src/lib/credits.ts`, new migration
**Changes:** Add CreditUsage model with userId, action, amount, balance_after, timestamp
**Acceptance:** Every credit change creates a CreditUsage row.
**Rollback:** Drop table.

### Phase 5: Create Auth Middleware
**Goal:** Centralized route protection.
**Files:** `src/middleware.ts` (new)
**Changes:** Clerk auth check on all /api/* routes except webhooks; redirect to signin for app routes
**Acceptance:** Unauthenticated requests to protected routes return 401.
**Rollback:** Delete middleware.ts.

### Phase 6: Add Supabase RLS Policies
**Goal:** Database-level ownership enforcement.
**Files:** `prisma/schema.prisma`, new migration
**Changes:** Enable RLS on Review, ChatSession; add policies checking auth.uid() = userId
**Acceptance:** Direct DB queries respect ownership even if app logic fails.
**Rollback:** Drop policies.

### Phase 7: Feature Gating Middleware
**Goal:** Enforce plan entitlements on every route.
**Files:** `src/lib/entitlements.ts` (new), update all API routes
**Changes:** Create planFeatures map; middleware checks user plan before allowing action
**Acceptance:** Free user cannot access starter-only features; returns 403 with upgrade prompt.
**Rollback:** Remove entitlement checks.

### Phase 8: Add Zod Validation to All Routes
**Goal:** Strict input validation on every API endpoint.
**Files:** All files in `src/app/api/*/route.ts`
**Changes:** Replace manual validation with Zod schemas; reject unknown fields
**Acceptance:** Malformed requests return 400 with clear error messages.
**Rollback:** Revert individual routes.

### Phase 9: Standardize Error Responses
**Goal:** Consistent JSON error format across all APIs.
**Files:** `src/lib/api-response.ts` (new), update all routes
**Changes:** Create { success, error, code, details } format; use everywhere
**Acceptance:** All errors return same structure; no stack traces leaked.
**Rollback:** Revert response format.

### Phase 10: Add Request Logging Middleware
**Goal:** Audit trail for all API calls.
**Files:** `src/middleware.ts`
**Changes:** Log method, path, userId, statusCode, duration to console (or Sentry)
**Acceptance:** Every API call produces a log line.
**Rollback:** Remove logging.

### Phase 11: Fix Circuit Breaker Recovery
**Goal:** Reduce circuit breaker timeout; add half-open test.
**Files:** `src/lib/longcatAI.ts`
**Changes:** Reduce timeout to 30s; add exponential backoff; test in half-open
**Acceptance:** Service recovers faster after transient failures.
**Rollback:** Revert timeout values.

### Phase 12: Add Webhook Retry Logic
**Goal:** Retry webhook processing on DB failure.
**Files:** `src/app/api/webhooks/lemonsqueezy/route.ts`
**Changes:** Wrap DB update in retry (3 attempts, exponential backoff); throw if all fail
**Acceptance:** Transient DB errors don't lose webhook events.
**Rollback:** Remove retry wrapper.

### Phase 13: Implement Plan Entitlement Enforcement
**Goal:** Lock features behind plans per pricing page.
**Files:** `src/app/api/reviews/*/route.ts`, `src/app/api/agentic/*/route.ts`
**Changes:** Check user.planType before allowing bulk_replies, auto_reply, etc.
**Acceptance:** Free users cannot access Growth/Business features.
**Rollback:** Remove checks.

### Phase 14: Add Rate Limit Headers to All Responses
**Goal:** Clients can self-throttle.
**Files:** `src/middleware.ts` or `src/lib/rate-limit.ts`
**Changes:** Include X-RateLimit-* headers on every API response
**Acceptance:** All API responses include rate limit headers.
**Rollback:** Remove header injection.

### Phase 15: Create BLOCKERS.md and PROGRESS.md
**Goal:** Track blockers and progress for human review.
**Files:** `BLOCKERS.md`, `PROGRESS.md` (new)
**Changes:** Document all missing env vars, pending external actions
**Acceptance:** Complete list of what only the user can do.
**Rollback:** Delete files.

### Phase 16: Environment Variable Validation
**Goal:** Fail fast on missing env vars at startup.
**Files:** `src/lib/env.ts` (new)
**Changes:** Validate all required env vars on module load; throw descriptive error
**Acceptance:** App won't start without DATABASE_URL, CLERK_SECRET_KEY, etc.
**Rollback:** Remove validation.

### Phase 17: Add Health Check Endpoint
**Goal:** Monitor all integrations.
**Files:** `src/app/api/health/route.ts` (new)
**Changes:** Check DB (Prisma query), Clerk (auth verification), AI (model list), Redis (ping)
**Acceptance:** GET /api/health returns { status, checks: { db, clerk, ai, redis } }
**Rollback:** Delete route.

### Phase 18: Add Database Indexes
**Goal:** Optimize query performance.
**Files:** `prisma/schema.prisma`, new migration
**Changes:** Add indexes on Review(userId, status), Review(userId, sourceDate), ChatMessage(sessionId)
**Acceptance:** Dashboard loads <500ms with 1000+ reviews.
**Rollback:** Drop indexes.

### Phase 19: Implement CSRF on All State-Changing Routes
**Goal:** Consistent CSRF protection.
**Files:** All POST/PUT/PATCH/DELETE routes
**Changes:** Wrap handlers with withCSRFProtection()
**Acceptance:** Cross-origin POST without Origin header returns 403.
**Rollback:** Remove CSRF wrappers.

### Phase 20: Add Sentry Error Boundaries
**Goal:** Catch all unhandled errors.
**Files:** `src/app/layout.tsx`, update ErrorBoundary component
**Changes:** Wrap each page in Sentry.ErrorBoundary; capture exceptions
**Acceptance:** Client-side errors appear in Sentry dashboard.
**Rollback:** Remove Sentry boundaries.

### Phase 21: Create Integration Test Suite
**Goal:** Automated tests for critical paths.
**Files:** `tests/credits.test.ts`, `tests/payments.test.ts`, `tests/ai.test.ts` (new)
**Changes:** Vitest tests for credit deduction, webhook processing, AI generation
**Acceptance:** `npm run build` passes; tests cover credit + payment + AI.
**Rollback:** Delete test files.

### Phase 22: Pre-Deploy Production Checklist
**Goal:** Ensure production readiness.
**Files:** `PRODUCTION_CHECKLIST.md` (new)
**Changes:** Document all checks: env vars, RLS, rate limits, Sentry, backups
**Acceptance:** Checklist complete before any deploy.
**Rollback:** N/A.

### Phase 23: Agentic Features — Guardrails
**Goal:** Add safety caps to agentic processing.
**Files:** `src/app/api/agentic/reviews/route.ts`
**Changes:** Add max 10 reviews per run; require human approval; log all actions
**Acceptance:** Agentic mode never processes >10 reviews without approval.
**Rollback:** Remove cap.

### Phase 24: Final Verification & Commit
**Goal:** Verify all changes; commit and push.
**Files:** All modified files
**Changes:** Run `npx tsc --noEmit`, `npm run build`, fix any errors, commit
**Acceptance:** Clean build; small logical commits; clear messages.
**Rollback:** N/A.

---

## Phase Order & Dependencies

```
Phase 1 (Credit Fix) ← START HERE
    ↓
Phase 2 (Webhook Amounts)
    ↓
Phase 3 (Chat Atomicity)
    ↓
Phase 4 (Audit Log)
    ↓
Phase 5 (Auth Middleware)
    ↓
Phase 6 (RLS)
    ↓
Phase 7-10 (Validation, Errors, Logging)
    ↓
Phase 11-14 (Circuit Breaker, Retry, Entitlements)
    ↓
Phase 15-16 (Blockers, Env Validation)
    ↓
Phase 17-20 (Health, Indexes, CSRF, Sentry)
    ↓
Phase 21-24 (Tests, Checklist, Agentic Guardrails, Commit)
```

---

## New Environment Variables Required

| Variable | Purpose | Phase |
|----------|---------|-------|
| LEMONSQUEEZY_API_KEY | Payment API access | 2 (already expected) |
| LEMONSQUEEZY_STORE_ID | Store identifier | 2 |
| LEMONSQUEEZY_VARIANT_STARTER | Starter plan variant | 2 |
| LEMONSQUEEZY_VARIANT_GROWTH | Growth plan variant | 2 |
| LEMONSQUEEZY_VARIANT_BUSINESS | Business plan variant | 2 |
| LEMONSQUEEZY_WEBHOOK_SECRET | Webhook signature verification | 2 |
| UPSTASH_REDIS_REST_URL | Rate limit storage | 5 |
| UPSTASH_REDIS_REST_TOKEN | Rate limit auth | 5 |
| RESEND_API_KEY | Transactional emails | 12 (already expected) |

---

## BLOCKERS (User Action Required)

1. **LemonSqueezy Store Verification** — Store must be verified by LemonSqueezy before live payments work
2. **Variant IDs** — Must create products in LemonSqueezy dashboard and add variant IDs to env
3. **API Keys** — LONGCAT_AI_API_KEY must be set in Vercel for AI to work

---

**END OF PHASE 0 AUDIT**
