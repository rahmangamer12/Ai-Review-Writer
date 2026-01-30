import { NextRequest, NextResponse } from 'next/server';
import { longcatAI } from '@/lib/longcatAI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewText, rating, language = 'en' } = body;

    if (!reviewText || typeof reviewText !== 'string') {
      return NextResponse.json(
        { error: 'Review text is required' },
        { status: 400 }
      );
    }

    console.log(`[Analyze API] Analyzing review: "${reviewText.substring(0, 50)}..."`);

    const [sentimentResult, deepAnalysis, languageResult] = await Promise.all([
      longcatAI.analyzeSentiment(reviewText),
      longcatAI.deepAnalyzeReview(reviewText),
      language === 'auto' ? longcatAI.detectLanguage(reviewText) : Promise.resolve({ language, confidence: 1 })
    ]);

    const tone = sentimentResult.sentiment === 'negative' 
      ? 'apologetic' 
      : sentimentResult.sentiment === 'positive' 
        ? 'enthusiastic' 
        : 'friendly';

    const responseResult = await longcatAI.generateReviewResponse(
      reviewText,
      rating || 3,
      sentimentResult.sentiment,
      tone
    );

    const result = {
      sentiment: sentimentResult,
      deep_analysis: deepAnalysis,
      language: languageResult,
      suggested_response: responseResult,
      auto_approve: shouldAutoApprove(sentimentResult, rating, deepAnalysis.priority),
      processing_time: new Date().toISOString(),
    };

    console.log(`[Analyze API] Analysis complete - Sentiment: ${sentimentResult.sentiment}`);

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('[Analyze API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to analyze review', details: error.message, success: false },
      { status: 500 }
    );
  }
}

function shouldAutoApprove(sentiment: any, rating: number, priority: string) {
  if (priority === 'urgent' || priority === 'high') {
    return { approved: false, reason: 'High priority review requires human review', confidence: 0.9 };
  }
  if (sentiment.sentiment === 'positive' && sentiment.confidence > 0.8 && rating >= 4) {
    return { approved: true, reason: 'Positive review with high confidence', confidence: sentiment.confidence };
  }
  if (sentiment.sentiment === 'neutral' && sentiment.confidence > 0.9) {
    return { approved: true, reason: 'Neutral review with very high confidence', confidence: sentiment.confidence };
  }
  return { approved: false, reason: 'Standard review requires human approval', confidence: sentiment.confidence };
}

export async function GET() {
  return NextResponse.json({
    status: 'Review Analysis API is running',
    features: ['sentiment_analysis', 'deep_analysis', 'language_detection', 'response_generation'],
    timestamp: new Date().toISOString()
  });
}
