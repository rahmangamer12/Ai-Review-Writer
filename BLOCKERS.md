# BLOCKERS.md — Items Only You Can Resolve

**Last Updated:** 2026-06-20

---

## 🔴 Critical Blockers (Prevent Phase 2 — Payments Integrity)

### B1: LemonSqueezy Store Verification
- **What's blocked:** End-to-end payment testing; live checkout flow
- **Why:** Store must be verified by LemonSqueezy before accepting real payments
- **What you must do:**
  1. Log into LemonSqueezy dashboard
  2. Complete store verification (tax info, payout method, etc.)
  3. Confirm store status shows "Active" / "Verified"

### B2: LemonSqueezy Product & Variant IDs
- **What's blocked:** Checkout creation; correct plan fulfillment
- **Why:** The app needs variant IDs for each plan (starter, growth, business)
- **What you must do:**
  1. In LemonSqueezy dashboard → Products → Create 3 products (or 3 variants of 1 product):
     - Starter: $9/month
     - Growth: $19/month
     - Business: $39/month
  2. Copy each variant's ID (numeric)
  3. Add to `.env` or Vercel env:
     ```
     LEMONSQUEEZY_VARIANT_STARTER=<id>
     LEMONSQUEEZY_VARIANT_GROWTH=<id>
     LEMONSQUEEZY_VARIANT_BUSINESS=<id>
     ```

### B3: LemonSqueezy API Key + Store ID
- **What's blocked:** All payment operations
- **Why:** API access requires valid credentials
- **What you must do:**
  1. Generate API key in LemonSqueezy → Settings → API
  2. Copy Store ID from dashboard URL or settings
  3. Add to env:
     ```
     LEMONSQUEEZY_API_KEY=your_api_key
     LEMONSQUEEZY_STORE_ID=your_store_id
     ```

### B4: LemonSqueezy Webhook Secret
- **What's blocked:** Payment confirmation; credit granting after payment
- **Why:** Webhook signature verification prevents spoofed payment events
- **What you must do:**
  1. In LemonSqueezy → Settings → Webhooks
  2. Create webhook URL: `https://ai-review-writer.vercel.app/api/webhooks/lemonsqueezy`
  3. Select events: `order_created`, `subscription_created`, `subscription_payment_success`
  4. Copy the signing secret
  5. Add to env:
     ```
     LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
     ```

---

## 🟡 Important (Prevent Full Production Readiness)

### B5: LongCat AI API Key
- **What's blocked:** All AI features (reply generation, chat, agentic processing)
- **Why:** AI calls require valid API key
- **What you must do:**
  1. Verify `LONGCAT_AI_API_KEY` is set in Vercel
  2. If missing, obtain from LongCat dashboard and add to env

### B6: Upstash Redis Credentials
- **What's blocked:** Production rate limiting; webhook idempotency
- **Why:** Serverless needs external storage for rate limit state
- **What you must do:**
  1. Create free Upstash account at upstash.com
  2. Create a Redis database
  3. Add to env:
     ```
     UPSTASH_REDIS_REST_URL=your_url
     UPSTASH_REDIS_REST_TOKEN=your_token
     ```

### B7: Resend API Key
- **What's blocked:** Transactional emails (upgrade confirmation, low credits alerts)
- **Why:** Email sending requires API key
- **What you must do:**
  1. Verify `RESEND_API_KEY` is set in Vercel
  2. If missing, obtain from resend.com and add to env

---

## 🟢 Nice-to-Have (Can Defer)

### B8: Sentry Auth Token
- **What's blocked:** Source map upload for better error traces
- **Why:** Without it, errors are reported but without stack traces
- **What you must do:**
  1. Set `SENTRY_AUTH_TOKEN` in Vercel
  2. Set `SENTRY_UPLOAD_SOURCE_MAPS=true` for production builds

### B9: Chrome Extension ID
- **What's blocked:** Chrome extension API access
- **Why:** Extension needs registered ID for CORS and auth
- **What you must do:**
  1. Publish extension to Chrome Web Store
  2. Add extension ID to env:
     ```
     CHROME_EXTENSION_ID=your_extension_id
     ```

---

## ✅ Resolved Blockers Log

| Date | Blocker | Resolution |
|------|---------|------------|
| (none yet) | | |

---

**When you resolve a blocker:**
1. Mark it as resolved above
2. Test the affected flow manually
3. I will continue from where I left off

**Note:** I will proceed with all non-blocked phases while you handle these items.
