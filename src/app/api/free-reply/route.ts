import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { longcatAI } from '@/lib/longcatAI'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

// Public lead-magnet endpoint: anyone can generate ONE free AI review reply
// without signing in. No auth, no credits — rate limited by IP to prevent abuse.
// Drives sign-ups: try it free here, then create an account to do it at scale.
const schema = z.object({
  reviewText: z.string().trim().min(3, 'Please paste the review text').max(2000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  businessName: z.string().trim().max(120).optional().or(z.literal('')),
  authorName: z.string().trim().max(120).optional().or(z.literal('')),
  tone: z.enum(['friendly', 'professional', 'apologetic', 'enthusiastic', 'desi']).default('friendly'),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous'
    const rl = await rateLimit(`free-reply:${ip}`, RATE_LIMITS.AI_GENERATION)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'You have used the free generator a few times. Sign up free to keep going!' },
        { status: 429, headers: getRateLimitHeaders(rl) }
      )
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check your input.' },
        { status: 400 }
      )
    }
    const { reviewText, rating, businessName, authorName, tone } = parsed.data

    if (!longcatAI.hasApiKey()) {
      return NextResponse.json(
        { error: 'The AI is briefly unavailable. Please try again in a moment.' },
        { status: 503 }
      )
    }

    const sentiment = rating <= 2 ? 'negative' : rating === 3 ? 'neutral' : 'positive'
    const author = authorName?.trim() || 'there'

    const review = businessName?.trim()
      ? `${reviewText}\n\n(Business being reviewed: ${businessName.trim()})`
      : reviewText

    const result = await longcatAI.generateReviewResponse(review, rating, sentiment, tone, author)

    return NextResponse.json({ success: true, reply: result.response })
  } catch (error) {
    console.error('[Free Reply API] Error:', error)
    return NextResponse.json(
      { error: 'Could not generate a reply right now. Please try again.' },
      { status: 500 }
    )
  }
}
