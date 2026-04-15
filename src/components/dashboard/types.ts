/**
 * Dashboard Types — shared across all dashboard components
 */

export interface AnalyticsData {
  stats: {
    totalReviews: number
    pendingReviews: number
    repliedReviews: number
    rejectedReviews: number
    avgRating: number
    responseRate: number
    totalReplies: number
    aiGeneratedReplies: number
    editedReplies: number
  }
  sentimentDistribution: {
    positive: number
    negative: number
    neutral: number
  }
  platformDistribution: Record<string, number>
  ratingDistribution: number[]
  timeSeriesData: Array<{
    date: string
    count: number
    totalRating: number
  }>
  recentReviews: Array<{
    id: string
    reviewer_name?: string
    author_name?: string
    rating: number
    review_text?: string
    content?: string
    platform: string
    sentiment_label: 'positive' | 'negative' | 'neutral' | null
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    reply?: {
      id: string
      reply_text?: string
      content?: string
      ai_generated?: boolean
    } | null
  }>
}

export interface AIInsight {
  title: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  percentage: number
  icon: React.ElementType<{ className?: string }>
  color: string
}

export function getEmptyData(): AnalyticsData {
  return {
    stats: {
      totalReviews: 0, pendingReviews: 0, repliedReviews: 0, rejectedReviews: 0,
      avgRating: 0, responseRate: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0
    },
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
    platformDistribution: {},
    ratingDistribution: [0, 0, 0, 0, 0],
    timeSeriesData: [],
    recentReviews: []
  }
}
