'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, Clock, CheckCircle, Star, Plus, 
  Bot, Brain, ChevronRight 
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
}

export default function OverviewTab({
  data,
  loading,
  stats,
  router,
  setActiveTab,
  runAgenticReview
}: OverviewTabProps) {
  return (
    <div className="pt-2 sm:pt-4">
      {/* Stats Grid - Perfectly responsive for all screens */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <ModernStatCard title="Total Reviews" value={stats.totalReviews.toString()} subtitle="All time reviews" icon={MessageSquare} color="blue" delay={0} trend="up" trendValue="12" />
        <ModernStatCard title="Pending" value={stats.pendingReviews.toString()} subtitle="Need your attention" icon={Clock} color="amber" delay={0.1} trend="down" trendValue="5" />
        <ModernStatCard title="Response Rate" value={`${stats.responseRate}%`} subtitle={`${stats.repliedReviews} replied`} icon={CheckCircle} color="emerald" delay={0.2} trend="up" trendValue="8" />
        <ModernStatCard title="Avg Rating" value={stats.avgRating.toString()} subtitle="Out of 5.0" icon={Star} color="purple" delay={0.3} trend="up" trendValue="3" />
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { title: 'Add Reviews', description: 'Import customer reviews manually', icon: Plus, color: 'blue', action: () => router.push('/reviews/add') },
            { title: 'Agentic Reviews', description: 'Auto-process reviews with AI', icon: Brain, color: 'emerald', action: () => runAgenticReview() },
          ].map((action, index) => (

            <motion.button
              key={action.title}
              whileHover={undefined}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 text-left transition-all hover:border-white/20 hover:bg-white/[0.04] hover:shadow-xl active:scale-[0.98]"
            >
              <div className={`inline-flex rounded-xl bg-${action.color}-500/20 p-3 mb-4`}>
                <action.icon className={`h-6 w-6 text-${action.color}-400`} />
              </div>
              <h4 className="font-semibold text-white mb-1">{action.title}</h4>
              <p className="text-sm text-gray-500">{action.description}</p>
              <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600 opacity-0 transition-all group-hover:right-3 group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Reviews */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
          <button onClick={() => setActiveTab('reviews')} className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 active:scale-[0.98]">
            View All <ChevronRight className="h-4 w-4" />
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
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold">
                      {(review.reviewer_name || review.author_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{review.reviewer_name || review.author_name || 'Anonymous'}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <PlatformIcon platform={review.platform} />
                        <span className="capitalize">{review.platform}</span>
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{review.review_text || review.content}</p>
              </motion.div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="text-white font-medium mb-2">No reviews found</h3>
              <p className="text-gray-500 mb-6 max-w-xs mx-auto">Connect your social platforms to start analyzing real customer feedback.</p>
              <button onClick={() => router.push('/connect-platforms')} className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-500 active:scale-[0.98] transition-all">
                Connect Platforms
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  )
}
