import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { serverError } from '@/lib/apiError'
import { ensureUserProvisioned } from '@/lib/requireUser'

// Input validation schemas
const reviewIdSchema = z.string().min(1).max(500)
const createReviewSchema = z.object({
  content: z.string().min(1).max(5000),
  rating: z.number().min(1).max(5),
  author_name: z.string().max(200).optional(),
  author_email: z.string().email().optional(),
  platform: z.enum(['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'manual']).default('manual'),
  sentiment_label: z.enum(['positive', 'neutral', 'negative']).optional()
})
const updateReviewSchema = z.object({
  reviewId: reviewIdSchema,
  status: z.enum(['pending', 'approved', 'rejected'])
})

function normalizeReview(review: any) {
  const platform = review.platform?.platformType || review.platformType || 'manual'

  return {
    id: review.id,
    user_id: review.userId,
    platform_id: review.platformId,
    platform,
    author_name: review.authorName,
    reviewer_name: review.authorName,
    content: review.content,
    review_text: review.content,
    rating: review.rating,
    sentiment_label: review.sentimentLabel,
    status: review.status,
    source_date: review.sourceDate?.toISOString?.() || review.sourceDate,
    created_at: review.createdAt?.toISOString?.() || review.createdAt,
    updated_at: review.updatedAt?.toISOString?.() || review.updatedAt,
    reply: review.aiReplyText
      ? {
          review_id: review.id,
          reply_text: review.aiReplyText,
          ai_generated: true,
        }
      : null,
  }
}

// GET - Analyze a single review or get review details
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // Validate UUID format
    const validatedId = reviewIdSchema.parse(reviewId)

    const review = await prisma.review.findFirst({
      where: { id: validatedId, userId },
      include: { platform: { select: { platformType: true } } },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(normalizeReview(review))
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid review ID format', details: (error as any).issues || [] }, { status: 400 })
    }
    return serverError('[Reviews Analyze GET]', error)
  }
}

// POST - Create a new review
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    if (Array.isArray(body?.reviews)) {
      const reviewItems = body.reviews
      const total = reviewItems.length
      const averageRating = total
        ? reviewItems.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / total
        : 0
      const sentimentCounts = reviewItems.reduce((counts: Record<string, number>, review: any) => {
        const sentiment = review.sentiment_label || review.sentimentLabel || getSentimentFromRating(Number(review.rating || 3))
        counts[sentiment] = (counts[sentiment] || 0) + 1
        return counts
      }, {})
      const needsAttention = reviewItems.filter((review: any) => Number(review.rating || 0) <= 2).length
      const topSentiment = Object.entries(sentimentCounts)
        .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'neutral'
      const lowRatingCount = reviewItems.filter((review: any) => Number(review.rating || 0) <= 3).length

      return NextResponse.json({
        total_reviews: total,
        average_rating: Number(averageRating.toFixed(1)),
        sentiment_breakdown: sentimentCounts,
        needs_attention: needsAttention,
        topSentiment,
        avgResponseTime: total ? 'Based on saved reply status' : 'No saved reviews yet',
        improvementAreas: [
          lowRatingCount > 0
            ? `${lowRatingCount} reviews are 3 stars or below and need follow-up.`
            : 'No low-rating pattern detected in the current review set.',
          needsAttention > 0
            ? 'Prioritize 1-2 star reviews before running broad AI replies.'
            : 'Keep monitoring new incoming reviews for urgent issues.',
        ],
        recommendations: [
          total === 0
            ? 'Connect a real review platform or add a customer review manually.'
            : 'Respond to pending reviews first, then review AI suggestions before publishing.',
          'Use platform filters to compare Google, Facebook, and manual review performance.',
        ],
        insights: [
          total === 0
            ? 'No reviews available yet. Connect a platform or add real customer reviews manually to start analysis.'
            : `Average rating is ${averageRating.toFixed(1)} across ${total} reviews.`,
          needsAttention > 0
            ? `${needsAttention} low-rating reviews need a priority response.`
            : 'No urgent low-rating reviews found.',
        ],
      })
    }

    const validated = createReviewSchema.parse(body)

    await ensureUserProvisioned(userId)

    const {
      content,
      rating,
      author_name,
      platform: platformType,
      sentiment_label
    } = validated

    const connectedPlatform = await prisma.connectedPlatform.upsert({
      where: {
        userId_platformType: {
          userId,
          platformType,
        },
      },
      update: {
        status: 'connected',
        updatedAt: new Date(),
      },
      create: {
        userId,
        platformType,
        status: 'connected',
        credentials: { source: 'manual_review_generator' },
      },
    })

    const review = await prisma.review.create({
      data: {
        userId,
        platformId: connectedPlatform.id,
        authorName: author_name?.trim() || 'Anonymous Customer',
        content,
        rating,
        sentimentLabel: sentiment_label || getSentimentFromRating(rating),
        status: 'pending',
        sourceDate: new Date(),
      },
      include: { platform: { select: { platformType: true } } },
    })

    return NextResponse.json(normalizeReview(review))
  } catch (error) {
    return serverError('[Reviews Analyze]', error)
  }
}

// PATCH - Update review status
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateReviewSchema.parse(body)

    const { reviewId, status } = validated

    const existing = await prisma.review.findFirst({
      where: { id: reviewId, userId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: { platform: { select: { platformType: true } } },
    })

    return NextResponse.json(normalizeReview(review))
  } catch (error) {
    return serverError('[Reviews Analyze]', error)
  }
}

// DELETE - Delete a review
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    }

    // Validate UUID format
    const validatedId = reviewIdSchema.parse(reviewId)

    const existing = await prisma.review.findFirst({
      where: { id: validatedId, userId },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    await prisma.review.delete({ where: { id: validatedId } })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid review ID format', details: (error as any).issues || [] }, { status: 400 })
    }
    return serverError('[Reviews Analyze DELETE]', error)
  }
}

function getSentimentFromRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}
