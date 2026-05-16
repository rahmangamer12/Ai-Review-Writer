import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { longcatAI } from '@/lib/longcatAI'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Input validation schema
const generateReplySchema = z.object({
  reviewId: z.string().uuid().optional(),
  reviewText: z.string().min(1).max(5000).optional(),
  rating: z.number().min(1).max(5).optional(),
  authorName: z.string().max(200).optional(),
  platform: z.enum(['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'manual']).default('google'),
  tone: z.enum(['professional', 'friendly', 'apologetic', 'enthusiastic', 'desi']).default('friendly'),
  language: z.string().max(10).default('en'),
  replyText: z.string().max(5000).optional(),
  aiGenerated: z.boolean().default(false)
})

function isVerifiedChromeExtension(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || ''
  const extensionId = process.env.CHROME_EXTENSION_ID
  const extensionSecret = process.env.CHROME_EXTENSION_SHARED_SECRET
  const providedSecret = request.headers.get('x-autoreview-extension-secret')

  if (extensionSecret && providedSecret === extensionSecret) return true
  if (!extensionId) return false

  return origin === `chrome-extension://${extensionId}`
}

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const allowedOrigins = new Set([
    appUrl,
    'https://ai-review-writer.vercel.app',
    'https://autoreview-ai.com',
  ].filter(Boolean) as string[])

  const extensionId = process.env.CHROME_EXTENSION_ID
  if (extensionId) allowedOrigins.add(`chrome-extension://${extensionId}`)

  if (allowedOrigins.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
    }
  }

  return {}
}

// Fallback templates for offline mode
function getFallbackReply(rating: number, tone: string, authorName: string): string {
  const name = authorName || 'there';
  const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
  
  const templates: Record<string, string[]> = {
    positive: [
      `Thank you ${name} for your wonderful review! We're thrilled you had such a great experience with us. Your feedback means the world to our team!`,
      `We truly appreciate your kind words, ${name}! It was our pleasure to serve you, and we look forward to seeing you again soon!`,
      `Thank you so much, ${name}! We're excited to hear you enjoyed your experience. Can't wait to welcome you back!`,
      `Greatly appreciate the support, ${name}! We're so happy we could meet your expectations. See you next time!`,
      `Thanks for the 5 stars, ${name}! We love hearing from happy customers. Enjoy!`,
    ],
    neutral: [
      `Thank you, ${name}, for your feedback. We appreciate you taking the time to share your experience and are always looking for ways to improve.`,
      `We value your input, ${name}. Thank you for bringing this to our attention. We're committed to providing the best experience possible.`,
      `Thanks for sharing your thoughts, ${name}. We'll take this feedback into account as we continue to improve our service.`,
    ],
    negative: [
      `Hi ${name}, we sincerely apologize that your experience didn't meet your expectations. We'd love the opportunity to make this right. Please reach out to us directly so we can address your concerns.`,
      `Dear ${name}, we're sorry to hear about your experience. This is not the standard we strive for. Please contact us so we can make things better.`,
      `We apologize for the inconvenience, ${name}. We are looking into this issue to ensure it doesn't happen again. Thank you for your patience.`,
    ]
  };

  const desiTemplates: Record<string, string[]> = {
    positive: [
      `Shukriya ${name} bhai! Aapka review parh kar bohat khushi hui. Hamari koshish hoti hai ke behtreen service dein. Dubara zaroor aaiye ga!`,
      `Bohat bohat shukriya ${name}! Aapka feedback hamare liye bohat ahmiyat rakhta hai. Khush rahein!`,
      `JazakAllah ${name}! Aapka review parh kar maza aa gaya. Dubara jald aaiye ga!`,
    ],
    neutral: [
      `Shukriya ${name}! Hum mazeed behtar karne ki koshish karein ge.`,
      `Thanks for the feedback ${name}. Hum is par kaam karein ge.`,
    ],
    negative: [
      `Bohat afsos hua ${name} bhai aapka ye experience jaan kar. Hum maazrat khwah hain. Baraye meharbani hum se rabta karein taake hum isay theek kar sakein.`,
      `Maazrat ${name} bhai. Ye hamara standard nahi hai. Humein moqa dein taake hum isay theek kar sakein.`,
    ]
  };
  
  const templateList = tone === 'desi' ? (desiTemplates[sentiment] || templates[sentiment]) : templates[sentiment];
  const template = templateList[Math.floor(Math.random() * templateList.length)];
  
  // Apply tone modifiers
  if (tone === 'professional') {
    return sentiment === 'positive' 
      ? `Thank you for your feedback, ${name}. We look forward to serving you again.`
      : sentiment === 'negative'
      ? `We apologize for this experience, ${name}. Please contact our management.`
      : `Thank you for your feedback, ${name}. We value your input.`;
  } else if (tone === 'apologetic') {
    return sentiment === 'negative'
      ? `We're so sorry ${name}. This is not our standard. Please let us make it right.`
      : template;
  } else if (tone === 'enthusiastic') {
    return sentiment === 'positive'
      ? `WOW! Thank you ${name}! You made our day! Come back soon!`
      : template;
  }
  
  return template;
}



