/**
 * OAuth Redirect Validation Utility
 * Prevents open redirect vulnerabilities in OAuth callbacks
 */

// Whitelist of allowed redirect paths
const ALLOWED_REDIRECTS = [
  '/',
  '/dashboard',
  '/reviews',
  '/analytics',
  '/connect-platforms',
  '/settings',
  '/profile',
  '/subscription'
]

/**
 * Validate and sanitize redirect URL
 * @param redirect - The redirect path from query params
 * @returns Safe redirect path or default
 */
export function validateRedirect(redirect: string | null): string {
  // Default redirect
  const defaultRedirect = '/dashboard'

  // No redirect provided
  if (!redirect) {
    return defaultRedirect
  }

  // Remove any leading/trailing whitespace
  const sanitized = redirect.trim()

  // Must start with / (relative path only)
  if (!sanitized.startsWith('/')) {
    console.warn('[OAuth Security] Blocked absolute URL redirect:', sanitized)
    return defaultRedirect
  }

  // Block protocol-relative URLs (//evil.com)
  if (sanitized.startsWith('//')) {
    console.warn('[OAuth Security] Blocked protocol-relative redirect:', sanitized)
    return defaultRedirect
  }

  // Block javascript: and data: URIs
  if (sanitized.toLowerCase().match(/^(javascript|data|vbscript):/)) {
    console.warn('[OAuth Security] Blocked dangerous URI scheme:', sanitized)
    return defaultRedirect
  }

  // Extract path without query params and hash
  const path = sanitized.split('?')[0].split('#')[0]

  // Check if path is in whitelist
  if (ALLOWED_REDIRECTS.includes(path)) {
    return sanitized // Return with query params if whitelisted
  }

  // Check if path starts with allowed prefix (for dynamic routes)
  const isAllowedPrefix = ALLOWED_REDIRECTS.some(allowed =>
    path.startsWith(allowed + '/')
  )

  if (isAllowedPrefix) {
    return sanitized
  }

  // Not in whitelist
  console.warn('[OAuth Security] Blocked non-whitelisted redirect:', sanitized)
  return defaultRedirect
}

/**
 * Validate OAuth state parameter
 * Prevents CSRF attacks in OAuth flows
 */
export function validateOAuthState(
  receivedState: string | null,
  expectedState: string | null
): boolean {
  if (!receivedState || !expectedState) {
    console.error('[OAuth Security] Missing state parameter')
    return false
  }

  if (receivedState !== expectedState) {
    console.error('[OAuth Security] State mismatch - possible CSRF attack')
    return false
  }

  return true
}

/**
 * Generate secure random state for OAuth
 */
export function generateOAuthState(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older environments
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
