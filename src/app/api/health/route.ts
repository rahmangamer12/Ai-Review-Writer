import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Health Check Endpoint
 *
 * Returns status of all integrations.
 * Used by monitoring tools and deployment verification.
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error' | 'degraded'; latencyMs?: number; message?: string }> = {}

  // 1. Database (raw query to avoid Prisma SSL issues)
  const dbStart = Date.now()
  try {
    const { Pool } = await import('pg')
    const dbUrl = new URL(process.env.DATABASE_URL!)
    const pool = new Pool({
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port),
      database: dbUrl.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
    })
    const client = await pool.connect()
    await client.query('SELECT 1 as test')
    client.release()
    await pool.end()
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    checks.database = {
      status: 'error',
      latencyMs: Date.now() - dbStart,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 2. Clerk Auth
  const clerkStart = Date.now()
  try {
    const { auth } = await import('@clerk/nextjs/server')
    // Just verify the module loads and can be called (no actual auth needed for health)
    if (typeof auth === 'function') {
      checks.clerk = { status: 'ok', latencyMs: Date.now() - clerkStart }
    } else {
      checks.clerk = { status: 'degraded', message: 'Auth module loaded but unexpected export' }
    }
  } catch (error) {
    checks.clerk = {
      status: 'error',
      latencyMs: Date.now() - clerkStart,
      message: error instanceof Error ? error.message : 'Failed to load Clerk'
    }
  }

  // 3. LongCat AI
  const aiStart = Date.now()
  try {
    const hasKey = !!process.env.LONGCAT_AI_API_KEY
    checks.ai = {
      status: hasKey ? 'ok' : 'degraded',
      latencyMs: Date.now() - aiStart,
      message: hasKey ? undefined : 'LONGCAT_AI_API_KEY not set'
    }
  } catch (error) {
    checks.ai = { status: 'error', message: error instanceof Error ? error.message : 'Unknown' }
  }

  // 4. Redis (Upstash)
  const redisStart = Date.now()
  try {
    const hasUrl = !!process.env.UPSTASH_REDIS_REST_URL
    const hasToken = !!process.env.UPSTASH_REDIS_REST_TOKEN
    checks.redis = {
      status: (hasUrl && hasToken) ? 'ok' : 'degraded',
      latencyMs: Date.now() - redisStart,
      message: (hasUrl && hasToken) ? undefined : 'UPSTASH_REDIS_REST_URL/TOKEN not set'
    }
  } catch (error) {
    checks.redis = { status: 'error', message: error instanceof Error ? error.message : 'Unknown' }
  }

  // 5. LemonSqueezy
  const lsStart = Date.now()
  try {
    const hasKey = !!process.env.LEMONSQUEEZY_API_KEY
    const hasStore = !!process.env.LEMONSQUEEZY_STORE_ID
    checks.payments = {
      status: (hasKey && hasStore) ? 'ok' : 'degraded',
      latencyMs: Date.now() - lsStart,
      message: (hasKey && hasStore) ? undefined : 'LemonSqueezy not fully configured'
    }
  } catch (error) {
    checks.payments = { status: 'error', message: error instanceof Error ? error.message : 'Unknown' }
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok')
  const anyError = Object.values(checks).some(c => c.status === 'error')
  const overall = anyError ? 'error' : allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    checks,
    environment: process.env.NODE_ENV ?? 'unknown',
    uptime: process.uptime(),
  }, {
    status: overall === 'error' ? 503 : 200
  })
}
