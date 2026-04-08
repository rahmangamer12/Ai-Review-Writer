/**
 * Memory-based Rate Limiting
 * Protects API routes from abuse without external dependencies
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (userId, IP, etc.)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { success: boolean, remaining: number, resetTime: number }
   */
  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{
    success: boolean
    remaining: number
    resetTime: number
    limit: number
  }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // No entry or expired - create new
    if (!entry || entry.resetTime < now) {
      const resetTime = now + windowMs
      this.store.set(identifier, {
        count: 1,
        resetTime
      })
      return {
        success: true,
        remaining: limit - 1,
        resetTime,
        limit
      }
    }

    // Entry exists and not expired
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        limit
      }
    }

    // Increment count
    entry.count++
    this.store.set(identifier, entry)

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
      limit
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Get current status without incrementing
   */
  getStatus(identifier: string): {
    count: number
    remaining: number
    resetTime: number
  } | null {
    const entry = this.store.get(identifier)
    if (!entry) return null

    const now = Date.now()
    if (entry.resetTime < now) {
      this.store.delete(identifier)
      return null
    }

    return {
      count: entry.count,
      remaining: Math.max(0, 10 - entry.count), // Default limit
      resetTime: entry.resetTime
    }
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Singleton instance
const rateLimiter = new MemoryRateLimiter()

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => rateLimiter.destroy())
  process.on('SIGINT', () => rateLimiter.destroy())
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // AI endpoints - expensive operations
  AI_GENERATION: {
    limit: 10,
    windowMs: 60 * 1000, // 10 requests per minute
    message: 'Too many AI requests. Please wait a moment.'
  },
  AI_ANALYSIS: {
    limit: 20,
    windowMs: 60 * 1000, // 20 requests per minute
    message: 'Too many analysis requests. Please slow down.'
  },

  // Standard API endpoints
  API_STANDARD: {
    limit: 100,
    windowMs: 60 * 1000, // 100 requests per minute
    message: 'Too many requests. Please try again later.'
  },

  // Authentication endpoints
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  },

  // Webhook endpoints
  WEBHOOK: {
    limit: 50,
    windowMs: 60 * 1000, // 50 requests per minute
    message: 'Webhook rate limit exceeded.'
  }
}

/**
 * Rate limit middleware helper
 */
export async function rateLimit(
  identifier: string,
  config: typeof RATE_LIMITS.AI_GENERATION
): Promise<{
  success: boolean
  remaining: number
  resetTime: number
  limit: number
  message?: string
}> {
  const result = await rateLimiter.check(
    identifier,
    config.limit,
    config.windowMs
  )

  if (!result.success) {
    return {
      ...result,
      message: config.message
    }
  }

  return result
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: {
  limit: number
  remaining: number
  resetTime: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  }
}

export { rateLimiter }
