'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, Sparkles, Download, RefreshCw, MessageSquare, 
  Star, CheckCircle, Bot, Activity, Globe, PieChart, 
  ArrowUpRight, ArrowDownRight, Minus, Lightbulb, 
  Cpu, Clock3, Users, AlertCircle 
} from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AnalyticsData, AIInsight } from './types'
import { ModernStatCard } from './DashboardStats'
import { 
  ModernLineChart, PlatformDistributionCard, SentimentCard 
} from './DashboardCharts'

interface AnalyticsTabProps {
  data: AnalyticsData | null
  loading: boolean
  stats: AnalyticsData['stats']
  timeRange: number
  setTimeRange: (range: number) => void
  refreshing: boolean
  fetchAnalytics: () => Promise<void>
  showAIInsightsPanel: boolean
  setShowAIInsightsPanel: (show: boolean) => void
  setShowExportModal: (show: boolean) => void
  aiInsights: AIInsight[]
  router: AppRouterInstance
}

const insightColorClasses: Record<string, { bg: string; icon: string }> = {
  emerald: { bg: 'bg-emerald-500/20', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/20', icon: 'text-amber-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400' },
  rose: { bg: 'bg-rose-500/20', icon: 'text-rose-400' },
  blue: { bg: 'bg-blue-500/20', icon: 'text-blue-400' },
  cyan: { bg: 'bg-cyan-500/20', icon: 'text-cyan-400' },
}

export default function AnalyticsTab({
  data,
  loading,
  stats,
  timeRange,
  setTimeRange,
  refreshing,
  fetchAnalytics,
  showAIInsightsPanel,
  setShowAIInsightsPanel,
  setShowExportModal,
  aiInsights,
  router
}: AnalyticsTabProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-w-0 space-y-6 pt-2 sm:pt-4">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-2 shrink-0">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <span className="truncate">Analytics Dashboard</span>
          </h2>
          <p className="text-gray-500 mt-1 sm:ml-12">
            Deep insights into your review performance powered by AI
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* AI Insights Toggle */}
          <button
            onClick={() => setShowAIInsightsPanel(!showAIInsightsPanel)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              showAIInsightsPanel 
                ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' 
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            AI Insights
          </button>
          
          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-all"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          
          {/* Time Range */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  timeRange === days ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
          
          <button onClick={() => fetchAnalytics()} disabled={refreshing} className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white active:scale-[0.98]">
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAIInsightsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-purple-500/20 p-2 shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">AI-Powered Insights</h3>
                  <p className="text-xs text-gray-500 truncate">Generated by LongCat AI based on your data</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`shrink-0 rounded-lg ${insightColorClasses[insight.color]?.bg || insightColorClasses.purple.bg} p-2`}>
                        <insight.icon className={`h-4 w-4 ${insightColorClasses[insight.color]?.icon || insightColorClasses.purple.icon}`} />
                      </div>
                      <div className={`flex shrink-0 items-center gap-1 text-xs ${
                        insight.trend === 'up' ? 'text-emerald-400' :
                        insight.trend === 'down' ? 'text-rose-400' :
                        'text-gray-400'
                      }`}>
                        {insight.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> :
                         insight.trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> :
                         <Minus className="h-3 w-3" />}
                        {insight.percentage}%
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white truncate">{insight.value}</p>
                    <p className="text-sm text-gray-500 truncate">{insight.title}</p>
                  </motion.div>
                ))}
              </div>
              
              {/* AI Recommendations */}
              <div className="mt-6 grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">What&apos;s Working</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Response rate is calculated from reviews that have saved replies.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      AI reply count only includes replies saved on real review records.
                    </li>
                  </ul>
                </div>
                
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Recommendations</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Enable auto-reply for 5-star reviews
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Respond to negative reviews within 24 hours
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Stats Grid */}
      {!loading && stats.totalReviews === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-white/[0.05] p-8 sm:p-12 lg:p-20 text-center relative overflow-hidden my-8">
          <div className="pointer-events-none absolute top-0 left-1/4 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
              <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Your Dashboard is Empty</h3>
            <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-10 max-w-xl mx-auto">Connect your business platforms to start collecting and responding to reviews with AutoReview AI.</p>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-4">
              <button onClick={() => router.push('/connect-platforms')}
                className="group relative overflow-hidden rounded-xl bg-purple-600 px-6 sm:px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-[0.98]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5 shrink-0" /> Connect Platforms
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <ModernStatCard title="Total Reviews" value={stats.totalReviews.toString()} subtitle="All time reviews" icon={MessageSquare} color="blue" delay={0} trend="up" trendValue="12" />
            <ModernStatCard title="Avg Rating" value={stats.avgRating.toString()} subtitle="Out of 5.0 stars" icon={Star} color="amber" delay={0.1} trend="up" trendValue="5" />
            <ModernStatCard title="Response Rate" value={`${stats.responseRate}%`} subtitle={`${stats.repliedReviews} replied`} icon={CheckCircle} color="emerald" delay={0.2} trend="up" trendValue="8" />
            <ModernStatCard title="AI Replies" value={stats.aiGeneratedReplies.toString()} subtitle="Auto-generated" icon={Bot} color="purple" delay={0.3} trend="up" trendValue="15" />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
            {/* Activity Chart - Takes 2 columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="min-w-0 lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
            >
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-blue-500/20 p-2 shrink-0">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">Review Activity</h3>
                    <p className="text-xs text-gray-500 truncate">Reviews over the last {timeRange} days</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-gray-400">Reviews</span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="h-56 sm:h-64 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <div className="w-full min-w-0">
                  <ModernLineChart data={(data?.timeSeriesData || []).map(item => ({ date: item.date, value: item.count || 0 }))} color="blue" />
                </div>
              )}
              
              {/* X-axis labels */}
              <div className="mt-4 flex justify-between text-xs text-gray-500">
                <span>{timeRange} days ago</span>
                <span>Today</span>
              </div>
            </motion.div>

            {/* Platform Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="min-w-0 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500/20 p-2 shrink-0">
                  <Globe className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">Platforms</h3>
                  <p className="text-xs text-gray-500 truncate">Reviews by source</p>
                </div>
              </div>

              {loading ? (
                <div className="h-48 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <div className="w-full min-w-0">
                  <PlatformDistributionCard data={data?.platformDistribution || {}} />
                </div>
              )}
            </motion.div>
          </div>

          {/* Second Row of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sentiment Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="min-w-0 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2 shrink-0">
                  <PieChart className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">Sentiment Analysis</h3>
                  <p className="text-xs text-gray-500 truncate">AI-powered emotion detection</p>
                </div>
              </div>

              {loading ? (
                <div className="h-48 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <div className="w-full min-w-0">
                  <SentimentCard data={data?.sentimentDistribution || { positive: 0, negative: 0, neutral: 0 }} />
                </div>
              )}

              {/* Sentiment Summary */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 border-t border-white/5 pt-4">
                {[
                  { label: 'Positive', value: data?.sentimentDistribution?.positive || 0, color: 'text-emerald-400' },
                  { label: 'Neutral', value: data?.sentimentDistribution?.neutral || 0, color: 'text-amber-400' },
                  { label: 'Negative', value: data?.sentimentDistribution?.negative || 0, color: 'text-rose-400' },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 text-center">
                    <p className={`text-2xl font-bold truncate ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-gray-500 truncate">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="min-w-0 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/20 p-2 shrink-0">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">Rating Distribution</h3>
                  <p className="text-xs text-gray-500 truncate">Breakdown by star rating</p>
                </div>
              </div>
              
              {loading ? (
                <div className="h-48 animate-pulse rounded-xl bg-white/5" />
              ) : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars, index) => {
                    const count = data?.ratingDistribution?.[stars - 1] || 0
                    const total = data?.ratingDistribution?.reduce((a, b) => a + b, 0) || 1
                    const percentage = (count / total) * 100
                    
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex w-12 shrink-0 items-center gap-1">
                          <span className="text-sm font-medium text-white">{stars}</span>
                          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                              className={`h-full rounded-full ${
                                stars >= 4 ? 'bg-emerald-500' :
                                stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="w-16 shrink-0 text-right">
                          <span className="text-sm text-gray-400">{count}</span>
                          <span className="ml-1 text-xs text-gray-600">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* AI Performance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="min-w-0 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-6"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-purple-500/20 p-2 shrink-0">
                  <Cpu className="h-5 w-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">AI Performance Metrics</h3>
                  <p className="text-xs text-gray-500 truncate">How AI is helping your business</p>
                </div>
              </div>
              <div className="shrink-0 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                Powered by LongCat AI
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="min-w-0 rounded-xl bg-white/5 p-4">
                <p className="text-2xl sm:text-3xl font-bold text-white truncate">{stats.aiGeneratedReplies}</p>
                <p className="text-sm text-gray-500 mt-1 truncate">AI Replies Generated</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">+23% this week</span>
                </div>
              </div>

              <div className="min-w-0 rounded-xl bg-white/5 p-4">
                <p className="text-2xl sm:text-3xl font-bold text-white truncate">{stats.editedReplies}</p>
                <p className="text-sm text-gray-500 mt-1 truncate">Human Edits</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                  <Minus className="h-3 w-3 shrink-0" />
                  <span className="truncate">12% edit rate</span>
                </div>
              </div>

              <div className="min-w-0 rounded-xl bg-white/5 p-4">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 truncate">
                  {stats.aiGeneratedReplies > 0
                    ? Math.round((1 - stats.editedReplies / stats.aiGeneratedReplies) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1 truncate">AI Accuracy</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">+5% improvement</span>
                </div>
              </div>

              <div className="min-w-0 rounded-xl bg-white/5 p-4">
                <p className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {Math.round((stats.repliedReviews / Math.max(stats.totalReviews, 1)) * 100)}%
                </p>
                <p className="text-sm text-gray-500 mt-1 truncate">Response Coverage</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                  <ArrowUpRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">On track</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2 shrink-0">
                  <Clock3 className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-white truncate">2.4h</p>
                  <p className="text-xs text-gray-500 truncate">Avg Response Time</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-500/20 p-2 shrink-0">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-white truncate">{stats.totalReviews > 0 ? Math.round(stats.totalReviews / 30) : 0}</p>
                  <p className="text-xs text-gray-500 truncate">Reviews per Day</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="col-span-2 sm:col-span-1 min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-500/20 p-2 shrink-0">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-white truncate">{stats.pendingReviews}</p>
                  <p className="text-xs text-gray-500 truncate">Awaiting Response</p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  )
}
