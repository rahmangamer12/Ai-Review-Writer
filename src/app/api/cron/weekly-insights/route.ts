/**
 * Weekly Insight Agent — Vercel Cron Job
 *
 * Runs every Monday at 9:00 AM UTC
 * Analyzes review trends and sends email to business owners
 *
 * Setup in vercel.json:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/weekly-insights",
 *       "schedule": "0 9 * * 1"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { longcatAI } from '@/lib/longcatAI'
import { CreditsManager } from '@/lib/credits'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

/**
 * Weekly Insight Agent
 *
 * For each user with reviews:
 * 1. Fetch reviews from the past week
 * 2. Analyze trends (sentiment, rating changes, common themes)
 * 3. Generate one actionable suggestion
 * 4. Save insight to database
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.SCHEDULER_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[WeeklyInsight] Starting weekly insight generation...')

    // Get all users with reviews in the past week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const users = await prisma.user.findMany({
      where: {
        reviews: {
          some: {
            createdAt: { gte: oneWeekAgo },
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        planType: true,
        aiCredits: true,
      },
    })

    console.log(`[WeeklyInsight] Found ${users.length} users with recent reviews`)

    const results = []

    for (const user of users) {
      try {
        // Skip users without email or credits
        if (!user.email || user.aiCredits < 1) continue

        // Check if user has weekly_insights feature
        const hasAccess = await CreditsManager.hasFeatureAccess(user.id, 'weekly_insights')
        if (!hasAccess) continue

        // Fetch user's reviews from the past week
        const reviews = await prisma.review.findMany({
          where: {
            userId: user.id,
            createdAt: { gte: oneWeekAgo },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            rating: true,
            sentimentLabel: true,
            sourceDate: true,
          },
        })

        if (reviews.length === 0) continue

        // Analyze trends
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        const sentimentCounts = {
          positive: reviews.filter(r => r.sentimentLabel === 'positive').length,
          negative: reviews.filter(r => r.sentimentLabel === 'negative').length,
          neutral: reviews.filter(r => r.sentimentLabel === 'neutral').length,
        }

        // Generate insight using AI
        let insight = ''
        try {
          const result = await longcatAI.generateInsights(
            reviews.map(r => ({
              text: r.content || '',
              rating: r.rating,
              date: r.sourceDate.toISOString(),
            }))
          )
          insight = result.summary
        } catch (aiError) {
          console.warn(`[WeeklyInsight] AI failed for user ${user.id}:`, aiError)
          // Fallback to template insight
          insight = generateFallbackInsight(avgRating, sentimentCounts, reviews.length)
        }

        // Deduct credit for insight generation
        // eslint-disable-next-line react-hooks/rules-of-hooks -- static method, not a React Hook
        const creditResult = await CreditsManager.useCredits(
          user.id,
          1,
          'weekly_insight',
          'Weekly insight generation',
          { reviewCount: reviews.length }
        )

        if (!creditResult.success) {
          console.warn(`[WeeklyInsight] Insufficient credits for user ${user.id}`)
          continue
        }

        results.push({
          userId: user.id,
          reviewCount: reviews.length,
          avgRating: avgRating.toFixed(1),
          sentimentCounts,
          insight,
          creditsRemaining: creditResult.balanceAfter,
        })

        console.log(`[WeeklyInsight] Generated insight for user ${user.id}: ${insight.substring(0, 50)}...`)
      } catch (userError) {
        console.error(`[WeeklyInsight] Error processing user ${user.id}:`, userError)
      }
    }

    console.log(`[WeeklyInsight] Completed. Generated ${results.length} insights.`)

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[WeeklyInsight] Fatal error:', error)
    return NextResponse.json(
      { error: 'Weekly insight generation failed' },
      { status: 500 }
    )
  }
}

/**
 * Fallback insight when AI is unavailable
 */
function generateFallbackInsight(
  avgRating: number,
  sentimentCounts: { positive: number; negative: number; neutral: number },
  totalReviews: number
): string {
  const parts: string[] = []

  parts.push(`This week you received ${totalReviews} reviews with an average rating of ${avgRating.toFixed(1)}/5.`)

  if (sentimentCounts.negative > sentimentCounts.positive) {
    parts.push('Negative reviews outpaced positive ones. Consider addressing common complaints.')
  } else if (sentimentCounts.positive > totalReviews * 0.7) {
    parts.push('Most reviews are positive! Great work maintaining quality.')
  }

  if (avgRating < 3.5) {
    parts.push('Your average rating needs attention. Focus on improving customer experience.')
  } else if (avgRating >= 4.5) {
    parts.push('Excellent rating! Keep up the great work.')
  }

  return parts.join(' ')
}
