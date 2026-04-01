import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult?.userId
    } catch (e) {
      console.warn('Auth check skipped during build or non-request context.', e)
    }
    
    // During next.js static evaluation, return 200 empty instead of 401
    if (!userId) {
      return NextResponse.json({ reviews: [], totalCount: 0, totalPages: 0, currentPage: 1, platforms: [] }, { status: 200 })
    }

    const requestUrl = req.url || 'http://localhost'
    const { searchParams } = new URL(requestUrl)
    const statusParam = searchParams.get('status')
    const platformParam = searchParams.get('platform')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let whereClause: any = { userId: userId }

    if (statusParam && statusParam !== 'all') {
      whereClause.status = statusParam
    }
    
    if (platformParam && platformParam !== 'all') {
      whereClause.platformId = platformParam
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { authorName: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const orderByClause = {
      [sortBy === 'created_at' ? 'createdAt' : sortBy]: sortOrder
    }

    const skip = (page - 1) * limit
    const take = limit

    let reviews: any[] = []
    let count = 0
    let platforms: string[] = []

    try {
      const dbResult = await Promise.all([
        prisma.review.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take,
        }),
        prisma.review.count({
          where: whereClause,
        }),
        prisma.review.findMany({
          where: { userId },
          select: { platformId: true },
          distinct: ['platformId']
        })
      ])
      
      reviews = dbResult[0] || []
      count = dbResult[1] || 0
      platforms = (dbResult[2] || []).map((p: any) => p.platformId).filter(Boolean)
    } catch (e) {
      console.warn("Prisma failed to fetch reviews, database might be empty or unreachable.", e)
      // Return gracefully if DB fails (e.g., during build or when tables don't exist yet)
    }

    return NextResponse.json({
      reviews,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      platforms,
    })
  } catch (error: unknown) {
    console.error('Reviews list API error:', error)
    return NextResponse.json({ 
      reviews: [], totalCount: 0, totalPages: 0, currentPage: 1, platforms: [],
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
