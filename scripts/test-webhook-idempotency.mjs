// Verifies Phase 2.1 (idempotent webhook grant) and Phase 2.2 (monthly reset)
// against the live DB, mirroring the exact DB operations the handlers perform.
//
// Usage: node scripts/test-webhook-idempotency.mjs
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

function envFromFile(key) {
  const line = readFileSync('.env', 'utf8').split('\n').find((l) => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '').trim() : undefined
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || envFromFile('DATABASE_URL'),
  ssl: { rejectUnauthorized: false },
  max: 10,
})

const id = `test-webhook-${randomUUID()}`
const email = `${id}@autoreview.local`
const idemKey = `lemonsqueezy:subscription_payment_success:${randomUUID()}`
const GRANT = 300 // growth allotment
const START = 100

// Mirror: claim WebhookEvent (unique id) then increment credits. Duplicate
// deliveries fail the claim and must NOT grant again.
async function processClaimAndGrant() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    try {
      await client.query(
        'INSERT INTO "WebhookEvent" ("id","provider","eventName","processedAt") VALUES ($1,$2,$3,now())',
        [idemKey, 'lemonsqueezy', 'subscription_payment_success']
      )
    } catch (e) {
      await client.query('ROLLBACK')
      if (e.code === '23505') return 'skipped' // unique_violation
      throw e
    }
    await client.query('UPDATE "User" SET "aiCredits" = "aiCredits" + $1 WHERE "id" = $2', [GRANT, id])
    await client.query('COMMIT')
    return 'granted'
  } finally {
    client.release()
  }
}

async function main() {
  const failures = []
  try {
    await pool.query(
      'INSERT INTO "User" ("id","email","name","planType","aiCredits","promptCount","maxPlatforms","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())',
      [id, email, 'Webhook Test', 'growth', START, 0, 10]
    )

    // Replay the SAME event 4x concurrently
    const outcomes = await Promise.all([1, 2, 3, 4].map(() => processClaimAndGrant().catch(() => 'error')))
    const granted = outcomes.filter((o) => o === 'granted').length
    const { rows } = await pool.query('SELECT "aiCredits" FROM "User" WHERE "id" = $1', [id])
    const balance = rows[0]?.aiCredits

    if (granted !== 1) failures.push(`expected exactly 1 grant, got ${granted} (${outcomes.join(',')})`)
    if (balance !== START + GRANT) failures.push(`expected balance ${START + GRANT}, got ${balance}`)
    console.log(`[idempotency] outcomes=[${outcomes.join(',')}] grantedCount=${granted} balance=${balance}`)

    // Phase 2.2 — monthly reset to allotment
    await pool.query('UPDATE "User" SET "creditsRenewAt" = now() - interval \'1 day\', "aiCredits" = 5 WHERE "id" = $1', [id])
    await pool.query(
      'UPDATE "User" SET "aiCredits" = $1, "creditsRenewAt" = now() + interval \'1 month\' WHERE "id" = $2 AND ("creditsRenewAt" IS NULL OR "creditsRenewAt" <= now())',
      [GRANT, id]
    )
    const after = (await pool.query('SELECT "aiCredits" FROM "User" WHERE "id" = $1', [id])).rows[0]?.aiCredits
    if (after !== GRANT) failures.push(`reset: expected ${GRANT}, got ${after}`)
    console.log(`[reset] after monthly reset balance=${after} (expected ${GRANT})`)

    if (failures.length) {
      console.error('[webhook-test] FAIL:', failures.join('; '))
      process.exitCode = 1
    } else {
      console.log('[webhook-test] PASS: grant once on replay; monthly reset to allotment.')
    }
  } finally {
    await pool.query('DELETE FROM "CreditUsage" WHERE "userId" = $1', [id]).catch(() => {})
    await pool.query('DELETE FROM "WebhookEvent" WHERE "id" = $1', [idemKey]).catch(() => {})
    await pool.query('DELETE FROM "User" WHERE "id" = $1', [id]).catch(() => {})
    await pool.end()
  }
}

main().catch((e) => { console.error('[webhook-test] ERROR', e); process.exit(1) })
