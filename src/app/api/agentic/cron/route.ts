/**
 * Agentic Automation Cron
 *
 * Runs the Auto-Reply agent automatically for users who enabled
 * `agentAutoReply` (Growth/Business). Drafts replies for pending reviews
 * and saves them as drafts (status AI_replied) — never auto-posts publicly.
 *
 * Triggered by GitHub Actions:
 *   GET /api/agentic/cron  with  Authorization: Bearer ${SCHEDULER_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { longcatAI } from '@/lib/longcatAI'
import { aiProvider } from '@/lib/ai/provider'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_USERS_PER_RUN = 25
const MAX_REVIEWS_PER_USER = 3

export async function GET(request: NextRequest) {
  // Verify scheduler secret
  const authHeader = request.headers.get('authorization')
  if (!process.env.SCHEDULER_SECRET || authHeader !== `Bearer ${process.env.SCHEDULER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!longcatAI.hasApiKey()) {
    return NextResponse.json({ error: 'AI provider not configured' }, { status: 503 })
  }

  // Users who opted into auto-reply automation on an eligible plan with credits left.
  const users = await prisma.user.findMany({
    where: {
      agentAutoReply: true,
      planType: { in: ['growth', 'business'] },
      aiCredits: { gt: 0 },
    },
    select: { id: true },
    take: MAX_USERS_PER_RUN,
  })

  const cost = CreditsManager.getCreditCost('auto_reply')
  let usersProcessed = 0
  let repliesDrafted = 0

  for (const user of users) {
    try {
      const pending = await prisma.review.findMany({
        where: { userId: user.id, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: MAX_REVIEWS_PER_USER,
      })
      if (pending.length === 0) continue

      let draftedForUser = 0

      for (const review of pending) {
        const reviewText = review.content || ''
        if (!reviewText) continue

        // Sentiment (fall back to rating heuristic on failure)
        let sentiment = 'neutral'
        try {
          const s = await aiProvider.analyzeSentiment(reviewText)
          sentiment = s.sentiment
        } catch {
          sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
        }

        // Draft reply
        let aiReply = ''
        try {
          const result = await aiProvider.generateReviewReply({
            reviewText,
            rating: review.rating,
            sentiment,
            tone: 'friendly',
            authorName: review.authorName || 'there',
            escalate: review.rating <= 2 || sentiment === 'negative',
          })
          aiReply = result.response
        } catch {
          continue // skip this review on generation failure
        }
        if (!aiReply) continue

        // Deduct credit atomically; stop this user if out of credits
        const credit = await CreditsManager.useCredits(
          user.id,
          cost,
          'auto_reply',
          `Scheduled auto-reply for review ${review.id}`,
          { reviewId: review.id, automated: true },
        )
        if (!credit.success) break

        // Save as draft (human approval preserved)
        await prisma.review.update({
          where: { id: review.id },
          data: { sentimentLabel: sentiment, aiReplyText: aiReply, status: 'AI_replied' },
        })

        draftedForUser++
        repliesDrafted++
      }

      if (draftedForUser > 0) {
        usersProcessed++
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'agent',
            title: `Auto-Reply agent drafted ${draftedForUser} repl${draftedForUser === 1 ? 'y' : 'ies'}`,
            message: `Your Auto-Reply agent prepared ${draftedForUser} draft repl${draftedForUser === 1 ? 'y' : 'ies'}. Review and approve them in Reviews.`,
          },
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[Agentic Cron] user failed', user.id, err)
    }
  }

  return NextResponse.json({
    success: true,
    usersConsidered: users.length,
    usersProcessed,
    repliesDrafted,
    timestamp: new Date().toISOString(),
  })
}
