/**
 * CSRF Protection Middleware
 * Validates Origin and Referer headers for state-changing operations
 */

import { NextRequest } from 'next/server'

/**
 * Validate CSRF token for state-changing requests
 * Checks Origin and Referer headers
 */
export function validateCSRF(request: NextRequest): {
  valid: boolean
  reason?: string
} {
  const method = request.method

  // Only check state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true }
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  // Get allowed origins from environment
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    `https://${host}`,
    `http://${host}`
  ]

  // Check Origin header (preferred)
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        const originUrl = new URL(origin)
        return allowedUrl.origin === originUrl.origin
      } catch {
        return false
      }
    })

    if (!isAllowed) {
      console.error('[CSRF] Invalid origin:', origin)
      return {
        valid: false,
        reason: 'Invalid origin header'
      }
    }

    return { valid: true }
  }

  // Fallback to Referer header
  if (referer) {
    const isAllowed = allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed)
        const refererUrl = new URL(referer)
        return refererUrl.origin === allowedUrl.origin
      } catch {
        return false
      }
    })

    if (!isAllowed) {
      console.error('[CSRF] Invalid referer:', referer)
      return {
        valid: false,
        reason: 'Invalid referer header'
      }
    }

    return { valid: true }
  }

  // No Origin or Referer header - suspicious
  console.warn('[CSRF] Missing Origin and Referer headers for', method, request.url)

  // For API routes, we can be strict
  if (request.url.includes('/api/')) {
    return {
      valid: false,
      reason: 'Missing Origin and Referer headers'
    }
  }

  // For other routes, allow (Clerk handles its own CSRF)
  return { valid: true }
}

/**
 * CSRF validation middleware wrapper
 * Use this in API routes that modify data
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const csrfCheck = validateCSRF(request)

    if (!csrfCheck.valid) {
      return new Response(
        JSON.stringify({
          error: 'CSRF validation failed',
          reason: csrfCheck.reason
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request)
  }
}
