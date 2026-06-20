import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { longcatAI } from '@/lib/longcatAI'
import { aiProvider } from '@/lib/ai/provider'
import { CreditsManager } from '@/lib/credits'
import { serverError } from '@/lib/apiError'

// POST - Run agentic review processing with REAL AI
// REQUIRES: Growth or Business plan (auto_reply feature)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── Feature Gate: auto_reply requires growth or business plan ──────────
    const hasAutoReply = await CreditsManager.hasFeatureAccess(userId, 'auto_reply')
    if (!hasAutoReply) {
      return NextResponse.json({
        error: 'Auto-reply requires Growth or Business plan. Please upgrade.',
        upgradeUrl: '/subscription',
        currentFeature: 'auto_reply'
      }, { status: 403 })
    }

    console.log('[Agentic] Starting REAL AI agentic review processing for user:', userId)
    const body = await req.json().catch(() => ({}))
    // Default to false — human approval required for safety
    const autoApprove = body?.autoApprove === true && body?.confirmed === true

    if (!longcatAI.hasApiKey()) {
      return NextResponse.json({
        error: 'LONGCAT_AI_API_KEY is not configured. Agentic mode needs a real AI key to process reviews.',
      }, { status: 503 })
    }

    // ─── Credit Check: ensure user has enough credits for batch ────────────
    const MAX_AGENTIC_REVIEWS = 5 // Cap to limit credit cost per run
    const pendingReviews = await prisma.review.findMany({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: MAX_AGENTIC_REVIEWS,
      include: { platform: { select: { platformType: true } } },
    })

    console.log('[Agentic] Found pending reviews:', pendingReviews?.length || 0)

    if (!pendingReviews || pendingReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending reviews to process',
        processed: 0,
        reviews: [],
        ai_provider: 'LongCat AI'
      })
    }

    // Check if user has enough credits for all reviews
    const requiredCredits = pendingReviews.length * CreditsManager.getCreditCost('auto_reply')
    const userCredits = await CreditsManager.getCredits(userId)

    if (userCredits < requiredCredits) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${requiredCredits} but have ${userCredits}.`,
        creditsRemaining: userCredits,
        required: requiredCredits,
        upgradeUrl: '/subscription'
      }, { status: 402 })
    }

    const processedReviews = []
    const auditTrail = [] // Track all actions for audit log

    // Process each review with REAL AI
    for (const review of pendingReviews) {
      try {
        console.log('[Agentic] Processing review:', review.id)

        const reviewText = review.content || ''
        const authorName = review.authorName || 'there'

        // Step 1: Analyze sentiment with REAL AI
        let sentiment = 'neutral'
        let sentimentScore = 0
        try {
          console.log('[Agentic] Analyzing sentiment with LongCat AI...')
          const sentimentResult = await aiProvider.analyzeSentiment(reviewText)
          sentiment = sentimentResult.sentiment
          sentimentScore = sentimentResult.score
          console.log('[Agentic] Sentiment detected:', sentiment, 'Confidence:', sentimentResult.confidence)
        } catch (_e) {
          console.log('[Agentic] Sentiment analysis failed, using rating heuristic')
          sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
        }

        // Step 2: Generate AI reply with REAL AI
        let aiReply = ''
        console.log('[Agentic] Generating reply with LongCat AI...')
        const result = await aiProvider.generateReviewReply({
          reviewText,
          rating: review.rating,
          sentiment,
          tone: 'friendly',
          authorName,
          escalate: review.rating <= 2 || sentiment === 'negative',
        })
        aiReply = result.response
        console.log('[Agentic] AI Reply generated:', aiReply.substring(0, 80) + '...')

        // Step 3: Deduct credit atomically
        // eslint-disable-next-line react-hooks/rules-of-hooks -- CreditsManager.useCredits is a static method, not a React Hook
        const creditResult = await CreditsManager.useCredits(
          userId,
          CreditsManager.getCreditCost('auto_reply'),
          'auto_reply',
          `Agentic auto-reply for review ${review.id}`,
          { reviewId: review.id, platform: review.platform?.platformType }
        )

        if (!creditResult.success) {
          console.error('[Agentic] Credit deduction failed for review:', review.id, creditResult.error)
          break // Stop processing if credits run out
        }

        // Step 4: Save to database (draft status — human must approve)
        await prisma.review.update({
          where: { id: review.id },
          data: {
            sentimentLabel: sentiment,
            aiReplyText: aiReply,
            status: autoApprove ? 'approved' : 'AI_replied',
          },
        })

        processedReviews.push({
          id: review.id,
          author_name: authorName,
          platform: review.platform?.platformType || 'manual',
          rating: review.rating,
          content: reviewText,
          sentiment_label: sentiment,
          sentiment_score: sentimentScore,
          ai_reply: aiReply,
          status: autoApprove ? 'approved' : 'AI_replied',
          creditsRemaining: creditResult.balanceAfter,
        })

        auditTrail.push({
          reviewId: review.id,
          action: 'auto_replied',
          sentiment,
          creditsUsed: CreditsManager.getCreditCost('auto_reply'),
          balanceAfter: creditResult.balanceAfter,
        })

        console.log('[Agentic] Review processed successfully:', review.id)
      } catch (err) {
        console.error('[Agentic] Error processing review:', review.id, err)
        auditTrail.push({
          reviewId: review.id,
          action: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    console.log('[Agentic] Processing complete. Processed:', processedReviews.length)

    return NextResponse.json({
      success: true,
      processed: processedReviews.length,
      reviews: processedReviews,
      auditTrail,
      message: `Successfully processed ${processedReviews.length} reviews with LongCat AI`,
      ai_provider: 'LongCat AI',
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    return serverError('[Agentic] Fatal error', error, 'Agentic processing failed. Please try again.')
  }
}

// GET - Get agentic processing status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const since = new Date(Date.now() - 86400000)
    const [pendingCount, processedToday, credits] = await Promise.all([
      prisma.review.count({ where: { userId, status: 'pending' } }),
      prisma.review.count({
        where: {
          userId,
          status: 'AI_replied',
          updatedAt: { gte: since },
        },
      }),
      CreditsManager.getCredits(userId),
    ])

    return NextResponse.json({
      pending: pendingCount,
      processedToday,
      credits,
      ai_provider: 'LongCat AI'
    })
  } catch (error: unknown) {
    return serverError('[Agentic] Status error', error, 'Failed to load agentic status.')
  }
}
