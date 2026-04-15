import { NextRequest, NextResponse } from 'next/server';
import { longcatAI } from '@/lib/longcatAI';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();
    const { reviews, options = {} } = body;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'Reviews array required' }, { status: 400 });
    }

    console.log(`[Process API] Processing ${reviews.length} reviews`);

    const processed = await Promise.all(
      reviews.map(async (review, index) => {
        try {
          // Analyze sentiment
          const sentiment = await longcatAI.analyzeSentiment(review.text);

          // Generate reply
          const reply = await longcatAI.generateReviewResponse(
            review.text,
            review.rating,
            sentiment.sentiment,
            options.tone || 'friendly'
          );

          // Determine if auto-approve
          const autoApprove = sentiment.sentiment === 'positive' && 
                             sentiment.confidence > 0.8 && 
                             review.rating >= 4;

          return {
            id: review.id || `rev_${Date.now()}_${index}`,
            original: review,
            sentiment: sentiment.sentiment,
            confidence: sentiment.confidence,
            emotion: sentiment.emotion,
            topics: sentiment.topics,
            ai_reply: reply.response,
            auto_approve: autoApprove,
            status: autoApprove ? 'approved' : 'pending_review',
            processed_at: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error processing review ${index}:`, error);
          return {
            id: review.id || `rev_${Date.now()}_${index}`,
            original: review,
            error: 'Processing failed',
            status: 'error',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      processed_count: processed.length,
      auto_approved: processed.filter(p => p.auto_approve).length,
      needs_review: processed.filter(p => p.status === 'pending_review').length,
      reviews: processed,
    });

  } catch (error: unknown) {
    console.error('[Process API Error]:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Review Process API is running',
    endpoints: {
      POST: 'Process multiple reviews with AI',
    },
    timestamp: new Date().toISOString(),
  });
}
