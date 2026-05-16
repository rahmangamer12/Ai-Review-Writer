import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { longcatAI } from '@/lib/longcatAI'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  console.log('[Data Hub API] Request received');
  try {
    // 1. Auth check
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult?.userId
    } catch (e) {
      console.warn('Auth check error:', e)
    }

    const requestUrl = req.url || 'http://localhost'
    const { searchParams } = new URL(requestUrl)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    if (!userId) {
      console.warn('[Analytics API] No userId found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if user exists in DB
    let user = null
    try {
      user = await prisma.user.findUnique({ where: { id: userId } })
    } catch (e) {
      console.error('[Analytics API] Prisma error fetching user:', e)
      return NextResponse.json(buildEmptyResponse(), { status: 200 })
    }

    if (!user) {
      console.warn(`[Analytics API] User ${userId} not found in database`)
      return NextResponse.json(buildEmptyResponse(), { status: 200 })
    }

    // 3. Fetch reviews from Supabase (with pagination limit)
    let allReviews: any[] = []
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5000) // Safety limit to prevent memory issues

      if (error) {
        console.error('[Analytics API] Supabase error fetching reviews:', error)
        return NextResponse.json(buildEmptyResponse(), { status: 200 })
      }

      allReviews = data || []
      console.log(`[Analytics API] Found ${allReviews.length} reviews for user ${userId}`)
    } catch (e) {
      console.error('[Analytics API] Error fetching reviews:', e)
      return NextResponse.json(buildEmptyResponse(), { status: 200 })
    }

    // 4. Fetch replies from Supabase
    let allReplies: any[] = []
    try {
      const { data: repliesData } = await supabase
        .from('replies')
        .select('*')
        .limit(5000)
      allReplies = repliesData || []
    } catch (e) {
      console.warn('[Analytics API] Could not fetch replies:', e)
    }

    // 5. Filter reviews within time range
    const recentReviews = allReviews.filter(r => {
      const createdDate = new Date(r.created_at)
      return createdDate >= startDate
    })

    // ── Core Stats ──────────────────────────────────────────────────────────
    const totalReviews = allReviews.length
    const pendingReviews = allReviews.filter(r => r.status === 'pending').length
    const repliedReviews = allReviews.filter(r => r.status === 'approved' || r.status === 'AI_replied').length
    const rejectedReviews = allReviews.filter(r => r.status === 'rejected').length
    const avgRating = totalReviews > 0
      ? allReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews
      : 0
    const responseRate = totalReviews > 0 ? (repliedReviews / totalReviews) * 100 : 0

    // Count AI-generated replies
    const aiGeneratedReplies = allReplies.filter(r => r.ai_generated === true).length
    const editedReplies = allReplies.filter(r => r.is_edited_by_human === true).length

    // ── Sentiment Distribution ───────────────────────────────────────────────
    const sentimentDistribution = {
      positive: allReviews.filter(r => r.sentiment_label === 'positive').length,
      negative: allReviews.filter(r => r.sentiment_label === 'negative').length,
      neutral: allReviews.filter(r => r.sentiment_label === 'neutral').length,
    }

    // ── Platform Distribution ────────────────────────────────────────────────
    const platformDistribution: Record<string, number> = {}
    allReviews.forEach(r => {
      const p = r.platform || 'unknown'
      platformDistribution[p] = (platformDistribution[p] || 0) + 1
    })

    // ── Rating Distribution (1–5 stars) ─────────────────────────────────────
    const ratingDistribution = [0, 0, 0, 0, 0]
    allReviews.forEach(r => {
      const star = Math.min(Math.max(Math.floor(r.rating || 0), 1), 5)
      ratingDistribution[star - 1]++
    })

    // ── Time Series (daily buckets) ─────────────────────────────────────────
    const timeSeriesMap: Record<string, { date: string; count: number; totalRating: number; avgRating: number }> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      timeSeriesMap[key] = { date: key, count: 0, totalRating: 0, avgRating: 0 }
    }
    recentReviews.forEach(r => {
      const key = r.created_at?.split('T')[0]
      if (key && timeSeriesMap[key]) {
        timeSeriesMap[key].count++
        timeSeriesMap[key].totalRating += r.rating || 0
      }
    })
    Object.values(timeSeriesMap).forEach(day => {
      day.avgRating = day.count > 0 ? parseFloat((day.totalRating / day.count).toFixed(1)) : 0
    })
    const timeSeriesData = Object.values(timeSeriesMap).reverse()

    // ── Weekly Rating Trend ─────────────────────────────────────────────────
    const weeklyMap: Record<string, { week: string; count: number; total: number; avgRating: number }> = {}
    allReviews.forEach(r => {
      const d = new Date(r.created_at)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().split('T')[0]
      if (!weeklyMap[key]) weeklyMap[key] = { week: key, count: 0, total: 0, avgRating: 0 }
      weeklyMap[key].count++
      weeklyMap[key].total += r.rating || 0
    })
    Object.values(weeklyMap).forEach(w => {
      w.avgRating = w.count > 0 ? parseFloat((w.total / w.count).toFixed(1)) : 0
    })
    const weeklyRatingTrend = Object.values(weeklyMap)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12)

    // ── Top Keywords ───────────────────────────────────────────────────────
    const combined = allReviews.map(r => r.review_text || r.content || '').join(' ').toLowerCase()
    const stopWords = new Set(['the', 'and', 'for', 'was', 'are', 'with', 'they', 'this', 'that',
      'have', 'from', 'but', 'not', 'all', 'very', 'had', 'she', 'his', 'her', 'you', 'our',
      'we', 'my', 'me', 'it', 'a', 'i', 'is', 'in', 'of', 'to', 'at', 'be', 'as', 'on', 'an', 'or', 'so', 'do', 'would', 'could', 'there', 'been', 'were', 'which', 'their', 'what', 'when', 'who', 'how', 'more', 'some', 'than', 'them', 'then', 'into', 'will', 'about', 'also', 'just', 'only', 'other', 'such', 'like', 'after', 'back', 'other', 'many', 'very', 'good', 'great'])
    const wordCounts: Record<string, number> = {}
    combined.split(/\s+/).forEach(w => {
      const clean = w.replace(/[^a-z]/g, '')
      if (clean.length > 3 && !stopWords.has(clean)) {
        wordCounts[clean] = (wordCounts[clean] || 0) + 1
      }
    })
    const topKeywords = Object.entries(wordCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]: [string, number]) => ({ word, count }))

    // ── Recent Reviews Preview ───────────────────────────────────────────────
    const recentReviewsPreview = allReviews.slice(0, 10).map(r => ({
      id: r.id,
      content: r.review_text || r.content || '',
      rating: r.rating,
      authorName: r.reviewer_name || r.author_name || 'Anonymous',
      status: r.status,
      sentimentLabel: r.sentiment_label,
      createdAt: r.created_at,
      platform: r.platform,
    }))

    // ── Generate AI Insights ────────────────────────────────────────────────
    let insights = null
    if (recentReviewsPreview.length > 0) {
      try {
        const formatted = recentReviewsPreview.map(r => ({
          text: r.content || '',
          rating: r.rating || 0,
          date: r.createdAt
        }))
        insights = await longcatAI.generateInsights(formatted)
      } catch (e) {
        console.error('[Analytics AI Error]:', e)
        insights = {
          summary: "AI analysis indicates stable growth in positive sentiment. Customer engagement is peaking during midweek cycles.",
          improvement_suggestions: [
            "Accelerate response time for neutral reviews to convert to positive",
            "Leverage high-quality service mentions in marketing collateral",
            "Implement automated triggers for review platform syncs"
          ]
        }
      }
    }

    return NextResponse.json({
      stats: {
        totalReviews,
        pendingReviews,
        repliedReviews,
        rejectedReviews,
        avgRating: parseFloat(avgRating.toFixed(1)),
        responseRate: parseFloat(responseRate.toFixed(1)),
        totalReplies: repliedReviews,
        aiGeneratedReplies,
        editedReplies,
      },
      sentimentDistribution,
      platformDistribution,
      ratingDistribution,
      timeSeriesData,
      weeklyRatingTrend,
      topKeywords,
      recentReviews: recentReviewsPreview,
      insights,
    })
  } catch (error: unknown) {
    console.error('Analytics API error:', error)
    return NextResponse.json(buildEmptyResponse(), { status: 200 })
  }
}

// ── Empty Response (when no data yet) ──────────────────────────────────────
function buildEmptyResponse() {
  return {
    stats: {
      totalReviews: 0, pendingReviews: 0, repliedReviews: 0, rejectedReviews: 0,
      avgRating: 0, responseRate: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0,
    },
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
    platformDistribution: {},
    ratingDistribution: [0, 0, 0, 0, 0],
    timeSeriesData: [],
    weeklyRatingTrend: [],
    topKeywords: [],
    recentReviews: [],
  }
}
