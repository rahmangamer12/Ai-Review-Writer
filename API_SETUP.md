# AutoReview AI API Setup

Use `.env.local` for local development. Use your hosting provider's environment variables for production.

## Required for the App

```env
NEXT_PUBLIC_APP_URL=https://ai-review-writer.vercel.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://...
ENCRYPTION_KEY=64_hex_characters
LONGCAT_AI_API_KEY=...
```

## Platform OAuth

Use these when the app owns the OAuth flow for users.

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

Redirect URLs to add in provider dashboards:

```text
https://your-domain.com/api/platforms/google/callback
https://your-domain.com/api/platforms/facebook/callback
https://ai-review-writer.vercel.app/api/platforms/google/callback
https://ai-review-writer.vercel.app/api/platforms/facebook/callback
```

## Platform Direct API Keys

These are optional server-side defaults. Users can also provide credentials in the Connect Platforms page.

```env
YELP_API_KEY=...
```

## Payments

```env
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_VARIANT_STARTER=...
LEMONSQUEEZY_VARIANT_PROFESSIONAL=...
LEMONSQUEEZY_VARIANT_ENTERPRISE=...
```

Webhook URL:

```text
https://your-domain.com/api/webhooks/lemonsqueezy
```

## Email

```env
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Rate Limiting and Jobs

```env
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
SCHEDULER_SECRET=...
```

Scheduler URL:

```text
https://your-domain.com/api/scheduler?secret=YOUR_SCHEDULER_SECRET
```

## Browser Extension and Review Webhooks

```env
CHROME_EXTENSION_ID=...
CHROME_EXTENSION_SHARED_SECRET=...
REVIEWS_WEBHOOK_SECRET=...
```

Use the Chrome extension ID from `chrome://extensions` during local unpacked testing, then replace it with the Chrome Web Store extension ID after publishing.

## Optional Monitoring

```env
SENTRY_DSN=...
ENABLE_SENTRY=true
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

## How Platform Pages Work

`/connect-platforms` has three modes:

- Self Setup: the user enters credentials, the app tests them through `/api/proxy`, and the frontend stores connection settings locally.
- Managed Setup: the user submits a Formspree request so your team can configure the platform.
- Video Call Support: the user submits a Formspree request for guided setup.

OAuth endpoints:

- `/api/platforms/google/connect` receives a Google Client ID and Secret, creates a Google OAuth URL, and redirects back to `/api/platforms/google/callback`.
- `/api/platforms/facebook/connect` receives a Facebook App ID and Secret, creates a Meta OAuth URL, and redirects back to `/api/platforms/facebook/callback`.
- `/api/platforms/yelp/connect` validates a Yelp API key and Business ID directly.

Synced review data is stored server-side through `/api/platform/sync`, which now verifies the logged-in user owns the selected platform.
