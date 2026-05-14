import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Public Routes (no auth required) ────────────────────────────────────────
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/manifest.json',
  '/sw.js',
  '/icons/(.*)',
  '/favicon.ico',
  '/noise.svg',
  '/api/health(.*)',
  '/api/stats(.*)',
  '/api/waitlist(.*)',
  '/api/platforms/google/callback(.*)',
  '/api/platforms/facebook/callback(.*)',
  '/privacy',
  '/terms',
  '/faq',
  '/contact',
  '/docs',
  '/pwa-test',
  '/offline',
  '/api/proxy', // Has its own auth inside the route
]);

// ─── Protected Routes (auth required) ────────────────────────────────────────
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/reviews(.*)',
  '/analytics(.*)',
  '/settings(.*)',
  '/profile(.*)',
  '/subscription(.*)',
  '/connect-platforms(.*)',
  '/api/platforms(.*)',
  '/api/reviews(.*)',
  '/api/auto-reply(.*)',
  '/api/data-hub(.*)',
  '/api/chat(.*)',
  '/api/ai(.*)',
  '/api/user(.*)',
  '/api/checkout(.*)',
  '/api/scheduler(.*)',
  '/api/agentic(.*)',
  '/chrome-extension(.*)',
  '/extension(.*)',
  '/chat(.*)',
  '/onboarding(.*)',
  '/easy-setup(.*)',
  '/schedule-call(.*)',
]);

// ─── Security Headers ────────────────────────────────────────────────────────
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self), payment=(self)'
  );
  return response;
}

// ─── Main Middleware ─────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Skip authentication for public routes
  if (isPublicRoute(request)) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }

  // Protect private routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
});

// ─── Matcher Config ──────────────────────────────────────────────────────────
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    // EXPLICITLY excluding json and webmanifest to allow PWA to work
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
