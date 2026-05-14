/**
 * Sentry Configuration for AutoReview AI
 * Error tracking and performance monitoring
 *
 * To enable Sentry:
 * 1. Sign up at https://sentry.io
 * 2. Create a new project for Next.js
 * 3. Add SENTRY_DSN to your .env.local file
 * 4. Set ENABLE_SENTRY=true in .env.local
 */

import { NextResponse } from 'next/server';

// ─── Check if Sentry is enabled ──────────────────────────────────────────────
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENABLED = process.env.ENABLE_SENTRY === 'true' && !!SENTRY_DSN;

// ─── Sentry Client (lazy loaded) ─────────────────────────────────────────────
let sentryClient: any = null;

async function getSentryClient() {
  if (!SENTRY_ENABLED) return null;

  if (!sentryClient) {
    try {
      const Sentry = await import('@sentry/nextjs');
      sentryClient = Sentry;
    } catch (error) {
      console.error('[Sentry] Failed to load Sentry:', error);
    }
  }

  return sentryClient;
}

// ─── Initialize Sentry ──────────────────────────────────────────────────────
export async function initSentry() {
  if (!SENTRY_ENABLED) {
    console.log('[Sentry] Disabled (set ENABLE_SENTRY=true and SENTRY_DSN to enable)');
    return;
  }

  try {
    const Sentry = await getSentryClient();
    if (!Sentry) return;

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter sensitive data
      beforeSend(event: any) {
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
        // Browser extensions
        'top.GLOBALS',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // Common non-critical errors
        'ResizeObserver loop completed with undelivered notifications',
      ],
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

// ─── Capture Exception ───────────────────────────────────────────────────────
export async function captureException(error: Error, context?: Record<string, any>) {
  console.error('[Error]', error.message, context);

  if (!SENTRY_ENABLED) return;

  try {
    const Sentry = await getSentryClient();
    if (Sentry) {
      Sentry.captureException(error, { extra: context });
    }
  } catch {
    // Sentry capture failed - already logged above
  }
}

// ─── Capture Message ─────────────────────────────────────────────────────────
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_ENABLED) return;

  try {
    const Sentry = await getSentryClient();
    if (Sentry) {
      Sentry.captureMessage(message, level);
    }
  } catch {
    // Sentry capture failed
  }
}

// ─── Set User Context ────────────────────────────────────────────────────────
export async function setSentryUser(userId: string, email?: string) {
  if (!SENTRY_ENABLED) return;

  try {
    const Sentry = await getSentryClient();
    if (Sentry) {
      Sentry.setUser({ id: userId, email: email ? '***@***' : undefined });
    }
  } catch {
    // Sentry set user failed
  }
}

// ─── API Route Error Handler ─────────────────────────────────────────────────
export async function withErrorHandler(
  handler: () => Promise<NextResponse>,
  context?: { endpoint?: string; method?: string; userId?: string }
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    await captureException(error instanceof Error ? error : new Error(String(error)), context);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── Default Export ──────────────────────────────────────────────────────────
export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser: setSentryUser,
  withErrorHandler,
  isEnabled: SENTRY_ENABLED,
};
