import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { z } from 'zod'

// Input validation schemas
const reviewIdSchema = z.string().uuid()
const createReviewSchema = z.object({
  content: z.string().min(1).max(5000),
  rating: z.number().min(1).max(5),
  author_name: z.string().max(200).optional(),
  author_email: z.string().email().optional(),
  platform: z.enum(['google', 'facebook', 'yelp', 'tripadvisor', 'trustpilot', 'manual']).default('manual'),
  sentiment_label: z.enum(['positive', 'neutral', 'negative']).optional()
})
const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
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

async function ensureUser(userId: string) {
  const clerkUser = await currentUser().catch(() => null)
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@autoreview.local`
  const name = clerkUser?.fullName || clerkUser?.firstName || null

  await prisma.user.upsert({
    where: { id: userId },
    update: { email, name },
    create: { id: userId, email, name },
  })
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
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

      return NextResponse.json({
        total_reviews: total,
        average_rating: Number(averageRating.toFixed(1)),
        sentiment_breakdown: sentimentCounts,
        needs_attention: needsAttention,
        insights: [
          total === 0
            ? 'No reviews available yet. Connect a platform or generate sample reviews to start analysis.'
            : `Average rating is ${averageRating.toFixed(1)} across ${total} reviews.`,
          needsAttention > 0
            ? `${needsAttention} low-rating reviews need a priority response.`
            : 'No urgent low-rating reviews found.',
        ],
      })
    }

    const validated = createReviewSchema.parse(body)

    await ensureUser(userId)

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
  } catch (error: unknown) { const message = error instanceof Error ? error.message : "Unknown error"; return NextResponse.json({ error: message }, { status: 500 })
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
  } catch (error: unknown) { const message = error instanceof Error ? error.message : "Unknown error"; return NextResponse.json({ error: message }, { status: 500 })
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getSentimentFromRating(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive'
  if (rating === 3) return 'neutral'
  return 'negative'
}
