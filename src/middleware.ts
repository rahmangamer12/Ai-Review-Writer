import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
  '/chrome-extension(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect private routes
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
