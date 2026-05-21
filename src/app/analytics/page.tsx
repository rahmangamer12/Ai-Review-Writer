'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Database,
  LineChart,
  MessageSquare,
  RefreshCw,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Zap,
} from 'lucide-react'
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary'

interface AnalyticsData {
  stats: {
    totalReviews: number
    pendingReviews: number
    repliedReviews: number
    rejectedReviews?: number
    avgRating: number
    responseRate: number
    totalReplies?: number
    aiGeneratedReplies?: number
    editedReplies?: number
  }
  sentimentDistribution: { positive: number; negative: number; neutral: number }
  platformDistribution: Record<string, number>
  ratingDistribution: number[]
  timeSeriesData: { date: string; count: number; avgRating?: number; totalRating?: number }[]
  weeklyRatingTrend?: { week: string; avgRating: number; count: number }[]
  topKeywords?: { word: string; count: number }[]
  recentReviews: any[]
}

interface AIInsights {
  summary?: string
  overall_trends?: string[]
  common_praises?: string[]
  improvement_suggestions?: string[]
}

const emptyAnalytics: AnalyticsData = {
  stats: {
    totalReviews: 0,
    pendingReviews: 0,
    repliedReviews: 0,
    rejectedReviews: 0,
    avgRating: 0,
    responseRate: 0,
    totalReplies: 0,
    aiGeneratedReplies: 0,
    editedReplies: 0,
  },
  sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
  platformDistribution: {},
  ratingDistribution: [0, 0, 0, 0, 0],
  timeSeriesData: [],
  weeklyRatingTrend: [],
  topKeywords: [],
  recentReviews: [],
}

function MetricCard({ label, value, detail, icon: Icon, tone }: any) {
  const tones: Record<string, string> = {
    violet: 'border-violet-400/20 bg-violet-500/10 text-violet-200',
    amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
    emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    cyan: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tones[tone] || tones.violet}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
          Live
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/45">{detail}</p>
    </div>
  )
}

