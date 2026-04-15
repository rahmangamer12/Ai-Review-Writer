/**
 * Rate Limiting — Upstash Redis (Serverless-safe sliding window)
 *
 * Falls back to in-memory limiter when UPSTASH env vars are not set (local dev).
 * Callers use the same rateLimit() / RATE_LIMITS / getRateLimitHeaders() API.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  limit: number
  windowMs: number
  message: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  limit: number
  message?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  AI_GENERATION: {
    limit: 10,
    windowMs: 60 * 1000,
    message: 'Too many AI requests. Please wait a moment.',
  },
  AI_ANALYSIS: {
    limit: 20,
    windowMs: 60 * 1000,
    message: 'Too many analysis requests. Please slow down.',
  },
  API_STANDARD: {
    limit: 100,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again later.',
  },
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts. Please try again later.',
  },
  WEBHOOK: {
    limit: 50,
    windowMs: 60 * 1000,
    message: 'Webhook rate limit exceeded.',
  },
} as const

// ─── Upstash Implementation ───────────────────────────────────────────────────

async function getUpstashLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    const redis = new Redis({ url, token })

    return { Ratelimit, redis }
  } catch {
    return null
  }
}

// ─── Memory Fallback (Dev / Missing Env) ─────────────────────────────────────

interface MemEntry { count: number; resetTime: number }
const memStore = new Map<string, MemEntry>()

function memCheck(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs
    memStore.set(key, { count: 1, resetTime })
    return { success: true, remaining: limit - 1, resetTime, limit }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetTime: entry.resetTime, limit }
  }

  entry.count++
  memStore.set(key, entry)
  return { success: true, remaining: limit - entry.count, resetTime: entry.resetTime, limit }
}

// Cleanup every 5 min (dev only — Upstash handles this in prod)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of memStore.entries()) {
      if (v.resetTime < now) memStore.delete(k)
    }
  }, 5 * 60 * 1000)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const upstash = await getUpstashLimiter()

  if (upstash) {
    const { Ratelimit, redis } = upstash
    const windowSec = Math.ceil(config.windowMs / 1000)

    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${windowSec} s`),
      analytics: false, // Set to true if you want Upstash analytics dashboard
      prefix: `rl:${identifier.split(':')[0]}`, // Namespace per endpoint type
    })

    const { success, remaining, reset } = await limiter.limit(identifier)

    const result: RateLimitResult = {
      success,
      remaining,
      resetTime: reset,
      limit: config.limit,
    }

    if (!success) result.message = config.message
    return result
  }

  // Fallback: memory-based (dev or missing env vars)
  const result = memCheck(identifier, config.limit, config.windowMs)
  if (!result.success) result.message = config.message
  return result
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
}

// Legacy compat export (used in a few places)
export const rateLimiter = {
  check: (id: string, limit: number, windowMs: number) =>
    rateLimit(id, { limit, windowMs, message: 'Rate limit exceeded' }),
  reset: (id: string) => memStore.delete(id),
  destroy: () => memStore.clear(),
}
