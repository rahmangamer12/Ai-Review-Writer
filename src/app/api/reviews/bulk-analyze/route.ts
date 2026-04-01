import { NextRequest, NextResponse } from 'next/server';
import { longcatAI } from '@/lib/longcatAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviews } = body;

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'Reviews array is required' }, { status: 400 });
    }

    if (reviews.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 reviews allowed per request' }, { status: 400 });
    }

    console.log(`[Bulk Analyze API] Processing ${reviews.length} reviews`);

    const analyzedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const sentiment = await longcatAI.analyzeSentiment(review.text);
          return { id: review.id, sentiment: sentiment.sentiment, score: sentiment.score, confidence: sentiment.confidence, emotion: sentiment.emotion, topics: sentiment.topics, processed: true };
        } catch (error) {
          return { id: review.id, sentiment: 'unknown', score: 0, confidence: 0, emotion: 'unknown', topics: [], processed: false, error: 'Analysis failed' };
        }
      })
    );

    const insights = await longcatAI.generateInsights(reviews.map(r => ({ text: r.text, rating: r.rating, date: r.date })));

    const processed = analyzedReviews.filter(r => r.processed);
    const sentimentCounts = processed.reduce((acc, r) => { acc[r.sentiment] = (acc[r.sentiment] || 0) + 1; return acc; }, {} as Record<string, number>);
    const allTopics = processed.flatMap(r => r.topics || []);
    const topicCounts = allTopics.reduce((acc, topic) => { acc[topic] = (acc[topic] || 0) + 1; return acc; }, {} as Record<string, number>);

    const result = {
      total_reviews: reviews.length,
      analyzed_reviews: processed.length,
      statistics: {
        total_reviews: reviews.length,
        successfully_analyzed: processed.length,
        sentiment_distribution: sentimentCounts,
        top_topics: Object.entries(topicCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10).map(([topic, count]) => ({ topic, count })),
        average_confidence: processed.length > 0 ? processed.reduce((sum, r) => sum + r.confidence, 0) / processed.length : 0,
      },
      insights,
      reviews: analyzedReviews,
    };

    return NextResponse.json({ success: true, data: result });

  } catch (error: unknown) {
    console.error('[Bulk Analyze API Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to analyze reviews', details: message, success: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Bulk Analysis API is running',
    max_reviews: 50,
    features: ['sentiment_analysis', 'insights_generation', 'statistics'],
    timestamp: new Date().toISOString()
  });
}
