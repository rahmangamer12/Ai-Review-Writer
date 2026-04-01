import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleReviewsAPI } from '@/lib/integrations/googleReviews';
import { longcatAI } from '@/lib/longcatAI';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const locationId = searchParams.get('locationId');
    const accessToken = searchParams.get('accessToken');

    if (!accessToken || !accountId || !locationId) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const api = new GoogleReviewsAPI({
      accountId,
      locationId,
      accessToken,
      refreshToken: '',
    });

    const reviews = await api.fetchReviews();

    return NextResponse.json({
      success: true,
      reviews: reviews.map(r => ({
        id: r.reviewId,
        author: r.reviewer.displayName,
        rating: GoogleReviewsAPI.ratingToNumber(r.starRating),
        text: r.comment || '',
        platform: 'google',
        date: r.createTime,
        hasReply: !!r.reviewReply,
      })),
    });
  } catch (error: unknown) {
    console.error('Error fetching Google reviews:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, replyText, accountId, locationId, accessToken, autoGenerate, reviewData } = body;

    if (!reviewId || !accountId || !locationId || !accessToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let finalReplyText = replyText;

    if (autoGenerate && reviewData) {
      const sentiment = await longcatAI.analyzeSentiment(reviewData.text);
      const tone = sentiment.sentiment === 'negative' ? 'apologetic' : 
                   sentiment.sentiment === 'positive' ? 'enthusiastic' : 'friendly';
      
      const aiResponse = await longcatAI.generateReviewResponse(
        reviewData.text,
        reviewData.rating,
        sentiment.sentiment,
        tone
      );
      
      finalReplyText = aiResponse.response;
    }

    if (!finalReplyText) {
      return NextResponse.json({ error: 'Reply text required' }, { status: 400 });
    }

    const api = new GoogleReviewsAPI({
      accountId,
      locationId,
      accessToken,
      refreshToken: '',
    });

    const posted = await api.postReply(reviewId, finalReplyText);

    return NextResponse.json({
      success: true,
      posted,
      replyText: finalReplyText,
    });
  } catch (error: unknown) {
    console.error('Error posting reply:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
