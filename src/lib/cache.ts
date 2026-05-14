/**
 * Simple in-memory cache with TTL support
 * For production, replace with Redis/Upstash
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private maxSize = 1000
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000)
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set a value in cache with TTL (in seconds)
   */
  set<T>(key: string, value: T, ttlSeconds = 300): void {
    // Prevent unbounded growth
    if (this.store.size >= this.maxSize) {
      this.evictOldest()
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.store.size
  }

  /**
   * Invalidate keys matching a pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`)
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    // Remove oldest 20% of entries
    const entries = Array.from(this.store.entries())
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.2))
    for (const [key] of toRemove) {
      this.store.delete(key)
    }
  }

  /**
   * Destroy the cache (cleanup interval)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Singleton instance
export const cache = new MemoryCache()

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => cache.destroy())
  process.on('SIGINT', () => cache.destroy())
}

/**
 * Cache decorator for async functions
 */
export function cached<T>(
  keyPrefix: string,
  ttlSeconds = 300
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`
      const cached = cache.get<T>(cacheKey)

      if (cached !== null) {
        return cached
      }

      const result = await originalMethod.apply(this, args)
      cache.set(cacheKey, result, ttlSeconds)
      return result
    }

    return descriptor
  }
}
