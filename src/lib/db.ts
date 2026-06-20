import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const rawConnectionString = process.env.DATABASE_URL

  if (!rawConnectionString) {
    console.error('❌ DATABASE_URL is not defined')
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Supabase's pooler presents a self-signed certificate. We disable cert
  // verification explicitly via the `ssl` option below. But newer `pg` versions
  // treat `sslmode=require` in the URL as `verify-full`, which then fails the
  // handshake (error P1011) — notably breaking interactive `$transaction`s.
  // Strip any `sslmode` from the URL so our explicit ssl option is authoritative.
  let connectionString = rawConnectionString
  try {
    const u = new URL(rawConnectionString)
    if (u.searchParams.has('sslmode')) {
      u.searchParams.delete('sslmode')
      connectionString = u.toString()
    }
  } catch {
    // Non-URL connection string — leave as-is.
  }

  // Connection pool optimization for serverless
  const pool = new Pool({
    connectionString,
    // Serverless optimizations - keep pool small
    max: parseInt(process.env.DATABASE_POOL_SIZE || '3'),
    min: 0, // No idle connections in serverless
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false }, // Supabase pooler uses self-signed cert
  })

  // Pool error handling
  pool.on('error', (err) => {
    console.error('Unexpected Prisma pool error:', err)
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
  })
}

// Singleton pattern for serverless (prevents connection exhaustion)
function getOrCreatePrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const client = createPrismaClient()
  globalForPrisma.prisma = client
  return client
}

export const prisma = getOrCreatePrisma()

// Graceful shutdown
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    try {
      await prisma.$disconnect()
      console.log('📊 Prisma disconnected gracefully')
    } catch (err) {
      console.error('Error during Prisma shutdown:', err)
    }
  }

  process.on('beforeExit', shutdown)
  process.on('SIGTERM', shutdown)
}

export default prisma
