import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that should NOT be protected
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
])

// Define protected routes
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
  '/chrome-extension(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication for public routes
  if (isPublicRoute(req)) {
    return
  }

  // Protect private routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    // EXPLICITLY excluding json and webmanifest to allow PWA to work
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
