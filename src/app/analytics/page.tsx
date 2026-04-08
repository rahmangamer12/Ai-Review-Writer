'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star, TrendingUp, RefreshCw, Database,
  Brain, Layers, ThumbsUp, ThumbsDown, Meh,
  Zap, ArrowUpRight, Sparkles, ChevronLeft
} from 'lucide-react'
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary'

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  google: 'from-blue-500 to-red-500',
  facebook: 'from-blue-600 to-blue-400',
  yelp: 'from-red-600 to-red-400',
  tripadvisor: 'from-emerald-500 to-emerald-400',
  trustpilot: 'from-emerald-600 to-emerald-400',
  other: 'from-gray-500 to-gray-400'
}

// ─── UI Components ────────────────────────────────────────────────────────────

const PremiumGlass = ({ children, className = '', glow = true }: { children: React.ReactNode, className?: string, glow?: boolean }) => (
  <div className={`relative group rounded-3xl border border-white/5 bg-[#0d0d1a]/60 backdrop-blur-xl transition-all duration-500 ${glow ? 'hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]' : ''} ${className}`}>
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
)

const StatCard = ({ title, value, icon: Icon, color, trend, delay }: any) => {
  const colorMap: any = {
    violet: 'from-violet-600 via-indigo-600 to-purple-600 shadow-violet-500/30',
    blue: 'from-blue-600 via-cyan-600 to-indigo-600 shadow-blue-500/30',
    emerald: 'from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/30',
    amber: 'from-amber-600 via-orange-600 to-yellow-600 shadow-amber-500/30',
    rose: 'from-rose-600 via-pink-600 to-rose-700 shadow-rose-500/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="relative group h-full"
    >
      <PremiumGlass className="p-6 sm:p-8 h-full flex flex-col justify-between border-white/5 hover:border-white/10 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
           <Icon className="w-16 sm:w-24 h-16 sm:h-24 rotate-12" />
        </div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 border border-white/20`}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-tighter ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="relative z-10">
          <h3 className="text-white/30 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-2">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-white tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{value}</span>
            <div className="h-1 w-8 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
      </PremiumGlass>
    </motion.div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  stats: {
    totalReviews: number; pendingReviews: number; repliedReviews: number; rejectedReviews?: number;
    avgRating: number; responseRate: number; totalReplies?: number; aiGeneratedReplies?: number; editedReplies?: number;
  };
  sentimentDistribution: { positive: number; negative: number; neutral: number };
  platformDistribution: Record<string, number>;
  ratingDistribution: number[];
  timeSeriesData: { date: string; count: number; avgRating?: number; totalRating?: number }[];
  weeklyRatingTrend?: { week: string; avgRating: number; count: number }[];
  topKeywords?: { word: string; count: number }[];
  recentReviews: any[];
}

interface AIInsights {
  summary?: string;
  overall_trends?: string[];
  common_praises?: string[];
  improvement_suggestions?: string[];
}

function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')
  
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/stats-overview?days=${timeRange}`).catch(() => null)
      
      if (!res || !res.ok) {
        const emptyData: AnalyticsData = {
          stats: { totalReviews: 0, pendingReviews: 0, repliedReviews: 0, avgRating: 0, responseRate: 0 },
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
          platformDistribution: {},
          ratingDistribution: [0, 0, 0, 0, 0],
          timeSeriesData: [],
          recentReviews: []
        }
        setAnalyticsData(emptyData)
        setInsights({
          summary: "No analytics data available. Connect a platform to start tracking your reviews.",
          improvement_suggestions: [
            "Connect your Google Business profile",
            "Link your Facebook page",
            "Integrate with Yelp for business"
          ]
        })
        setLoading(false)
        return
      }
      
      const data: AnalyticsData & { insights: AIInsights } = await res.json()
      setAnalyticsData(data)
      setInsights(data.insights || null)
    } catch (err) {
      console.error('[Analytics] Fetch failed:', err)
      const emptyData: AnalyticsData = {
        stats: { totalReviews: 0, pendingReviews: 0, repliedReviews: 0, avgRating: 0, responseRate: 0, rejectedReviews: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0 },
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        platformDistribution: {},
        ratingDistribution: [0, 0, 0, 0, 0],
        timeSeriesData: [],
        weeklyRatingTrend: [],
        topKeywords: [],
        recentReviews: []
      }
      setAnalyticsData(emptyData)
      setInsights({
        summary: "No analytics data available. Connect a platform to start tracking your reviews.",
        improvement_suggestions: [
          "Connect your Google Business profile",
          "Link your Facebook page",
          "Integrate with Yelp for business"
        ]
      })
    } finally {
      setTimeout(() => setLoading(false), 800)
    }
  }, [timeRange])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
              borderRadius: ["25%", "50%", "25%"]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-8"
          />
          <h2 className="text-white/60 font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs animate-pulse">Initializing Neural Engine</h2>
        </div>
      </div>
    )
  }

  const stats = analyticsData?.stats
  const sentiment = analyticsData?.sentimentDistribution || { positive: 0, neutral: 0, negative: 0 }
  const topKeywords = analyticsData?.topKeywords || []
  const timeSeriesData = analyticsData?.timeSeriesData || []
  const platformDistribution = analyticsData?.platformDistribution || {}
  const hasData = stats && stats.totalReviews > 0

  return (
    <div className="min-h-[100dvh] text-white selection:bg-violet-500/30 overflow-x-hidden w-full bg-[#030308]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8 lg:py-16">

        {/* ── Mobile Back Header ────────────────────────────────────────── */}
        <div className="md:hidden sticky top-0 z-[40] bg-[#030308]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/5 rounded-xl border border-white/10 active:scale-95 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Analytics</p>
            <p className="text-xs font-bold text-white/60">Neural Matrix V4</p>
          </div>
        </div>

        <div className="px-4 md:px-0 pt-8 md:pt-0">
          {/* ── Header ───────────────────────────────────────────────────────── */}
          <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 xl:gap-8 mb-12 sm:mb-16 lg:mb-24 relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                <div className="px-4 py-1.5 bg-violet-600/10 border border-violet-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-violet-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Neural Intelligence Terminal
                </div>
                <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-violet-500/50 to-transparent" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] sm:leading-none"
              >
                Enterprise <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">Analytics</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/50 text-sm sm:text-base lg:text-xl max-w-2xl font-medium leading-relaxed">
                Synthesizing cross-platform review data into <span className="text-white">actionable intelligence</span> through neural pattern recognition.
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="flex flex-1 sm:flex-none p-1 bg-white/5 border border-white/10 rounded-2xl">
                {(['7', '30', '90'] as const).map(range => (
                  <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[10px] font-black transition-all active:scale-95 ${timeRange === range ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                    {range}D
                  </button>
                ))}
              </div>
              <button onClick={fetchData} className="min-h-[44px] min-w-[44px] flex items-center justify-center p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-90">
                <RefreshCw className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </motion.div>
          </header>

          {!hasData ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8">
              <PremiumGlass className="p-8 sm:p-16 lg:p-24 flex flex-col items-center text-center max-w-4xl mx-auto border-dashed border-white/20">
                <div className="relative mb-12">
                  <div className="absolute inset-0 bg-violet-600/20 blur-[50px] rounded-full animate-pulse" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 shadow-2xl">
                    <Database className="w-10 h-10 sm:w-12 sm:h-12 text-violet-400" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 tracking-tight">Data Nodes Disconnected</h2>
                <p className="text-white/40 text-sm sm:text-lg mb-12 max-w-md mx-auto leading-relaxed font-medium">
                  Your analytics matrix is offline. Connect platforms to initialize review ingestion.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button onClick={() => router.push('/connect-platforms')} className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-violet-400 hover:text-white transition-all shadow-xl active:scale-95">
                    Connect Platforms
                  </button>
                  <button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all">
                    Return to Base
                  </button>
                </div>
              </PremiumGlass>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Global Volume" value={stats.totalReviews} icon={Layers} color="violet" trend={12} delay={0.1} />
                <StatCard title="Quality Score" value={`${stats.avgRating}/5`} icon={Star} color="amber" trend={2.4} delay={0.2} />
                <StatCard title="Neural Sync" value={`${stats.responseRate}%`} icon={Zap} color="emerald" trend={8.1} delay={0.3} />
                <StatCard title="Positive Delta" value={`${stats.totalReviews ? Math.round((sentiment.positive / stats.totalReviews) * 100) : 0}%`} icon={ThumbsUp} color="blue" trend={5.2} delay={0.4} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                <div className="xl:col-span-2">
                  <PremiumGlass className="p-6 sm:p-8 h-full flex flex-col">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Temporal Activity</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Review ingestion over {timeRange}d</p>
                    </div>
                    
                    <div className="flex-1 min-h-[240px] flex items-end gap-1 sm:gap-3 px-2 mt-12">
                      {timeSeriesData.slice(-Number(timeRange)).map((day, i) => {
                        const maxCount = Math.max(...timeSeriesData.map(d => d.count), 1)
                        const height = (day.count / maxCount) * 100
                        return (
                          <div key={i} className="flex-1 group relative h-full flex items-end">
                            <motion.div 
                              initial={{ height: 0 }} 
                              whileInView={{ height: `${Math.max(height, 8)}%` }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.015, duration: 1.2, type: "spring" }}
                              className={`w-full rounded-t-xl transition-all duration-500 relative ${day.count > 0 ? 'bg-gradient-to-t from-violet-600/40 to-violet-400/90 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5'}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </PremiumGlass>
                </div>

                <PremiumGlass className="p-6 sm:p-8 h-full">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">Sentiment Matrix</h3>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-12">Neural classification</p>
                  
                  <div className="space-y-8">
                    {[
                      { label: 'Positive', val: sentiment.positive, total: stats.totalReviews || 1, color: 'from-emerald-500 to-teal-400', icon: ThumbsUp },
                      { label: 'Neutral', val: sentiment.neutral, total: stats.totalReviews || 1, color: 'from-amber-500 to-orange-400', icon: Meh },
                      { label: 'Negative', val: sentiment.negative, total: stats.totalReviews || 1, color: 'from-rose-500 to-pink-400', icon: ThumbsDown },
                    ].map((item, i) => (
                      <div key={item.label} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{item.label}</span>
                          </div>
                          <span className="text-xs font-black text-white">{Math.round((item.val / item.total) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${(item.val / item.total) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </PremiumGlass>
              </div>

              {insights && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    <PremiumGlass className="p-8 lg:p-10 relative overflow-hidden">
                      <h3 className="text-2xl font-black text-white tracking-tight mb-6">Autonomous Summary</h3>
                      <p className="text-sm sm:text-lg text-violet-100/70 leading-relaxed font-medium relative z-10">
                        {insights.summary}
                      </p>
                    </PremiumGlass>

                    <PremiumGlass className="p-8 lg:p-10">
                      <h3 className="text-2xl font-black text-white tracking-tight mb-8">Optimization Strategies</h3>
                      <div className="space-y-6">
                        {(insights.improvement_suggestions || []).map((s, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 active:scale-95 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 font-black text-xs">
                              0{i + 1}
                            </div>
                            <p className="text-white/70 text-sm font-medium leading-relaxed">{s}</p>
                          </div>
                        ))}
                      </div>
                    </PremiumGlass>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="relative z-10 border-t border-white/5 bg-[#080810]/80 backdrop-blur-xl py-12 pb-[calc(100px+env(safe-area-inset-bottom))]">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 font-black text-sm">V4</div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">AutoReview AI • Neural Matrix Analytics</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/40">
            <Link href="/docs" className="hover:text-violet-400 transition-colors">Documentation</Link>
            <Link href="/status" className="hover:text-violet-400 transition-colors">API Status</Link>
            <Link href="/compliance" className="hover:text-violet-400 transition-colors">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function AnalyticsPageWithErrorBoundary() {
  return (
    <EnhancedErrorBoundary>
      <AnalyticsPage />
    </EnhancedErrorBoundary>
  )
}
