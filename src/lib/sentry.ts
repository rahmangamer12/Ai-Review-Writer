/**
 * Sentry Configuration for AutoReview AI
 * Error tracking and performance monitoring
 */

// This file configures Sentry for the Next.js application
// To enable Sentry:
// 1. Sign up at https://sentry.io
// 2. Create a new project for Next.js
// 3. Add SENTRY_DSN to your .env.local file
// 4. Uncomment the code below

/*
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps

    environment: process.env.NODE_ENV,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // Filter out sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Load failed',
    ],
  });
}

export default Sentry;
*/

// Placeholder export when Sentry is not configured
export default {
  captureException: (error: Error) => {
    console.error('[Sentry Placeholder]:', error);
  },
  captureMessage: (message: string) => {
    console.log('[Sentry Placeholder]:', message);
  },
};
