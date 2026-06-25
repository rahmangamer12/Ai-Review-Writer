import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { longcatAI } from '@/lib/longcatAI'
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

// Public lead-magnet endpoint: anyone can generate free AI review replies without
// signing in. No auth, no credits — rate limited by IP to prevent abuse.
//
// Two modes:
//   • Single  — { reviewText, rating, ... }            → { reply }
//   • Bulk    — { reviews: [{ reviewText, rating }] }   → { replies: [...] }
//
// Bulk is the real differentiator vs a generic chatbot: paste ALL your unanswered
// reviews and get a polished reply for each in one click. That is the hook that
// shows the product's automation value and drives sign-ups.

const TONES = ['friendly', 'professional', 'apologetic', 'enthusiastic', 'desi'] as const

// One AI call per review; cap a single bulk request so cost/latency stay bounded.
const MAX_BULK = 8

const reviewItem = z.object({
  reviewText: z.string().trim().min(3, 'Please paste the review text').max(2000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  authorName: z.string().trim().max(120).optional().or(z.literal('')),
})

const schema = z.object({
  // Single-review fields (back-compat)
  reviewText: z.string().trim().max(2000).optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  authorName: z.string().trim().max(120).optional().or(z.literal('')),
  // Bulk
  reviews: z.array(reviewItem).max(MAX_BULK).optional(),
  // Shared
  businessName: z.string().trim().max(120).optional().or(z.literal('')),
  tone: z.enum(TONES).default('friendly'),
})

function sentimentFor(rating: number): 'positive' | 'neutral' | 'negative' {
  return rating <= 2 ? 'negative' : rating === 3 ? 'neutral' : 'positive'
}

async function generateOne(
  reviewText: string,
  rating: number,
  authorName: string | undefined,
  businessName: string | undefined,
  tone: (typeof TONES)[number]
): Promise<string> {
  const author = authorName?.trim() || 'there'
  const review = businessName?.trim()
    ? `${reviewText}\n\n(Business being reviewed: ${businessName.trim()})`
    : reviewText
  const result = await longcatAI.generateReviewResponse(review, rating, sentimentFor(rating), tone, author)
  return result.response
}

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
    const { reviewText, rating, authorName, reviews, businessName, tone } = parsed.data

    if (!longcatAI.hasApiKey()) {
      return NextResponse.json(
        { error: 'The AI is briefly unavailable. Please try again in a moment.' },
        { status: 503 }
      )
    }

    // ── Bulk mode ────────────────────────────────────────────────────────────
    if (reviews && reviews.length > 0) {
      const replies = await Promise.all(
        reviews.map(async (r) => {
          try {
            const reply = await generateOne(r.reviewText, r.rating, r.authorName, businessName, tone)
            return { reviewText: r.reviewText, rating: r.rating, reply, error: null as string | null }
          } catch {
            return {
              reviewText: r.reviewText,
              rating: r.rating,
              reply: '',
              error: 'Could not generate this one — try again.',
            }
          }
        })
      )
      return NextResponse.json({ success: true, replies })
    }

    // ── Single mode (back-compat) ─────────────────────────────────────────────
    if (!reviewText || reviewText.trim().length < 3) {
      return NextResponse.json({ error: 'Please paste the review text' }, { status: 400 })
    }

    const reply = await generateOne(reviewText, rating, authorName, businessName, tone)
    return NextResponse.json({ success: true, reply })
  } catch (error) {
    console.error('[Free Reply API] Error:', error)
    return NextResponse.json(
      { error: 'Could not generate a reply right now. Please try again.' },
      { status: 500 }
    )
  }
}
