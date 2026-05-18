---
description: Ensure AutoReview AI features use real authenticated data instead of demo, local-only, or random data.
---

# AutoReview Real Data Guard

Use this skill when touching profile, dashboard, analytics, reviews, platforms, billing, or settings.

## Rules

- No fake dashboard rows.
- No random metrics.
- No localStorage for account-critical data.
- No raw payment details in app forms.
- No Supabase expansion without a migration spec.
- Empty states must be honest and actionable.

## Preferred Sources

- User identity: Clerk.
- User/account/profile data: Clerk metadata plus Prisma `User`.
- Reviews: Prisma `Review`.
- Platforms: Prisma `ConnectedPlatform`.
- Billing: LemonSqueezy checkout/webhooks.
- UI preferences only: localStorage is acceptable.

## Scan Before Finish

```powershell
rg -n "demo|sample|fake|dummy|Math.random|localStorage|supabase|placeholder" src
rg -n "cardNumber|cvv|payment-methods|access_token|clientSecret" src
```

Classify matches:

- Acceptable: placeholders in input fields, UI preferences, generated IDs, animation randomness.
- Risky: business metrics, profile data, billing methods, tokens, platform credentials.

## Verification

Run:

```powershell
npx tsc --noEmit
```

Run `npm run build` for production-surface changes.
