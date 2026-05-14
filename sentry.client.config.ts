// This file configures the initialization of Sentry on the client.
// The config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN && process.env.ENABLE_SENTRY === 'true') {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Adjust this value in production, or use tracesSampleRate for finer control
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not interested in tracking the health of your releases:
    integrations: [
      Sentry.replayIntegration({
        // Additional SDK configuration goes in here, for example:
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out sensitive data before sending
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // Filter out sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Filter out sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
    ],
  });
}
