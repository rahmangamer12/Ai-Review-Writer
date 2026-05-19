# AutoReview AI Production Audit

Last updated: 2026-05-19

## Current Readiness

Target status: beta-ready SaaS with production payment/OAuth dependencies.

Estimated readiness after the latest fixes: 84-86/100, assuming the required production environment variables and provider approvals are added in Vercel.

## Required Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://ai-review-writer.vercel.app
DATABASE_URL=
ENCRYPTION_KEY=
LONGCAT_AI_API_KEY=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_STARTER=
LEMONSQUEEZY_VARIANT_GROWTH=
LEMONSQUEEZY_VARIANT_BUSINESS=

SCHEDULER_SECRET=
REVIEWS_WEBHOOK_SECRET=
CHROME_EXTENSION_ID=
CHROME_EXTENSION_SHARED_SECRET=
```

## Fixed In Latest Pass

- LemonSqueezy checkout uses real `starter`, `growth`, and `business` variant IDs.
- Subscription success waits for webhook-confirmed plan data instead of faking plan activation in localStorage.
- Google OAuth state is encrypted and saved OAuth secrets are encrypted.
- Google token refresh supports custom user-provided OAuth client secrets.
- Facebook OAuth supports platform keys and user-provided app keys; state now encrypts app secrets.
- Reviews page has a Google sync action that imports connected Google reviews into Prisma.
- Platform status and platform reviews use Prisma-backed APIs.
- Extension and backend AI reply generation no longer use fake template fallbacks.
- Legacy Supabase auto-reply scheduler is isolated from runtime; auto-scheduling now returns an honest disabled response until a Prisma scheduler model is added.

## External Provider Limits

Google OAuth:
- Must have the correct authorized domain, redirect URI, privacy policy, terms link, and app name.
- Sensitive scope verification is still controlled by Google.

Meta/Facebook:
- Public OAuth cannot be fully bypassed without Meta app mode, approved permissions, and possible business verification.
- Free workaround is “Use My Keys” for users who are app admin/tester on their own Meta app.

LemonSqueezy:
- Checkout works only after store/account verification and valid product variant IDs.
- Webhook must be configured to `/api/webhooks/lemonsqueezy`.

## Remaining For 90+

- Add a Prisma-backed auto-reply rules/scheduled replies model.
- Add Sentry DSN and production alert routing.
- Add full end-to-end tests for Google sync, reply save, delete, checkout, and webhook.
- Replace remaining unused legacy Supabase files after confirming no imports in production paths.