function EmptyState() {
  const router = useRouter()

  return (
    <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center shadow-2xl sm:p-10">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10">
        <Database className="h-9 w-9 text-violet-200" />
      </div>
      <h2 className="text-2xl font-black text-white sm:text-3xl">No review data yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/50">
        Connect a platform or add real customer reviews manually. Analytics will appear here as soon as reviews exist in your workspace.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={() => router.push('/connect-platforms')}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition-all hover:bg-cyan-50"
        >
          Connect Platforms
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push('/reviews/add')}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white transition-all hover:bg-white/10"
        >
          Add Review
        </button>
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(emptyAnalytics)
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/data-hub?days=${timeRange}`, { cache: 'no-store' }).catch(() => null)
      if (!response || !response.ok) {
        setAnalyticsData(emptyAnalytics)
        setInsights({ summary: 'No analytics data available yet.' })
        return
      }

      const data: AnalyticsData & { insights?: AIInsights } = await response.json()
      setAnalyticsData({ ...emptyAnalytics, ...data })
      setInsights(data.insights || null)
    } catch (error) {
      console.error('[Analytics] Fetch failed:', error)
      setAnalyticsData(emptyAnalytics)
      setInsights({ summary: 'No analytics data available yet.' })
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const stats = analyticsData.stats
  const sentiment = analyticsData.sentimentDistribution
  const hasData = stats.totalReviews > 0
  const timeSeries = analyticsData.timeSeriesData.slice(-Number(timeRange))
  const maxCount = Math.max(...timeSeries.map((item) => item.count), 1)
  const topPlatforms = Object.entries(analyticsData.platformDistribution).sort((a, b) => b[1] - a[1])
  const totalSentiment = Math.max(sentiment.positive + sentiment.neutral + sentiment.negative, 1)

  const ratingRows = useMemo(() => {
    return analyticsData.ratingDistribution.map((count, index) => ({
      stars: index + 1,
      count,
      width: `${(count / Math.max(...analyticsData.ratingDistribution, 1)) * 100}%`,
    })).reverse()
  }, [analyticsData.ratingDistribution])

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#030308] text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-300" />
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/35">Loading analytics</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#030308] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute left-1/4 top-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between md:hidden">
          <button onClick={() => router.push('/dashboard')} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Analytics</p>
        </div>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/75">
                <LineChart className="h-3.5 w-3.5" />
                Local Review Analytics
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">Review Analytics</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                Track rating health, sentiment, response progress, and review volume from real customer feedback.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex rounded-2xl border border-white/10 bg-black/20 p-1">
                {(['7', '30', '90'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-xl px-5 py-2.5 text-xs font-black transition-all ${timeRange === range ? 'bg-white text-slate-950' : 'text-white/45 hover:text-white'}`}
                  >
                    {range}D
                  </button>
                ))}
              </div>
              <button onClick={fetchData} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {!hasData ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total reviews" value={stats.totalReviews} detail="Reviews saved in your workspace." icon={MessageSquare} tone="violet" />
              <MetricCard label="Average rating" value={`${stats.avgRating}/5`} detail="Current customer rating health." icon={Star} tone="amber" />
              <MetricCard label="Response rate" value={`${stats.responseRate}%`} detail="Reviews with a reply or draft." icon={Zap} tone="emerald" />
              <MetricCard label="Pending work" value={stats.pendingReviews} detail="Reviews still waiting for action." icon={AlertCircle} tone="cyan" />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white">Review Volume</h2>
                    <p className="mt-1 text-xs text-white/40">Incoming reviews over the selected range.</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-violet-300" />
                </div>
                <div className="flex h-64 items-end gap-2 rounded-3xl border border-white/5 bg-black/20 p-4">
                  {timeSeries.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/35">No timeline data yet.</div>
                  ) : (
                    timeSeries.map((day, index) => (
                      <div key={`${day.date}-${index}`} className="group flex h-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-xl bg-gradient-to-t from-violet-600/60 to-cyan-300 shadow-lg shadow-violet-500/10 transition-all group-hover:from-violet-500"
                          style={{ height: `${Math.max((day.count / maxCount) * 100, day.count > 0 ? 8 : 2)}%` }}
                          title={`${day.date}: ${day.count} reviews`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-black text-white">Sentiment Mix</h2>
                  <p className="mt-1 text-xs text-white/40">How customers feel across saved reviews.</p>
                </div>
                <div className="space-y-5">
                  {[
                    { label: 'Positive', value: sentiment.positive, icon: ThumbsUp, color: 'bg-emerald-400' },
                    { label: 'Neutral', value: sentiment.neutral, icon: TrendingUp, color: 'bg-amber-300' },
                    { label: 'Negative', value: sentiment.negative, icon: ThumbsDown, color: 'bg-rose-400' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-white/70"><item.icon className="h-4 w-4" /> {item.label}</span>
                        <span className="font-bold text-white">{Math.round((item.value / totalSentiment) * 100)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / totalSentiment) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6">
                <h2 className="text-xl font-black text-white">Rating Breakdown</h2>
                <div className="mt-6 space-y-3">
                  {ratingRows.map((row) => (
                    <div key={row.stars} className="grid grid-cols-[44px_1fr_34px] items-center gap-3 text-sm">
                      <span className="text-white/55">{row.stars} star</span>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-amber-300" style={{ width: row.width }} />
                      </div>
                      <span className="text-right text-white/55">{row.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6">
                <h2 className="text-xl font-black text-white">Platforms</h2>
                <div className="mt-6 space-y-3">
                  {topPlatforms.length === 0 ? (
                    <p className="text-sm text-white/40">No connected platform data yet.</p>
                  ) : (
                    topPlatforms.map(([platform, count]) => (
                      <div key={platform} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                        <span className="capitalize text-white/70">{platform}</span>
                        <span className="font-black text-white">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl sm:p-6">
                <h2 className="text-xl font-black text-white">AI Notes</h2>
                <p className="mt-4 text-sm leading-relaxed text-white/55">
                  {insights?.summary || 'No AI insight summary yet. Add more reviews to generate useful trends.'}
                </p>
                <div className="mt-5 space-y-3">
                  {(insights?.improvement_suggestions || []).slice(0, 3).map((item, index) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                      <span className="mr-2 font-black text-cyan-300">0{index + 1}</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-10 flex flex-col gap-4 border-t border-white/10 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>AutoReview AI - Local Review Analytics</span>
          <div className="flex gap-5">
            <Link href="/docs" className="hover:text-white">Documentation</Link>
            <Link href="/status" className="hover:text-white">API Status</Link>
            <Link href="/compliance" className="hover:text-white">Compliance</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default function AnalyticsPageWithErrorBoundary() {
  return (
    <EnhancedErrorBoundary>
      <AnalyticsPage />
    </EnhancedErrorBoundary>
  )
}