// POST - Generate AI reply or save existing reply
async function handler(request: NextRequest) {
  try {
    const authResult = await auth().catch(() => ({ userId: null }))
    const userId = authResult?.userId || null
    const verifiedExtension = isVerifiedChromeExtension(request)
    const rateLimitKey = userId || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'

    const rateLimitResult = await rateLimit(rateLimitKey, RATE_LIMITS.AI_GENERATION)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.message,
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: { ...getRateLimitHeaders(rateLimitResult), ...getCorsHeaders(request) }
        }
      )
    }

    // Validate input
    const body = await request.json()
    const validated = generateReplySchema.parse(body)

    const {
      reviewId,
      reviewText,
      rating,
      authorName,
      platform,
      tone,
      language,
      replyText,
      aiGenerated
    } = validated

    if (!userId && !verifiedExtension) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: getCorsHeaders(request) }
      )
    }

    // If replyText is provided, save it directly (requires auth)
    if (replyText !== undefined) {
      if (!userId) {
        return NextResponse.json({ error: 'Authentication required to save replies' }, { status: 401 })
      }
      if (!reviewId) {
        return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
      }

      // Verify review belongs to user
      const { data: existing } = await (supabase
        .from('reviews')
        .select('id') )
        .eq('id', reviewId)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      // Check if reply exists
      const { data: existingReply } = await (supabase
        .from('replies')
        .select('id') )
        .eq('review_id', reviewId)
        .single()

      let result
      if (existingReply) {
        result = await (supabase
          .from('replies')
          .update({
            reply_text: replyText,
            ai_generated: aiGenerated,
            is_edited_by_human: !aiGenerated,
            updated_at: new Date().toISOString(),
          }) )
          .eq('id', existingReply.id)
          .select()
          .single()
      } else {
        result = await (supabase
          .from('replies')
          .insert({
            review_id: reviewId,
            reply_text: replyText,
            ai_generated: aiGenerated,
            is_edited_by_human: !aiGenerated,
          }) )
          .select()
          .single()
      }

      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, reply: result.data })
    }

    // Otherwise, generate a new AI reply
    if (!reviewText || typeof reviewText !== 'string') {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    console.log('[Generate Reply API] Using LongCat AI to generate reply')

    // Analyze sentiment first
    let sentimentResult
    try {
      if (longcatAI.hasApiKey()) {
        sentimentResult = await longcatAI.analyzeSentiment(reviewText)
        console.log('[Generate Reply API] Sentiment:', sentimentResult.sentiment)
      } else {
        throw new Error('No API key')
      }
    } catch (e) {
      console.error('[Generate Reply API] Sentiment analysis failed, using fallback')
      sentimentResult = {
        sentiment: (rating || 3) >= 4 ? 'positive' : (rating || 3) <= 2 ? 'negative' : 'neutral',
        confidence: 0.8
      }
    }

    // Generate reply using AI with fallback templates
    let aiReply = ''
    let usedFallback = false
    if (longcatAI.hasApiKey()) {
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
        console.warn('[Generate Reply API] AI generation failed, using fallback template:', aiError)
        usedFallback = true
      }
    } else {
      console.log('[Generate Reply API] No AI key configured, using fallback template')
      usedFallback = true
    }

    // Use fallback template if AI failed or not configured
    if (!aiReply) {
      aiReply = getFallbackReply(rating || 3, tone, authorName || 'there')
      usedFallback = true
    }

    return NextResponse.json(
      {
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
          ai_provider: usedFallback ? 'Fallback Templates' : 'LongCat AI',
          used_fallback: usedFallback,
        }
      },
      {
        headers: {
          ...getCorsHeaders(request),
        }
      }
    )


  } catch (error: unknown) {
    console.error('[Generate Reply API Error]:', error)

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Invalid input',
        details: (error as any).issues || [],
        success: false
      }, {
        status: 400,
        headers: getCorsHeaders(request),
      })
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to process request',
      details: message,
      success: false
    }, {
      status: 500,
      headers: getCorsHeaders(request),
    })
  }
}

// Chrome extension access is limited to CHROME_EXTENSION_ID or
// CHROME_EXTENSION_SHARED_SECRET. Normal app calls require Clerk auth.
export const POST = handler;

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(request),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token, x-autoreview-extension-secret',
    },
  })
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
