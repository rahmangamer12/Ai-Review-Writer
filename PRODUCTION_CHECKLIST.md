# Production Readiness Checklist

**Last Updated:** 2026-06-20

Use this checklist before every deploy to production.

---

## 🔴 Critical (Must Pass)

### Environment Variables
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key
- [ ] `CLERK_SECRET_KEY` — Clerk backend key
- [ ] `LONGCAT_AI_API_KEY` — AI provider key
- [ ] `LEMONSQUEEZY_API_KEY` — Payment API key
- [ ] `LEMONSQUEEZY_STORE_ID` — Store identifier
- [ ] `LEMONSQUEEZY_VARIANT_STARTER` — Starter plan variant ID
- [ ] `LEMONSQUEEZY_VARIANT_GROWTH` — Growth plan variant ID
- [ ] `LEMONSQUEEZY_VARIANT_BUSINESS` — Business plan variant ID
- [ ] `LEMONSQUEEZY_WEBHOOK_SECRET` — Webhook signature secret
- [ ] `ENCRYPTION_KEY` — For encrypting sensitive data
- [ ] `SCHEDULER_SECRET` — For cron job authentication

### Security
- [ ] All /api/* routes require Clerk auth (except webhooks)
- [ ] Webhook routes validate HMAC-SHA256 signature
- [ ] CSRF protection on all state-changing routes
- [ ] Rate limiting enabled (Upstash Redis or memory fallback)
- [ ] Input validation (Zod) on all API routes
- [ ] No secrets in client-side code or logs
- [ ] CSP headers configured in next.config.ts
- [ ] HSTS enabled (max-age ≥ 1 year)

### Database
- [ ] Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Indexes on Review(userId, status), ChatMessage(sessionId)
- [ ] Foreign keys with CASCADE deletes configured

### Payments (LemonSqueezy)
- [ ] Store verified by LemonSqueezy
- [ ] Products/variants created in dashboard
- [ ] Webhook URL configured: `https://<domain>/api/webhooks/lemonsqueezy`
- [ ] Webhook events: order_created, subscription_created, subscription_payment_success
- [ ] Test payment flow works end-to-end

### Health Check
- [ ] GET /api/health returns 200 with all checks "ok"
- [ ] Database connection verified
- [ ] Clerk auth module loads
- [ ] AI provider key present
- [ ] Redis (Upstash) accessible (if configured)

---

## 🟡 Important (Should Pass)

### Monitoring
- [ ] Sentry org/project configured in next.config.ts
- [ ] Sentry auth token set (for source map upload)
- [ ] Sentry error boundaries in app/layout.tsx
- [ ] console.error for unhandled API errors

### Performance
- [ ] Image optimization enabled (AVIF/WebP)
- [ ] Three.js/Framer Motion code-split
- [ ] Bundle analysis run: `npm run analyze`
- [ ] Core Web Vitals acceptable (LCP < 2.5s, FID < 100ms, CLS < 0.1)

### Email
- [ ] Resend API key configured
- [ ] Upgrade confirmation email tested
- [ ] Low credits email tested

---

## 🟢 Nice-to-Have

- [ ] RLS policies on Supabase (if using direct DB access)
- [ ] Chrome extension ID configured
- [ ] Sentry source maps uploaded
- [ ] Integration tests passing: `npm test`
- [ ] Build passes: `npm run build`

---

## Pre-Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client (after schema changes)
npx prisma generate

# 3. Run TypeScript check
npx tsc --noEmit

# 4. Run build
npm run build

# 5. Run tests (if any)
npm test

# 6. Verify health
curl https://<domain>/api/health
```

---

## Post-Deploy Verification

1. Visit /api/health → all checks green
2. Sign up as new user → 20 free credits granted
3. Generate AI reply → 1 credit deducted, balance = 19
4. Check CreditUsage table → audit log entry created
5. Subscribe to plan → correct credits granted via webhook
6. Check /api/user/me → shows correct plan + credits

---

**Deploy Status:** 🟡 In Progress (pending LemonSqueezy setup)
