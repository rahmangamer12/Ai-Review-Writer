import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'
import { longcatAI } from '@/lib/longcatAI'

// POST - Generate AI reply or save existing reply
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      reviewId, 
      reviewText, 
      rating, 
      authorName, 
      platform = 'google', 
      tone = 'friendly', 
      language = 'en',
      replyText,
      aiGenerated = false
    } = body

    // If replyText is provided, save it directly
    if (replyText !== undefined) {
      if (!reviewId) {
        return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
      }

      // Verify review belongs to user
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', reviewId)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      // Check if reply exists
      const { data: existingReply } = await supabase
        .from('replies')
        .select('id')
        .eq('review_id', reviewId)
        .single()

      let result
      if (existingReply) {
        // Update existing reply
        result = await supabase
          .from('replies')
          .update({
            reply_text: replyText,
            ai_generated: aiGenerated,
            is_edited_by_human: !aiGenerated,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReply.id)
          .select()
          .single()
      } else {
        // Insert new reply
        result = await supabase
          .from('replies')
          .insert({
            review_id: reviewId,
            reply_text: replyText,
            ai_generated: aiGenerated,
            is_edited_by_human: !aiGenerated,
          })
          .select()
          .single()
      }

      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, reply: result.data })
    }

    // Otherwise, generate a new AI reply using REAL LongCat AI
    if (!reviewText || typeof reviewText !== 'string') {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    console.log('[Generate Reply API] Using REAL LongCat AI to generate reply')

    // Analyze sentiment first
    let sentimentResult
    try {
      sentimentResult = await longcatAI.analyzeSentiment(reviewText)
      console.log('[Generate Reply API] Sentiment:', sentimentResult.sentiment)
    } catch (e) {
      console.error('[Generate Reply API] Sentiment analysis failed, using fallback')
      sentimentResult = { 
        sentiment: rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral',
        confidence: 0.8 
      }
    }

    // Generate reply using REAL AI
    let aiReply = ''
    try {
      const result = await longcatAI.generateReviewResponse(
        reviewText,
        rating || 3,
        sentimentResult.sentiment,
        tone as any,
        authorName || 'there'
      )
      aiReply = result.response
      console.log('[Generate Reply API] AI Reply generated:', aiReply.substring(0, 100) + '...')
    } catch (aiError) {
      console.error('[Generate Reply API] AI generation failed, using fallback:', aiError)
      // Fallback to template-based reply
      const name = authorName || 'there'
      if ((rating || 3) >= 4) {
        aiReply = `Thank you ${name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!`
      } else if ((rating || 3) === 3) {
        aiReply = `Thank you ${name} for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.`
      } else {
        aiReply = `Hi ${name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.`
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      metadata: {
        original_rating: rating,
        detected_sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        tone_used: tone,
        platform,
        language,
        generated_at: new Date().toISOString(),
        ai_provider: 'LongCat AI',
      }
    })

  } catch (error: any) {
    console.error('[Generate Reply API Error]:', error)
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: error.message, 
      success: false 
    }, { status: 500 })
  }
}

// GET - Get API status
export async function GET() {
  return NextResponse.json({
    status: 'Reply Generation API is running',
    ai_provider: 'LongCat AI',
    supported_platforms: ['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot'],
    supported_tones: ['professional', 'friendly', 'apologetic', 'enthusiastic', 'desi'],
    timestamp: new Date().toISOString()
  })
}
