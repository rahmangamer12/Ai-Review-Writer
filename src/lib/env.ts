/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at module load time.
 * Fails fast with descriptive error if any are missing.
 *
 * This runs on both server and client (for public vars).
 * Server-only vars are only validated on the server.
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const

const SERVER_ONLY_VARS = [
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'LONGCAT_AI_API_KEY',
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'ENCRYPTION_KEY',
  'SCHEDULER_SECRET',
] as const

function formatMissing(vars: readonly string[]): string {
  return vars.map(v => `  - ${v}`).join('\n')
}

/**
 * Validate environment variables. Call once at app startup.
 * Throws descriptive Error if required vars are missing.
 */
export function validateEnv(): void {
  const isServer = typeof window === 'undefined'

  // On client, only check public vars
  const requiredToCheck = isServer
    ? [...REQUIRED_ENV_VARS, ...SERVER_ONLY_VARS]
    : REQUIRED_ENV_VARS.filter(v => v.startsWith('NEXT_PUBLIC_'))

  const missing = requiredToCheck.filter(v => !process.env[v])

  if (missing.length > 0) {
    const envList = formatMissing(missing)
    const platform = isServer ? 'server' : 'client'

    console.error(`
╔══════════════════════════════════════════════════════════════╗
║  MISSING ENVIRONMENT VARIABLES (${platform})                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  The following environment variables are required but not    ║
║  set. Add them to your .env file or Vercel environment:      ║
║                                                              ║
${envList}
║                                                              ║
║  For Vercel: vercel env add <NAME>                          ║
║  For local:  Add to .env (never commit .env)                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `)

    // Only throw on server (client can't access server env vars anyway)
    if (isServer) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
}

// Auto-validate on import (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    // Log but don't crash — let the dev see the error in logs
    // In production, this should be fatal
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

/**
 * Get an environment variable with optional default.
 * Returns undefined if not set and no default provided.
 */
export function env(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue
}

/**
 * Check if running in production.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
