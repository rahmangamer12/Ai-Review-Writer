// Enable agentic features for testing.
//
// Sets a user to the Growth plan (so auto_reply/triage feature gates pass),
// tops up credits, and seeds a few sample reviews (including one urgent 1-star)
// so the Auto-Reply and Triage agents have something to work on.
//
// Usage:
//   node scripts/enable-agentic-test.mjs                 # uses the most recently created user
//   node scripts/enable-agentic-test.mjs you@email.com   # target by email
//   node scripts/enable-agentic-test.mjs user_abc123     # target by Clerk user id
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { randomUUID } from 'crypto'

function env(key) {
  const l = readFileSync('.env', 'utf8').split('\n').find((x) => x.startsWith(key + '='))
  return l ? l.slice(key.length + 1).replace(/^"|"$/g, '').trim() : undefined
}
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || env('DATABASE_URL')).replace(/([?&])sslmode=[^&]*/, '$1sslmode=no-verify'),
  ssl: { rejectUnauthorized: false },
})

const arg = process.argv[2]

async function main() {
  // Resolve target user
  let user
  if (arg && arg.includes('@')) {
    user = (await pool.query('SELECT * FROM "User" WHERE email=$1', [arg])).rows[0]
  } else if (arg) {
    user = (await pool.query('SELECT * FROM "User" WHERE id=$1', [arg])).rows[0]
  } else {
    user = (await pool.query('SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1')).rows[0]
  }
  if (!user) {
    console.error('No user found. Sign in to the app at least once first, then re-run.')
    process.exit(1)
  }

  // Upgrade to Growth + top up credits
  await pool.query(
    'UPDATE "User" SET "planType"=$1, "maxPlatforms"=$2, "aiCredits"=GREATEST("aiCredits",$3), "updatedAt"=now() WHERE id=$4',
    ['growth', 10, 50, user.id]
  )

  // Ensure a manual platform exists
  let platform = (await pool.query('SELECT * FROM "ConnectedPlatform" WHERE "userId"=$1 AND "platformType"=$2', [user.id, 'manual'])).rows[0]
  if (!platform) {
    const pid = randomUUID()
    await pool.query(
      'INSERT INTO "ConnectedPlatform"(id,"userId","platformType",status,credentials,"lastSyncedAt","createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,now(),now(),now())',
      [pid, user.id, 'manual', 'connected', JSON.stringify({ source: 'agentic_test_seed' })]
    )
    platform = { id: pid }
  }

  // Seed sample reviews (only if the user has none pending)
  const pending = (await pool.query('SELECT count(*)::int n FROM "Review" WHERE "userId"=$1 AND status=$2', [user.id, 'pending'])).rows[0].n
  const samples = [
    { author: 'Ayesha Khan', rating: 5, content: 'Amazing service and friendly staff! Highly recommend.', s: 'positive' },
    { author: 'John Davis', rating: 3, content: 'Food was okay but the wait time was a bit long.', s: 'neutral' },
    { author: 'Bilal Ahmed', rating: 1, content: 'Terrible experience. Rude staff and cold food. Never coming back!', s: 'negative' },
  ]
  let created = 0
  if (pending === 0) {
    for (const r of samples) {
      await pool.query(
        'INSERT INTO "Review"(id,"platformId","userId","authorName",content,rating,"sentimentLabel",status,"sourceDate","createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,$8,now(),now(),now())',
        [randomUUID(), platform.id, user.id, r.author, r.content, r.rating, r.s, 'pending']
      )
      created++
    }
  }

  console.log('────────────────────────────────────────')
  console.log('✅ Agentic test enabled for:', user.email)
  console.log('   plan = growth, credits >= 50, platforms = 10')
  console.log('   reviews seeded:', created, created === 0 ? '(already had pending reviews)' : '(incl. 1 urgent 1-star)')
  console.log('')
  console.log('Now test:')
  console.log('  • Dashboard or Reviews page → run the AI agent (auto-reply drafts)')
  console.log('  • Triage: GET /api/agentic/triage with header  Authorization: Bearer <SCHEDULER_SECRET>')
  console.log('  • Or GitHub → Actions → Scheduled Jobs → Run workflow')
  console.log('────────────────────────────────────────')
  await pool.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
