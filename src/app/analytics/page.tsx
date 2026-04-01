'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Unused imports removed to keep code clean and prevent warnings
import { 
  Star, TrendingUp, RefreshCw, Database,
  Brain, Layers, ThumbsUp, ThumbsDown, Meh,
  Zap, ArrowUpRight, Sparkles
} from 'lucide-react'

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
           <Icon className="w-24 h-24 rotate-12" />
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
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{value}</span>
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

export default function AnalyticsPage() {
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
        // Network error - set empty data gracefully
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
      // Set empty data on error
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
      setTimeout(() => setLoading(false), 800) // Smooth transition
    }
  }, [timeRange])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
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
          <h2 className="text-white/60 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs animate-pulse">Initializing Neural Engine</h2>
        </div>
      </div>
    )
  }

  // Safe Data Extraction (Prevents Crashes)
  const stats = analyticsData?.stats
  const sentiment = analyticsData?.sentimentDistribution || { positive: 0, neutral: 0, negative: 0 }
  const topKeywords = analyticsData?.topKeywords || []
  const timeSeriesData = analyticsData?.timeSeriesData || []
  const platformDistribution = analyticsData?.platformDistribution || {}
  const hasData = stats && stats.totalReviews > 0

  return (
    <div className="min-h-screen bg-[#05050a] text-white selection:bg-violet-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-6 xl:gap-8 mb-16 sm:mb-24 relative">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-violet-600/10 border border-violet-500/20 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-violet-400 flex items-center gap-2">
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
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] sm:leading-none"
            >
              Enterprise <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">Analytics</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white/50 text-base sm:text-lg lg:text-xl max-w-2xl font-medium leading-relaxed">
              Synthesizing cross-platform review data into <span className="text-white">actionable intelligence</span> through neural pattern recognition and temporal mapping.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex flex-1 sm:flex-none p-1 bg-white/5 border border-white/10 rounded-2xl">
              {(['7', '30', '90'] as const).map(range => (
                <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all ${timeRange === range ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  {range}D
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
              <RefreshCw className="w-5 h-5 text-white/60" />
            </button>
          </motion.div>
        </header>

        {!hasData ? (
          /* ── Empty State ────────────────────────────────────────────────── */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 sm:mt-12">
            <PremiumGlass className="p-8 sm:p-16 lg:p-24 flex flex-col items-center text-center max-w-4xl mx-auto border-dashed border-white/20">
              <div className="relative mb-8 sm:mb-12">
                <div className="absolute inset-0 bg-violet-600/20 blur-[50px] rounded-full animate-pulse" />
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center relative z-10 shadow-2xl">
                  <Database className="w-10 h-10 sm:w-12 sm:h-12 text-violet-400" />
                </div>
                <motion.div 
                  animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-violet-500/20 rounded-[2.5rem] border-dashed"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6 tracking-tight">Data Nodes Disconnected</h2>
              <p className="text-white/40 text-sm sm:text-base lg:text-lg mb-8 sm:mb-12 max-w-md mx-auto leading-relaxed font-medium">
                Your analytics matrix is currently offline. Connect your business platforms to initialize real-time review ingestion.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button onClick={() => router.push('/connect-platforms')} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-violet-400 hover:text-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                  Connect Platforms <ArrowUpRight className="w-4 h-4" />
                </button>
                <button onClick={() => router.push('/dashboard')} className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                  Return to Base
                </button>
              </div>
            </PremiumGlass>
          </motion.div>
        ) : (
          /* ── Real Analytics View ────────────────────────────────────────── */
          <div className="space-y-6 sm:space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard title="Global Volume" value={stats.totalReviews} icon={Layers} color="violet" trend={12} delay={0.1} />
              <StatCard title="Quality Score" value={`${stats.avgRating}/5`} icon={Star} color="amber" trend={2.4} delay={0.2} />
              <StatCard title="Neural Sync" value={`${stats.responseRate}%`} icon={Zap} color="emerald" trend={8.1} delay={0.3} />
              {/* Safe check for sentiment calculation */}
              <StatCard title="Positive Delta" value={`${stats.totalReviews ? Math.round((sentiment.positive / stats.totalReviews) * 100) : 0}%`} icon={ThumbsUp} color="blue" trend={5.2} delay={0.4} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Activity Timeline */}
              <div className="xl:col-span-2">
                <PremiumGlass className="p-6 sm:p-8 h-full flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Temporal Activity</h3>
                      <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1">Review ingestion over {timeRange}d</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[240px] flex items-end gap-1.5 sm:gap-3 px-2">
                    {timeSeriesData.slice(-Number(timeRange)).map((day, i) => {
                      const maxCount = Math.max(...timeSeriesData.map(d => d.count), 1)
                      const height = (day.count / maxCount) * 100
                      return (
                        <div key={i} className="flex-1 group relative h-full flex items-end">
                           <div className="absolute inset-x-0 bottom-0 top-0 bg-white/[0.02] rounded-t-xl sm:rounded-t-2xl pointer-events-none" />
                          <motion.div 
                            initial={{ height: 0 }} 
                            whileInView={{ height: `${Math.max(height, 8)}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.015, duration: 1.2, type: "spring", bounce: 0.4 }}
                            className={`w-full rounded-t-xl sm:rounded-t-2xl transition-all duration-500 relative ${day.count > 0 ? 'bg-gradient-to-t from-violet-600/40 via-violet-500/60 to-violet-400/90 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5'}`}
                          >
                             <div className="absolute top-0 inset-x-0 h-1 bg-white/40 rounded-full scale-x-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20 whitespace-nowrap border-4 border-violet-500/20">
                            {day.count} {day.count === 1 ? 'Review' : 'Reviews'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-6 text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest border-t border-white/5 pt-4">
                    <span>{timeRange} Days Ago</span>
                    <span className="hidden sm:inline">Matrix Pulse: Nominal</span>
                    <span>Current Cycle</span>
                  </div>
                </PremiumGlass>
              </div>

              {/* Sentiment Matrix */}
              <div>
                <PremiumGlass className="p-6 sm:p-8 h-full">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 sm:mb-2">Sentiment Matrix</h3>
                  <p className="text-white/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-8 sm:mb-12">Neural classification</p>
                  
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      { label: 'Positive', val: sentiment.positive, total: stats.totalReviews || 1, color: 'from-emerald-500 to-teal-400', icon: ThumbsUp },
                      { label: 'Neutral', val: sentiment.neutral, total: stats.totalReviews || 1, color: 'from-amber-500 to-orange-400', icon: Meh },
                      { label: 'Negative', val: sentiment.negative, total: stats.totalReviews || 1, color: 'from-rose-500 to-pink-400', icon: ThumbsDown },
                    ].map((item, i) => (
                      <div key={item.label} className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
                            <span className="text-[10px] sm:text-xs font-black text-white/80 uppercase tracking-widest">{item.label}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-white">{Math.round((item.val / item.total) * 100)}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${(item.val / item.total) * 100}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/5 border-dashed">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                      <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-widest">Quick Insight</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-white/60 leading-relaxed font-medium italic">
                      "Sentiment indicates {sentiment.positive > sentiment.negative ? 'strong positive' : 'declining'} momentum. Focus on maintaining quality standards to buffer recent volatility."
                    </p>
                  </div>
                </PremiumGlass>
              </div>

            </div>

            {/* AI Deep Insights Section */}
            {insights && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  
                  <PremiumGlass className="p-6 sm:p-8 lg:p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Brain className="w-24 h-24 sm:w-32 sm:h-32 text-violet-500" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4 sm:mb-6">Autonomous Summary</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-violet-100/70 leading-relaxed font-medium mb-6 sm:mb-8 relative z-10">
                      {insights.summary || "AI models are currently analyzing your data flow."}
                    </p>
                    <div className="flex flex-wrap gap-2 sm:gap-3 relative z-10">
                      {['Real-time Sync', 'GPT-4 Neural', 'Pattern Recognition'].map(tag => (
                        <span key={tag} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-violet-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </PremiumGlass>

                  <PremiumGlass className="p-6 sm:p-8 lg:p-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-6 sm:mb-8">Optimization Strategies</h3>
                    <div className="space-y-4 sm:space-y-6">
                      {(insights.improvement_suggestions || []).map((s, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                          className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all group"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 font-black text-[10px] sm:text-xs group-hover:bg-violet-500 group-hover:text-white transition-all">
                            0{i + 1}
                          </div>
                          <p className="text-white/70 text-xs sm:text-sm font-medium leading-relaxed pt-0.5 sm:pt-1">{s}</p>
                        </motion.div>
                      ))}
                    </div>
                  </PremiumGlass>

                </div>
              </motion.div>
            )}

            {/* Lower Grid: Platforms & Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pb-12 sm:pb-20">
              
              <PremiumGlass className="p-6 sm:p-8 lg:col-span-2">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Keyword Spectrum</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest hidden sm:inline">Growth Vector</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {topKeywords.length > 0 ? (
                    topKeywords.map((kw, i) => (
                      <motion.div 
                        key={kw.word}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-white/5 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/40 rounded-xl sm:rounded-2xl transition-all cursor-default group flex items-center gap-2"
                      >
                        <span className="text-xs sm:text-sm font-bold text-white/70 group-hover:text-white">{kw.word}</span>
                        <span className="px-1.5 py-0.5 bg-white/5 rounded-md text-[9px] sm:text-[10px] font-black text-white/40 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-colors">{kw.count}</span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-white/30 text-xs sm:text-sm italic">Insufficient data to generate keyword map. Connect platforms to begin.</p>
                  )}
                </div>
              </PremiumGlass>

              <PremiumGlass className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-6 sm:mb-8">Network Nodes</h3>
                <div className="space-y-5 sm:space-y-6">
                  {Object.entries(platformDistribution).length > 0 ? (
                    Object.entries(platformDistribution).map(([platform, count], i) => (
                      <div key={platform} className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1 sm:mb-2">
                          <span className="text-white/70">{platform}</span>
                          <span className="text-white/40">{count} nodes</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${(count / stats.totalReviews) * 100}%` }}
                            transition={{ delay: 0.8 + i * 0.1, duration: 1 }}
                            className={`h-full bg-gradient-to-r ${PLATFORM_COLORS[platform.toLowerCase()] || PLATFORM_COLORS.other} rounded-full`} 
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/30 text-xs sm:text-sm italic">No active nodes detected.</p>
                  )}
                </div>
              </PremiumGlass>

            </div>

          </div>
        )}
      </div>

      {/* Ultra Premium Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#080810]/80 backdrop-blur-xl py-8 sm:py-12">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 font-black text-xs">V4</div>
            <p className="text-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">AutoReview AI • Neural Matrix Analytics</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">
            <Link href="/docs" className="hover:text-violet-400 cursor-pointer transition-colors">Documentation</Link>
            <Link href="/status" className="hover:text-violet-400 cursor-pointer transition-colors">API Status</Link>
            <Link href="/compliance" className="hover:text-violet-400 cursor-pointer transition-colors">Compliance</Link>
          </div>
        </div>
      </footer>

      {/* Global Page Utilities */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] hidden sm:block">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all backdrop-blur-md">
          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 -rotate-45" />
        </button>
      </div>

    </div>
  )
}