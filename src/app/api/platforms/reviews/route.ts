import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

function toPublicReview(review: any) {
  return {
    id: review.id,
    platform: review.platform.platformType,
    author: review.authorName,
    rating: review.rating,
    text: review.content,
    sentiment: review.sentimentLabel,
    status: review.status,
    aiReply: review.aiReplyText,
    date: review.sourceDate.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }
}

// GET /api/platforms/reviews - Return stored reviews from connected Prisma platforms.
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const connectedPlatforms = await prisma.connectedPlatform.findMany({
      where: { userId, status: 'connected' },
      select: { id: true, platformType: true, lastSyncedAt: true },
    })

    if (connectedPlatforms.length === 0) {
      return NextResponse.json({
        reviews: [],
        platforms: [],
        message: 'No platforms connected',
        success: true,
      })
    }

    const reviews = await prisma.review.findMany({
      where: {
        userId,
        platformId: { in: connectedPlatforms.map((platform) => platform.id) },
      },
      include: {
        platform: { select: { platformType: true } },
      },
      orderBy: { sourceDate: 'desc' },
    })

    return NextResponse.json({
      reviews: reviews.map(toPublicReview),
      platforms: connectedPlatforms.map((platform) => ({
        id: platform.platformType,
        lastSync: platform.lastSyncedAt.toISOString(),
      })),
      success: true,
    })
  } catch (error) {
    console.error('Error fetching platform reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// POST /api/platforms/reviews - Return current stored reviews for one connected platform.
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platformId } = await request.json()
    if (!platformId) {
      return NextResponse.json({ error: 'Missing platformId' }, { status: 400 })
    }

    const platform = await prisma.connectedPlatform.findFirst({
      where: { userId, platformType: platformId, status: 'connected' },
      select: { id: true, platformType: true },
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform is not connected' }, { status: 404 })
    }

    const reviews = await prisma.review.findMany({
      where: { userId, platformId: platform.id },
      include: { platform: { select: { platformType: true } } },
      orderBy: { sourceDate: 'desc' },
    })

    return NextResponse.json({
      success: true,
      reviews: reviews.map(toPublicReview),
      count: reviews.length,
      message: 'Stored reviews returned. Use the platform OAuth sync flow to import new reviews.',
    })
  } catch (error) {
    console.error('Error reading platform reviews:', error)
    return NextResponse.json({ error: 'Failed to read reviews' }, { status: 500 })
  }
}
