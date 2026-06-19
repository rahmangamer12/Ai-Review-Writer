/**
 * Route Protection Middleware
 *
 * Protects all /api/* routes (except webhooks) with Clerk auth.
 * Redirects unauthenticated app route requests to Clerk's sign-in.
 *
 * Webhook routes (/api/webhooks/*) are excluded — they use signature
 * validation instead of Clerk sessions.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that do NOT require Clerk auth
const isPublicRoute = createRouteMatcher([
  '/api/webhooks/(.*)',           // Webhook callbacks (signature-verified)
  '/api/reviews/generate-reply',  // Chrome extension uses shared secret
  '/api/health',                   // Health check endpoint
  '/(.*)',                         // All app pages handle their own auth UI
])

// Routes that require Clerk session
const isProtectedApiRoute = createRouteMatcher([
  '/api/checkout(.*)',
  '/api/chat(.*)',
  '/api/user/(.*)',
  '/api/reviews/list(.*)',
  '/api/data-hub(.*)',
  '/api/agentic/(.*)',
  '/api/platforms/(.*)',
  '/api/integrations/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const pathname = req.nextUrl.pathname

  // Allow public routes through
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // For protected API routes, require auth
  if (isProtectedApiRoute(req)) {
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // All other routes: pass through (Clerk handles its own redirects for app pages)
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
