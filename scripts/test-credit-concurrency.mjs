// Concurrency proof for Phase 1.2 — atomic credit deduction.
//
// Exercises the EXACT SQL that Prisma's
//   user.updateMany({ where:{ id, aiCredits:{ gte:n } }, data:{ aiCredits:{ decrement:n } } })
// emits, under heavy parallelism, and asserts that N concurrent deductions of a
// user with M credits can NEVER overspend or drive the balance negative.
//
// Usage: node scripts/test-credit-concurrency.mjs
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

function envFromFile(key) {
  const line = readFileSync('.env', 'utf8')
    .split('\n')
    .find((l) => l.startsWith(key + '='))
  if (!line) return undefined
  return line.slice(key.length + 1).replace(/^"|"$/g, '').trim()
}

const connectionString = process.env.DATABASE_URL || envFromFile('DATABASE_URL')
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 20 })

const M = 20 // starting credits
const N = 60 // concurrent deduction attempts of 1 credit each
const id = `test-concurrency-${randomUUID()}`
const email = `${id}@autoreview.local`

async function deductOnce() {
  // Mirrors CreditsManager.useCredits atomic guard
  const res = await pool.query(
    'UPDATE "User" SET "aiCredits" = "aiCredits" - $1 WHERE "id" = $2 AND "aiCredits" >= $1 RETURNING "aiCredits"',
    [1, id]
  )
  return res.rowCount === 1
}

async function main() {
  let failures = []
  try {
    await pool.query(
      'INSERT INTO "User" ("id","email","name","planType","aiCredits","promptCount","maxPlatforms","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())',
      [id, email, 'Concurrency Test', 'free', M, 0, 1]
    )

    const results = await Promise.all(Array.from({ length: N }, () => deductOnce()))
    const successes = results.filter(Boolean).length

    const { rows } = await pool.query('SELECT "aiCredits" FROM "User" WHERE "id" = $1', [id])
    const finalBalance = rows[0]?.aiCredits

    if (successes !== M) failures.push(`expected ${M} successful deductions, got ${successes}`)
    if (finalBalance !== 0) failures.push(`expected final balance 0, got ${finalBalance}`)
    if (finalBalance < 0) failures.push(`balance went NEGATIVE: ${finalBalance}`)

    console.log(`[concurrency] started=${M} credits, attempts=${N}, successes=${successes}, finalBalance=${finalBalance}`)
    if (failures.length) {
      console.error('[concurrency] FAIL:', failures.join('; '))
      process.exitCode = 1
    } else {
      console.log('[concurrency] PASS: no overspend, no negative balance, exactly M deductions.')
    }
  } finally {
    await pool.query('DELETE FROM "CreditUsage" WHERE "userId" = $1', [id]).catch(() => {})
    await pool.query('DELETE FROM "User" WHERE "id" = $1', [id]).catch(() => {})
    await pool.end()
  }
}

main().catch((e) => {
  console.error('[concurrency] ERROR', e)
  process.exit(1)
})
