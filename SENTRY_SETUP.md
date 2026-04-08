# Sentry Setup Guide

## 🔍 Error Monitoring with Sentry

Sentry provides real-time error tracking and performance monitoring for your application.

---

## 📋 Setup Instructions

### 1. Create a Sentry Account

1. Go to https://sentry.io
2. Sign up for a free account
3. Create a new project
4. Select **Next.js** as the platform

### 2. Get Your DSN

After creating the project, you'll receive a **DSN (Data Source Name)**. It looks like:
```
https://abc123@o123456.ingest.sentry.io/7654321
```

### 3. Add to Environment Variables

Add to your `.env.local`:
```bash
SENTRY_DSN=your_sentry_dsn_here
```

### 4. Enable Sentry

Uncomment the code in `src/lib/sentry.ts` to activate Sentry.

---

## 🎯 What Sentry Tracks

### Errors
- JavaScript runtime errors
- API route errors
- Unhandled promise rejections
- React component errors

### Performance
- Page load times
- API response times
- Database query performance
- User interactions

### User Context
- User ID (from Clerk)
- Browser information
- Device type
- Geographic location

---

## 🔒 Privacy & Security

Sentry is configured to:
- ✅ Filter out sensitive headers (Authorization, Cookie)
- ✅ Not send events in development mode
- ✅ Ignore browser extension errors
- ✅ Sample only 10% of transactions in production

---

## 📊 Monitoring Best Practices

### 1. Set Up Alerts

Configure alerts in Sentry dashboard for:
- New error types
- Error spike (>10 errors/minute)
- Performance degradation

### 2. Create Issues

Link Sentry errors to GitHub issues for tracking.

### 3. Release Tracking

Tag errors with release versions:
```bash
SENTRY_RELEASE=v1.0.0 npm run build
```

### 4. Source Maps

Sentry automatically uploads source maps for better error debugging.

---

## 🚀 Usage in Code

### Capture Exceptions

```typescript
import Sentry from '@/lib/sentry'

try {
  // Your code
} catch (error) {
  Sentry.captureException(error)
  throw error
}
```

### Capture Messages

```typescript
Sentry.captureMessage('User completed onboarding', 'info')
```

### Add Context

```typescript
Sentry.setUser({
  id: userId,
  email: user.email,
})

Sentry.setContext('review', {
  reviewId: review.id,
  platform: review.platform,
})
```

---

## 💰 Pricing

- **Free Tier:** 5,000 errors/month
- **Team Plan:** $26/month - 50,000 errors/month
- **Business Plan:** $80/month - 150,000 errors/month

For most startups, the free tier is sufficient.

---

## 🔗 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Dashboard](https://sentry.io/organizations/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

---

**Status:** ⚠️ Not configured (optional)  
**Priority:** Medium  
**Setup Time:** 10 minutes
