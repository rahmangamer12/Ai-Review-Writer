/**
 * Performance monitoring utilities for AutoReview AI
 */

// ─── Web Vitals Tracking ────────────────────────────────────────────────────
export function reportWebVitals(metric: {
  id: string
  name: string
  label: string
  value: number
  delta?: number
}) {
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics endpoint
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    //   keepalive: true,
    // })

    // Or use console for debugging
    console.debug('[Web Vital]', metric.name, Math.round(metric.value), metric.label)
  }
}

// ─── API Response Time Tracker ──────────────────────────────────────────────
export class ApiTimer {
  private startTime: number
  private endpoint: string

  constructor(endpoint: string) {
    this.startTime = performance.now()
    this.endpoint = endpoint
  }

  end(metadata?: Record<string, unknown>): number {
    const duration = performance.now() - this.startTime

    // Log slow requests
    if (duration > 1000) {
      console.warn(`[Slow API] ${this.endpoint} took ${Math.round(duration)}ms`, metadata)
    }

    return duration
  }
}

// ─── Memory Usage Monitor ───────────────────────────────────────────────────
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024),
      total: Math.round(usage.heapTotal / 1024 / 1024),
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    }
  }

  // Browser memory API (Chrome only)
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const mem = (performance as any).memory
    return {
      used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
      total: Math.round(mem.totalJSHeapSize / 1024 / 1024),
      percentage: Math.round((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100),
    }
  }

  return null
}

// ─── Debounce Utility ───────────────────────────────────────────────────────
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ─── Throttle Utility ───────────────────────────────────────────────────────
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ─── Lazy Load Helper ───────────────────────────────────────────────────────
export function lazyLoad<T>(importFn: () => Promise<T>): () => Promise<T> {
  let cached: T | null = null

  return async () => {
    if (cached) return cached
    const module = await importFn()
    cached = module
    return module
  }
}

// ─── Intersection Observer Hook ─────────────────────────────────────────────
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  })
}
