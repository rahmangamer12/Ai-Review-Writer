import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { longcatAI } from '@/lib/longcatAI'

// POST - Run agentic review processing with REAL AI
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Agentic] Starting REAL AI agentic review processing for user:', userId)
    const body = await req.json().catch(() => ({}))
    const autoApprove = body?.autoApprove === true

    if (!longcatAI.hasApiKey()) {
      return NextResponse.json({
        error: 'LONGCAT_AI_API_KEY is not configured. Agentic mode needs a real AI key to process reviews.',
      }, { status: 400 })
    }

    const pendingReviews = await prisma.review.findMany({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 10,
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

    const processedReviews = []

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
          const sentimentResult = await longcatAI.analyzeSentiment(reviewText)
          sentiment = sentimentResult.sentiment
          sentimentScore = sentimentResult.score
          console.log('[Agentic] Sentiment detected:', sentiment, 'Confidence:', sentimentResult.confidence)
        } catch (e) {
          console.log('[Agentic] Sentiment analysis failed, using rating heuristic')
          sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
        }

        // Step 2: Generate AI reply with REAL AI
        let aiReply = ''
        console.log('[Agentic] Generating reply with LongCat AI...')
        const result = await longcatAI.generateReviewResponse(
          reviewText,
          review.rating,
          sentiment,
          'friendly',
          authorName
        )
        aiReply = result.response
        console.log('[Agentic] AI Reply generated:', aiReply.substring(0, 80) + '...')


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
        })
        
        console.log('[Agentic] Review processed successfully:', review.id)
      } catch (err) {
        console.error('[Agentic] Error processing review:', review.id, err)
      }
    }

    console.log('[Agentic] Processing complete. Processed:', processedReviews.length)

    return NextResponse.json({
      success: true,
      processed: processedReviews.length,
      reviews: processedReviews,
      message: `Successfully processed ${processedReviews.length} reviews with LongCat AI`,
      ai_provider: 'LongCat AI',
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('[Agentic] Fatal error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
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
    const [pendingCount, processedToday] = await Promise.all([
      prisma.review.count({ where: { userId, status: 'pending' } }),
      prisma.review.count({
        where: {
          userId,
          status: 'AI_replied',
          updatedAt: { gte: since },
        },
      }),
    ])

    return NextResponse.json({
      pending: pendingCount,
      processedToday,
      ai_provider: 'LongCat AI'
    })
  } catch (error: unknown) {
    console.error('[Agentic] Status error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
