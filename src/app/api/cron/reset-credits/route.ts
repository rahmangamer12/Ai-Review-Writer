/**
 * Monthly Credit Reset — Vercel Cron
 *
 * Makes the advertised "X AI responses per month" truthful (Phase 2.2).
 * Runs daily; for every user whose `creditsRenewAt` is due (or unset), resets
 * `aiCredits` to their plan's monthly allotment and advances the renewal anchor
 * by one month. Writes a `monthly_reset` audit row.
 *
 * Secured by SCHEDULER_SECRET (same as other cron endpoints).
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function addOneMonth(from: Date): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 1)
  return d
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const headerSecret = request.headers.get('x-scheduler-secret')
  const secret = process.env.SCHEDULER_SECRET
  const authorized =
    !!secret && (authHeader === `Bearer ${secret}` || headerSecret === secret)

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const nextRenew = addOneMonth(now)

  try {
    // Process due users in batches to stay within serverless limits.
    const dueUsers = await prisma.user.findMany({
      where: {
        OR: [{ creditsRenewAt: null }, { creditsRenewAt: { lte: now } }],
      },
      select: { id: true, planType: true, aiCredits: true },
      take: 500,
    })

    let reset = 0
    for (const user of dueUsers) {
      const allotment = CreditsManager.getPlanCredits(user.planType)
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: user.id },
            data: { aiCredits: allotment, creditsRenewAt: nextRenew },
          })
          await tx.creditUsage.create({
            data: {
              userId: user.id,
              action: 'monthly_reset',
              amount: allotment - user.aiCredits, // net change (can be +/-)
              balanceAfter: allotment,
              description: `Monthly reset to ${user.planType} allotment (${allotment} credits)`,
              metadata: { plan: user.planType, previousCredits: user.aiCredits } as any,
            },
          })
        })
        reset++
      } catch (e) {
        console.error('[ResetCredits] Failed for user', user.id, e)
      }
    }

    console.log(`[ResetCredits] Reset ${reset}/${dueUsers.length} due users`)
    return NextResponse.json({
      success: true,
      due: dueUsers.length,
      reset,
      hasMore: dueUsers.length === 500,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[ResetCredits] Fatal error:', error)
    return NextResponse.json({ error: 'Credit reset failed' }, { status: 500 })
  }
}
