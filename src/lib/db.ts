import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined')
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Connection pool optimization for serverless
  const pool = new Pool({
    connectionString,
    // Serverless optimizations - keep pool small
    max: parseInt(process.env.DATABASE_POOL_SIZE || '3'),
    min: 0, // No idle connections in serverless
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
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
