import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/stats
 * Returns real platform-wide counts from the database.
 * Public endpoint — no auth required.
 * Cached for 1 hour to avoid hammering the DB.
 */
export async function GET(request: NextRequest) {
  try {
    const [userCount, reviewCount, replyCount] = await Promise.allSettled([
      prisma.user.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: 'AI_replied' } }),
    ])

    const users = userCount.status === 'fulfilled' ? userCount.value : 0
    const reviews = reviewCount.status === 'fulfilled' ? reviewCount.value : 0
    const replies = replyCount.status === 'fulfilled' ? replyCount.value : 0

    // Calculate response rate
    const responseRate = reviews > 0 ? Math.round((replies / reviews) * 100) : 0

    return NextResponse.json(
      {
        users,
        reviews,
        replies,
        responseRate,
        uptime: '99.9', // Infrastructure SLA — legitimate to show
      },
      {
        status: 200,
        headers: {
          // Cache for 1 hour — stats don't need to be real-time
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (error) {
    // Return zeros gracefully — never expose DB error
    return NextResponse.json(
      { users: 0, reviews: 0, replies: 0, responseRate: 0, uptime: '99.9' },
      { status: 200 }
    )
  }
}
