# AutoReview AI - Deployment Guide

## Production Setup

This guide covers the steps to properly deploy AutoReview AI for production use.

### Environment Variables

Before deploying, ensure the following environment variables are set in your production environment:

```env
# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Provider
LONGCAT_AI_API_KEY=your-longcat-api-key

# Optional: Platform APIs
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
YELP_API_KEY=...

# Scheduler (optional, for external cron jobs)
SCHEDULER_SECRET=your-scheduler-secret
```

### Database Setup

1. Apply the database schema by running the SQL in `database/schema.sql` against your Supabase instance
2. The schema includes:
   - Reviews table
   - Replies table
   - Analytics table
   - Users table (managed by Supabase Auth)
   - `scheduled_replies` table (for auto-reply scheduling)
   - `auto_reply_rules` table (for auto-reply rules)

### Background Jobs & Scheduling

AutoReview AI includes an auto-reply scheduler that processes scheduled replies. You have several options to run it:

#### Option 1: External Cron Service (Recommended)

Set up a cron job or scheduled task to call the scheduler endpoint every minute:

```bash
# Example using curl
curl -X GET https://yourdomain.com/api/scheduler
```

#### Option 2: Platform-specific Cron

If deploying on Vercel, you can use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs):

1. Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scheduler",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Option 3: Third-party Scheduling Service

Use a service like [Cron-job.org](https://cron-job.org) or [HealthChecks.io](https://healthchecks.io) to periodically call:
- `https://yourdomain.com/api/scheduler`

### API Endpoints

The following endpoints are available for system management:

- `GET /api/health` - Health check endpoint
- `GET /api/scheduler` - Run the auto-reply scheduler
- `POST /api/scheduler` - Run the auto-reply scheduler (with optional secret)

### Performance Considerations

1. **3D Components**: The application includes several 3D visualizations that are optimized for mobile performance but may still impact performance on lower-end devices. These automatically adjust complexity based on device capabilities.

2. **AI Service**: The LongCat AI integration includes circuit breaker patterns and retry logic to handle service interruptions gracefully.

3. **Database Queries**: All database queries use proper indexing and are optimized for performance.

### Security Measures

1. **Authentication**: All user data is protected with Clerk authentication
2. **Database Security**: Row Level Security (RLS) is enabled for all user-specific tables
3. **API Keys**: API keys are never exposed to the client-side
4. **Input Validation**: All user inputs are validated and sanitized

### Monitoring & Health Checks

Monitor the following endpoints to ensure application health:

- `GET /api/health` - Overall application health
- Check error logs for:
  - Database connection issues
  - AI service availability
  - Webhook processing errors

### Scaling Considerations

1. **Database**: The application is designed to work with Supabase PostgreSQL which can scale horizontally
2. **Serverless Functions**: Next.js API routes are serverless and automatically scale with demand
3. **3D Components**: Complexity automatically reduces on lower-performance devices
4. **AI Service**: The LongCat AI integration includes rate limiting and retry logic

### Troubleshooting

**Auto-reply scheduler not running:**
- Ensure your cron job or scheduled task is properly configured
- Check the `/api/scheduler` endpoint for manual triggering
- Review logs for any authentication or database connection issues

**3D components performance:**
- Check browser console for rendering errors
- Verify that the application is running on HTTPS for WebXR compatibility

**AI service failures:**
- Verify that the `LONGCAT_AI_API_KEY` is correctly set
- Check network connectivity to the AI service
- Review the circuit breaker logs for failure patterns

### Rollback Plan

In case of deployment issues:
1. Keep your previous version running
2. Deploy to a staging environment first
3. Monitor health check endpoint after deployment
4. Have access to revert to the previous version ready