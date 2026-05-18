---
name: autoreview-security-review
description: Review AutoReview AI changes for auth, ownership, secret handling, OAuth, billing, webhooks, rate limits, and unsafe client storage.
paths: "src/app/api/**,src/lib/**,prisma/**,src/app/settings/**,src/app/connect-platforms/**"
---

# AutoReview Security Review

Use this skill before shipping API, billing, OAuth, platform integration, review mutation, or user-profile changes.

## Checklist

- Every user-specific API route uses Clerk auth.
- Prisma queries are scoped to the authenticated user.
- Mutations validate input with zod or equivalent.
- No secrets, access tokens, card data, CVV, or OAuth client secrets are exposed to the browser.
- LemonSqueezy webhooks validate signatures.
- OAuth redirect URIs match the intended environment.
- Rate limiting and CSRF are considered for mutation endpoints.
- Error responses do not leak stack traces or provider secrets.

## Search

- `rg -n "auth\\(|currentUser|userId|prisma\\.|NextResponse.json" src/app/api src/lib`
- `rg -n "localStorage|sessionStorage|access_token|refresh_token|client_secret|cardNumber|cvv" src`
- `rg -n "webhook|signature|csrf|rateLimit|ratelimit" src`

## Output

Lead with findings by severity. Include file paths and what needs changing. If no issue is found, say that clearly and name residual risks.
