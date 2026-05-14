/**
 * Sentry Instrumentation for Next.js 16
 * This file is automatically loaded by Next.js during startup.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

export async function register() {
  // Only initialize Sentry on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  // Initialize Sentry for edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
