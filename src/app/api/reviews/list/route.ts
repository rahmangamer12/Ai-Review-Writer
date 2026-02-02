import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null
    const platform = searchParams.get('platform')
    const sentiment = searchParams.get('sentiment')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }
    if (sentiment) {
      query = query.eq('sentiment_label', sentiment)
    }
    if (search) {
      query = query.or(`reviewer_name.ilike.%${search}%,review_text.ilike.%${search}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Reviews list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch replies for these reviews
    const reviewIds = reviews?.map(r => r.id) || []
    const { data: replies } = await supabase
      .from('replies')
      .select('*')
      .in('review_id', reviewIds)

    // Map replies to reviews
    const reviewsWithReplies = reviews?.map(review => ({
      ...review,
      reply: replies?.find(r => r.review_id === review.id) || null,
    }))

    // Get unique platforms for filter
    const { data: platforms } = await supabase
      .from('reviews')
      .select('platform')
      .eq('user_id', userId)
      .not('platform', 'is', null)

    const uniquePlatforms = [...new Set(platforms?.map(p => p.platform) || [])]

    return NextResponse.json({
      reviews: reviewsWithReplies || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      platforms: uniquePlatforms,
    })
  } catch (error: any) {
    console.error('Reviews list API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
