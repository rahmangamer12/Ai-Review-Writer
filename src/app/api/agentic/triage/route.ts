/**
 * Triage/Escalation Agent
 *
 * Automatically detects urgent low-star reviews and creates alerts.
 * Reviews with rating ≤ 2 are flagged for immediate attention.
 *
 * This can be triggered:
 * - Manually via POST /api/agentic/triage
 * - Automatically via Vercel Cron (every hour)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface TriageResult {
  reviewId: string
  authorName: string
  rating: number
  content: string
  urgency: 'critical' | 'high' | 'medium'
  reason: string
  suggestedAction: string
}

/**
 * Triage Agent — Detect urgent reviews
 */
export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature access
    const hasAccess = await CreditsManager.hasFeatureAccess(userId, 'auto_reply')
    if (!hasAccess) {
      return NextResponse.json({
        error: 'Triage requires Growth or Business plan.',
        upgradeUrl: '/subscription',
      }, { status: 403 })
    }

    console.log('[Triage] Starting review triage for user:', userId)

    // Find unreplied reviews with low ratings (≤ 2 stars)
    const urgentReviews = await prisma.review.findMany({
      where: {
        userId,
        status: 'pending',
        rating: { lte: 2 },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { platform: { select: { platformType: true } } },
    })

    if (urgentReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No urgent reviews found',
        triaged: 0,
        alerts: [],
      })
    }

    // Analyze each review for urgency
    const alerts: TriageResult[] = urgentReviews.map((review) => {
      const urgency = review.rating === 1 ? 'critical' : 'high'
      const reason = getUrgencyReason(review.rating, review.content)
      const suggestedAction = getSuggestedAction(review.rating, review.content)

      return {
        reviewId: review.id,
        authorName: review.authorName,
        rating: review.rating,
        content: review.content.substring(0, 200),
        urgency,
        reason,
        suggestedAction,
      }
    })

    // Deduct credit for triage analysis
    // eslint-disable-next-line react-hooks/rules-of-hooks -- static method, not a React Hook
    const creditResult = await CreditsManager.useCredits(
      userId,
      1,
      'triage_analysis',
      `Triage analysis: ${alerts.length} urgent reviews found`,
      { urgentCount: alerts.length }
    )

    console.log(`[Triage] Found ${alerts.length} urgent reviews for user ${userId}`)

    return NextResponse.json({
      success: true,
      triaged: alerts.length,
      alerts,
      creditsRemaining: creditResult.balanceAfter,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Triage] Error:', error)
    return NextResponse.json({ error: 'Triage failed' }, { status: 500 })
  }
}

/**
 * Cron endpoint — runs hourly to check for urgent reviews
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.SCHEDULER_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Triage Cron] Running hourly triage check...')

    // Find all users with pending urgent reviews
    const urgentReviews = await prisma.review.findMany({
      where: {
        status: 'pending',
        rating: { lte: 2 },
        // Only users who keep scheduled triage alerts enabled (default on).
        user: { agentTriageAlerts: true },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, email: true, planType: true } },
        platform: { select: { platformType: true } },
      },
    })

    // Group by user
    const userAlerts = new Map<string, typeof urgentReviews>()
    for (const review of urgentReviews) {
      const userId = review.userId
      if (!userAlerts.has(userId)) {
        userAlerts.set(userId, [])
      }
      userAlerts.get(userId)!.push(review)
    }

    console.log(`[Triage Cron] Found ${urgentReviews.length} urgent reviews across ${userAlerts.size} users`)

    // Create de-duplicated damage-control notifications. To avoid hourly spam,
    // skip users who already have an unread 'urgent' alert from the last 12h.
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)
    let notified = 0
    for (const [uid, reviews] of userAlerts) {
      try {
        const recent = await prisma.notification.findFirst({
          where: { userId: uid, type: 'urgent', read: false, createdAt: { gte: twelveHoursAgo } },
          select: { id: true },
        })
        if (recent) continue

        const critical = reviews.filter((r) => r.rating === 1).length
        await prisma.notification.create({
          data: {
            userId: uid,
            type: 'urgent',
            title: `${reviews.length} urgent review${reviews.length === 1 ? '' : 's'} need attention`,
            message:
              `You have ${reviews.length} low-rated review${reviews.length === 1 ? '' : 's'}` +
              (critical ? ` (${critical} at 1★)` : '') +
              `. Respond quickly to limit reputation damage.`,
          },
        })
        notified++
      } catch (e) {
        console.error('[Triage Cron] Notification failed for user', uid, e)
      }
    }

    return NextResponse.json({
      success: true,
      usersWithAlerts: userAlerts.size,
      totalUrgent: urgentReviews.length,
      notificationsCreated: notified,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Triage Cron] Error:', error)
    return NextResponse.json({ error: 'Triage cron failed' }, { status: 500 })
  }
}

function getUrgencyReason(rating: number, content: string): string {
  if (rating === 1) return 'Extremely negative review — immediate response critical'

  const lowerContent = content.toLowerCase()
  const urgentKeywords = ['never', 'worst', 'terrible', 'awful', 'scam', 'fraud', 'lawsuit', 'lawyer']
  const hasUrgentKeywords = urgentKeywords.some(k => lowerContent.includes(k))

  if (hasUrgentKeywords) return 'Contains urgent keywords requiring immediate attention'
  return 'Negative review — prompt response recommended'
}

function getSuggestedAction(rating: number, content: string): string {
  if (rating === 1) {
    return 'Respond immediately with sincere apology and offer to make it right privately'
  }

  const lowerContent = content.toLowerCase()
  if (lowerContent.includes('price') || lowerContent.includes('expensive')) {
    return 'Acknowledge pricing concern, explain value, consider offering discount'
  }
  if (lowerContent.includes('service') || lowerContent.includes('staff')) {
    return 'Apologize for service issue, explain steps taken to improve'
  }
  if (lowerContent.includes('wait') || lowerContent.includes('slow')) {
    return 'Acknowledge wait time concern, explain any delays'
  }
  return 'Respond with empathy, address specific concerns, offer solution'
}
