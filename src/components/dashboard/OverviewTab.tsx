'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Clock,
  MessageSquare,
  Plug,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AnalyticsData } from './types'
import { ModernStatCard } from './DashboardStats'
import { PlatformIcon } from './DashboardCharts'

interface OverviewTabProps {
  data: AnalyticsData | null
  loading: boolean
  stats: AnalyticsData['stats']
  router: AppRouterInstance
  setActiveTab: (tab: string) => void
  runAgenticReview: () => Promise<void>
  agenticProcessing?: boolean
}

export default function OverviewTab({
  data,
  loading,
  stats,
  router,
  setActiveTab,
  runAgenticReview,
  agenticProcessing = false,
}: OverviewTabProps) {
  const totalReviews = stats.totalReviews || 0
  const hasReviews = totalReviews > 0
  const responseRate = Number(stats.responseRate || 0)
  const averageRating = Number(stats.avgRating || 0)
  const pendingPercent = totalReviews ? Math.round((stats.pendingReviews / totalReviews) * 100) : 0
  const aiReplyPercent = stats.totalReplies ? Math.round((stats.aiGeneratedReplies / stats.totalReplies) * 100) : 0
  const connectedPlatforms = Object.keys(data?.platformDistribution || {}).length
  const latestReviewDate = data?.recentReviews?.[0]?.created_at
    ? new Date(data.recentReviews[0].created_at).toLocaleDateString()
    : 'No reviews yet'

  return (
    <div className="space-y-6 pt-2 sm:pt-4">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14]/90"
      >
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-cyan-200">
              <Activity className="h-3.5 w-3.5" />
              Live workspace
            </div>
            <h1 className="max-w-3xl break-words text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
              Review command center
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Track real customer reviews from Prisma-backed data, reply with AI, and keep pending feedback moving without fake dashboard numbers.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                onClick={() => setActiveTab('reviews')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90 sm:w-auto sm:justify-start"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                Manage reviews
              </button>
              <button
                onClick={() => router.push('/connect-platforms')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10 sm:w-auto sm:justify-start"
              >
                <Plug className="h-4 w-4 shrink-0" />
                Connect platform
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
            {[
              { label: 'Data source', value: 'Prisma reviews', icon: ShieldCheck, tone: 'text-emerald-300' },
              { label: 'Connected sources', value: `${connectedPlatforms} platform${connectedPlatforms === 1 ? '' : 's'}`, icon: Plug, tone: 'text-cyan-300' },
              { label: 'Latest review', value: latestReviewDate, icon: Clock, tone: 'text-violet-300' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5">
                  <item.icon className={`h-5 w-5 ${item.tone}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/35">{item.label}</p>
                  <p className="truncate text-sm font-semibold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ModernStatCard
          title="Total Reviews"
          value={totalReviews.toString()}
          subtitle={hasReviews ? 'Saved in your workspace' : 'Connect a platform to begin'}
          icon={MessageSquare}
          color="blue"
          delay={0}
        />
        <ModernStatCard
          title="Pending"
          value={stats.pendingReviews.toString()}
          subtitle={hasReviews ? `${pendingPercent}% of total reviews` : 'No pending reviews'}
          icon={Clock}
          color={stats.pendingReviews > 0 ? 'amber' : 'emerald'}
          delay={0.1}
        />
        <ModernStatCard
          title="Response Rate"
          value={`${responseRate}%`}
          subtitle={`${stats.repliedReviews} replied from ${totalReviews}`}
          icon={CheckCircle}
          color="emerald"
          delay={0.2}
        />
        <ModernStatCard
          title="Avg Rating"
          value={averageRating.toFixed(1)}
          subtitle={hasReviews ? 'Average customer score' : 'No ratings yet'}
          icon={Star}
          color="purple"
          delay={0.3}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">Quick actions</h3>
              <p className="text-sm text-white/45">Add reviews or let AI prepare replies.</p>
            </div>
            <Sparkles className="h-5 w-5 shrink-0 text-violet-300" />
          </div>
          <div className="grid gap-3">
            {[
              { title: 'Add Reviews', description: 'Import customer reviews manually', icon: Plus, color: 'blue', action: () => router.push('/reviews/add') },
              { title: 'Agentic Reviews', description: 'Auto-process pending reviews with AI', icon: Brain, color: 'emerald', action: () => runAgenticReview() },
            ].map((action) => (
              <motion.button
                key={action.title}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                disabled={action.title === 'Agentic Reviews' && agenticProcessing}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${action.color === 'blue' ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                  {action.title === 'Agentic Reviews' && agenticProcessing ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <action.icon className="h-6 w-6" />
                  )}
                </div>
                <h4 className="mb-1 truncate font-semibold text-white">{action.title}</h4>
                <p className="break-words pr-8 text-sm text-gray-500">
                  {action.title === 'Agentic Reviews' && agenticProcessing ? 'Processing pending reviews...' : action.description}
                </p>
                <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600 opacity-0 transition-all group-hover:right-3 group-hover:opacity-100" />
              </motion.button>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white">Workspace health</h3>
              <p className="text-sm text-white/45">Based on saved review records.</p>
            </div>
            {stats.pendingReviews > 0 ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" />
            ) : (
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'AI reply share', value: `${aiReplyPercent}%`, caption: `${stats.aiGeneratedReplies} AI replies`, color: 'bg-violet-400' },
              { label: 'Needs attention', value: stats.pendingReviews.toString(), caption: 'Pending queue', color: 'bg-amber-400' },
              { label: 'Rejected', value: stats.rejectedReviews.toString(), caption: 'Marked not usable', color: 'bg-rose-400' },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className={`mb-3 h-1.5 w-10 rounded-full ${metric.color}`} />
                <p className="truncate text-2xl font-black text-white">{metric.value}</p>
                <p className="mt-1 truncate text-xs font-bold uppercase tracking-wider text-white/35">{metric.label}</p>
                <p className="mt-2 truncate text-xs text-white/45">{metric.caption}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-lg font-semibold text-white">Recent reviews</h3>
          <button onClick={() => setActiveTab('reviews')} className="flex shrink-0 items-center gap-1 text-sm text-purple-400 hover:text-purple-300 active:scale-[0.98]">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />)
          ) : data?.recentReviews?.length ? (
            data.recentReviews.slice(0, 5).map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold">
                      {(review.reviewer_name || review.author_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-medium text-white">{review.reviewer_name || review.author_name || 'Anonymous'}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <PlatformIcon platform={review.platform} />
                        <span className="truncate capitalize">{review.platform}</span>
                        <span className="shrink-0">-</span>
                        <span className="shrink-0">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 break-words text-sm text-gray-400">{review.review_text || review.content}</p>
              </motion.div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center sm:p-12">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="mb-2 font-medium text-white">No reviews found</h3>
              <p className="mx-auto mb-6 max-w-xs text-gray-500">Connect your social platforms or add a real customer review manually to start analysis.</p>
              <button onClick={() => router.push('/connect-platforms')} className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white transition-all hover:bg-violet-500 active:scale-[0.98]">
                Connect platforms
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  )
}
