import { NextRequest, NextResponse } from 'next/server'
import { longcatAI } from '@/lib/longcatAI'
import { aiProvider } from '@/lib/ai/provider'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { CreditsManager } from '@/lib/credits'
import { ensureUserProvisioned } from '@/lib/requireUser'

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
  if (origin.startsWith('chrome-extension://')) return true
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

  if (allowedOrigins.has(origin) || origin.startsWith('chrome-extension://')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
    }
  }

  return {}
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

      const prismaReview = await prisma.review.findFirst({
        where: { id: reviewId, userId },
        select: { id: true, status: true },
      })

      if (!prismaReview) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }

      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          aiReplyText: replyText,
          status: aiGenerated ? 'AI_replied' : prismaReview.status,
        },
      })

      return NextResponse.json({
        success: true,
        reply: {
          review_id: updated.id,
          reply_text: updated.aiReplyText,
          ai_generated: aiGenerated,
          is_edited_by_human: !aiGenerated,
          updated_at: updated.updatedAt.toISOString(),
        },
      })
    }

    // Otherwise, generate a new AI reply
    if (!reviewText || typeof reviewText !== 'string') {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    // ─── CREDIT CHECK & DEDUCTION (Phase 1 Fix) ─────────────────────────────
    // AI generation requires a valid user account with sufficient credits.
    // This MUST happen BEFORE the AI API call to prevent free generations.
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required to generate AI replies' },
        { status: 401, headers: getCorsHeaders(request) }
      )
    }

    // Check AI API key is configured before checking credits
    if (!longcatAI.hasApiKey()) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI provider is not configured. Add LONGCAT_AI_API_KEY in Vercel to generate real replies.',
        },
        { status: 503, headers: getCorsHeaders(request) }
      )
    }

    // JIT provisioning: guarantee a Prisma user row exists before charging.
    // Without this, a signed-in Clerk user whose webhook never fired would hit
    // `user_not_found` and the AI would never respond (root cause C1).
    await ensureUserProvisioned(userId)

    // Determine credit cost for this action
    const creditCost = CreditsManager.getCreditCost('ai_response')

    // Attempt atomic credit deduction with audit logging
    // eslint-disable-next-line react-hooks/rules-of-hooks -- CreditsManager.useCredits is a static method, not a React Hook
    const deductionResult = await CreditsManager.useCredits(
      userId,
      creditCost,
      'ai_response',
      `Generated AI reply for ${platform} review`,
      { platform, tone, rating, reviewTextLength: reviewText.length }
    )

    if (!deductionResult.success) {
      if (deductionResult.error === 'insufficient_credits') {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient AI credits. Please upgrade your plan to generate more replies.',
            creditsRemaining: 0,
            upgradeUrl: '/subscription'
          },
          { status: 402, headers: getCorsHeaders(request) }
        )
      }

      if (deductionResult.error === 'user_not_found') {
        return NextResponse.json(
          { error: 'User account not found. Please sign in again.' },
          { status: 401, headers: getCorsHeaders(request) }
        )
      }

      // Transaction failed — don't generate AI, don't charge
      console.error('[Generate Reply API] Credit deduction failed:', deductionResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process payment. Please try again.',
        },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    // ─── AI GENERATION (only after successful credit deduction) ─────────────
    console.log('[Generate Reply API] Using LongCat AI to generate reply. Credits after deduction:', deductionResult.balanceAfter)

    // Derive sentiment from rating heuristically — no extra AI roundtrip.
    // The reply model already receives the full review text + rating, so quality
    // is preserved while latency is roughly halved (one AI call instead of two).
    const sentimentResult = {
      sentiment: (rating || 3) >= 4 ? 'positive' : (rating || 3) <= 2 ? 'negative' : 'neutral',
      confidence: 0.8,
    }

    // Generate reply using the configured AI provider
    let aiReply = ''
    try {
      const result = await aiProvider.generateReviewReply({
        reviewText,
        rating: rating || 3,
        sentiment: sentimentResult.sentiment,
        tone: tone as any,
        authorName: authorName || 'there',
        // Escalate hard cases: very negative or low-rating reviews
        escalate: (rating || 3) <= 2 || sentimentResult.sentiment === 'negative',
      })
      aiReply = result.response
      console.log('[Generate Reply API] AI Reply generated:', aiReply.substring(0, 100) + '...')
    } catch (aiError) {
      console.warn('[Generate Reply API] AI generation failed:', aiError)

      // AI failed AFTER credit deduction — automatically refund the credit so the
      // user is never charged for a generation they did not receive (Phase 1.3).
      const refund = await CreditsManager.refundCredits(
        userId,
        creditCost,
        'ai_response',
        'Refund: AI generation failed after deduction',
        { platform, tone, rating }
      )
      if (!refund.success) {
        console.error('[Generate Reply API] Refund failed after AI error:', refund.error)
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI generation failed. Your credit was not charged — please try again.',
          creditsRefunded: refund.success ? creditCost : 0,
          creditsRemaining: refund.balanceAfter,
        },
        { status: 502, headers: getCorsHeaders(request) }
      )
    }

    // Low-credit warning: fire once when the balance crosses the threshold.
    // Fire-and-forget; never blocks or fails the response.
    const LOW_CREDIT_THRESHOLD = 5
    if (deductionResult.balanceAfter === LOW_CREDIT_THRESHOLD) {
      void (async () => {
        try {
          const u = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, planType: true },
          })
          if (u?.email) {
            const { sendLowCreditsEmail } = await import('@/lib/email')
            await sendLowCreditsEmail(u.email, u.name || 'there', LOW_CREDIT_THRESHOLD, u.planType)
          }
        } catch (e) {
          console.warn('[Generate Reply API] low-credit email skipped:', e)
        }
      })()
    }

    return NextResponse.json(
      {
        success: true,
        reply: aiReply,
        creditsRemaining: deductionResult.balanceAfter,
        creditsUsed: creditCost,
        metadata: {
          original_rating: rating,
          detected_sentiment: sentimentResult.sentiment,
          confidence: sentimentResult.confidence,
          tone_used: tone,
          platform,
          language,
          generated_at: new Date().toISOString(),
          ai_provider: 'LongCat AI',
          used_fallback: false,
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

    // Do not leak raw error detail to the client (can disclose DB/internal info).
    return NextResponse.json({
      error: 'Failed to process request. Please try again.',
      success: false
    }, {
      status: 500,
      headers: getCorsHeaders(request),
    })
  }
}

// Chrome extension access is allowed for generated replies with rate limiting.
// Normal app calls still use Clerk auth for account-bound actions like saving.
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
