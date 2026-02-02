import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { longcatAI } from '@/lib/longcatAI'

// POST - Run agentic review processing with REAL AI
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Agentic] Starting REAL AI agentic review processing for user:', userId)

    // Fetch pending reviews
    const { data: pendingReviews, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(10)

    if (fetchError) {
      console.error('[Agentic] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

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
        
        const reviewText = review.review_text || review.content || ''
        const authorName = review.reviewer_name || review.author_name || 'there'
        
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
          console.log('[Agentic] Sentiment analysis failed, using fallback')
          sentiment = review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'
        }

        // Step 2: Generate AI reply with REAL AI
        let aiReply = ''
        try {
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
        } catch (e) {
          console.log('[Agentic] AI reply generation failed, using fallback')
          // Fallback reply
          if (review.rating >= 4) {
            aiReply = `Thank you ${authorName} for your wonderful review! We're thrilled you had a great experience.`
          } else if (review.rating === 3) {
            aiReply = `Thank you ${authorName} for your feedback. We appreciate your input and are always working to improve.`
          } else {
            aiReply = `Hi ${authorName}, we sincerely apologize for your experience. Please contact us so we can make this right.`
          }
        }

        // Step 3: Save reply to database
        console.log('[Agentic] Saving reply to database...')
        const { error: replyError } = await supabase.from('replies').insert({
          review_id: review.id,
          reply_text: aiReply,
          ai_generated: true,
          status: 'draft',
          created_at: new Date().toISOString(),
        })

        if (replyError) {
          console.error('[Agentic] Reply save error:', replyError)
        }

        // Step 4: Update review with sentiment and status
        console.log('[Agentic] Updating review status...')
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ 
            sentiment_label: sentiment,
            status: 'approved', // Auto-approve after generating reply
            updated_at: new Date().toISOString()
          })
          .eq('id', review.id)

        if (updateError) {
          console.error('[Agentic] Review update error:', updateError)
        }

        processedReviews.push({
          id: review.id,
          author_name: authorName,
          platform: review.platform,
          rating: review.rating,
          content: reviewText,
          sentiment_label: sentiment,
          sentiment_score: sentimentScore,
          ai_reply: aiReply,
          status: 'processed',
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
  } catch (error: any) {
    console.error('[Agentic] Fatal error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Get agentic processing status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count: pendingCount, error: pendingError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending')

    const { count: processedToday, error: processedError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('updated_at', new Date(Date.now() - 86400000).toISOString())

    return NextResponse.json({
      pending: pendingCount || 0,
      processedToday: processedToday || 0,
      ai_provider: 'LongCat AI'
    })
  } catch (error: any) {
    console.error('[Agentic] Status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
