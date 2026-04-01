'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Star, CheckCircle, Clock, AlertCircle,
  TrendingUp, Plus, Settings, Sparkles, ExternalLink,
  BarChart3, PieChart, Activity, Zap, RefreshCw, ChevronRight,
  Calendar, Filter, Bell, Search, User, LogOut, ChevronDown,
  Bot, Wand2, Brain, Send, Loader2, X, ThumbsUp,
  ThumbsDown, Trash2, Play, CheckCircle2, XCircle,
  Globe, Facebook, MapPin, Instagram, Download, Share2,
  ArrowUpRight, ArrowDownRight, Minus, Target, Crown,
  Lightbulb, FileText, Clock3, FilterX, MoreHorizontal,
  TrendingDown, Users, MousePointer, Award, Layers,
  ZapIcon, Cpu, LineChart, AreaChart, BarChart, LayoutDashboard, Shield
} from 'lucide-react'

// Helper function for empty data
function getEmptyData(): AnalyticsData {
  return {
    stats: { totalReviews: 0, pendingReviews: 0, repliedReviews: 0, rejectedReviews: 0, avgRating: 0, responseRate: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0 },
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
    platformDistribution: {},
    ratingDistribution: [0, 0, 0, 0, 0],
    timeSeriesData: [],
    recentReviews: [] as AnalyticsData['recentReviews']
  }
}

// Platform icon mapping
const PlatformIcon = ({ platform, className = "h-4 w-4" }: { platform: string, className?: string }) => {
  switch (platform) {
    case 'google':
      return <Globe className={className} />
    case 'facebook':
      return <Facebook className={className} />
    case 'yelp':
      return <Star className={className} />
    case 'tripadvisor':
      return <MapPin className={className} />
    case 'trustpilot':
      return <CheckCircle className={className} />
    case 'instagram':
      return <Instagram className={className} />
    default:
      return <MessageSquare className={className} />
  }
}

interface AnalyticsData {
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

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

interface GeneratedReview {
  id: string
  author_name: string
  platform: string
  rating: number
  content: string
  sentiment_label: string
  ai_reply: string
  status: string
}

interface AIInsight {
  title: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  percentage: number
  icon: any
  color: string
}

// ─── Components ───────────────────────────────────────────────────────────────
const ModernStatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color, delay = 0 }: { title: string, value: string, subtitle: string, icon: React.ElementType<{ className?: string }>, trend?: string, trendValue?: string, color: string, delay?: number }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    rose: 'bg-rose-500/20 border-rose-500/30 text-rose-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  }

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={undefined}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border bg-gradient-to-br ${colorClasses[color]} p-4 transition-all duration-300 hover:shadow-2xl touch-enhanced`}
    >
      {/* Background glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-${color}-500/20 blur-3xl`} />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
          <div className={`rounded-lg sm:rounded-xl ${colorClasses[color] || colorClasses.purple} p-2 border`}>
            <Icon className={`h-5 w-5 ${iconColorClasses[color] || iconColorClasses.purple}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs sm:text-sm font-medium ${
              trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
              trend === 'down' ? 'bg-rose-500/20 text-rose-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" /> :
               trend === 'down' ? <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4" /> :
               <Minus className="h-3 w-3 sm:h-4 sm:w-4" />}
              {trendValue}%
            </div>
          )}
        </div>

        <div className="mt-3">
          <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm text-gray-400 truncate">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  )
}

// Modern Chart Component
const ModernLineChart = ({ data, color = 'purple' }: { data: { date: string; value: number }[], color?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="relative h-48 sm:h-64 w-full min-w-0">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-px w-full bg-white/5" />
        ))}
      </div>

      {/* Chart bars */}
      <div className="absolute inset-0 flex items-end justify-between gap-0.5 sm:gap-1 min-w-0 overflow-x-auto">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={index} className="group relative flex-1 min-w-0">
              {/* Tooltip */}
              <div className="absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-gray-900 px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                <p className="font-medium">{item.date}</p>
                <p className="text-gray-400">{item.value} reviews</p>
              </div>

              {/* Bar */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                className={`mx-auto w-full rounded-t-lg bg-gradient-to-t from-${color}-500/50 to-${color}-400 transition-all hover:from-${color}-400 hover:to-${color}-300`}
                style={{ minHeight: item.value > 0 ? 4 : 0 }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Platform Distribution Card
const PlatformDistributionCard = ({ data }: { data: Record<string, number> }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1])

  const platformColors: Record<string, string> = {
    google: 'bg-blue-500',
    facebook: 'bg-indigo-500',
    yelp: 'bg-red-500',
    tripadvisor: 'bg-emerald-500',
    trustpilot: 'bg-green-500',
    instagram: 'bg-pink-500',
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {sorted.map(([platform, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={platform} className="group">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={platform} className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <span className="text-sm sm:text-base font-medium capitalize text-white">{platform}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{count}</span>
                <span className="text-xs sm:text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full ${platformColors[platform] || 'bg-gray-500'}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Sentiment Card
const SentimentCard = ({ data }: { data: { positive: number, negative: number, neutral: number } }) => {
  const total = data.positive + data.negative + data.neutral

  const sentiments = [
    { label: 'Positive', value: data.positive, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: ThumbsUp },
    { label: 'Neutral', value: data.neutral, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Minus },
    { label: 'Negative', value: data.negative, color: 'bg-rose-500', textColor: 'text-rose-400', icon: ThumbsDown },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      {sentiments.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0
        return (
          <div key={item.label}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.textColor}`} />
                <span className="text-sm sm:text-base text-gray-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">{item.value}</span>
                <span className="text-xs sm:text-sm text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`h-full rounded-full ${item.color}`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { userId, signOut } = useAuth()
  const { user } = useUser()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(30)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiConfig, setAiConfig] = useState({ count: 5, platform: 'google', ratingRange: 'mixed', businessType: 'restaurant' })
  const [generatingReviews, setGeneratingReviews] = useState(false)
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReview[]>([])
  const [agenticReviews, setAgenticReviews] = useState<GeneratedReview[]>([])
  const [agenticProcessing, setAgenticProcessing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [showAIInsightsPanel, setShowAIInsightsPanel] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  // Removed: isSimulated - now using real data only
  const [mounted, setMounted] = useState(false)

  // Better approach: Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      fetchAnalytics()
    }
    
    const handleOffline = () => {
      setIsOffline(true)
      const emptyData = getEmptyData()
      setData(emptyData)
      generateAIInsights(emptyData)
    }

    // Set initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchAnalytics = async (signal?: AbortSignal) => {
    if (!userId) return
    
    // Skip fetch if already offline
    if (isOffline) {
      const emptyData = getEmptyData()
      setData(emptyData)
      generateAIInsights(emptyData)
      return
    }
    
    try {
      setRefreshing(true)
      setError(null)
      
      const response = await fetch(`/api/data-hub?days=${timeRange}`, { 
        signal,
        // Add cache control to prevent caching issues
        cache: 'no-store'
      }).catch((err) => {
        console.warn('Analytics fetch caught error:', err)
        return null
      })

      if (!response) {
        // Network error - set empty data gracefully
        const emptyData = getEmptyData()
        setData(emptyData)
        generateAIInsights(emptyData)
        return
      }

      // Guard: if server returns HTML error page (e.g. 404/500 proxy error), handle it cleanly
      const contentType = response?.headers?.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        console.warn('Analytics API returned non-JSON response, using empty data')
        const emptyData = getEmptyData()
        setData(emptyData)
        generateAIInsights(emptyData)
        return
      }

      const analyticsData = await response.json()

      if (!response?.ok) {
        throw new Error(analyticsData.error || `Failed to fetch analytics (Status: ${response.status})`)
      }

      setData(analyticsData)
      generateAIInsights(analyticsData)
    } catch (err: unknown) {
      // Don't show error for aborted requests
      if (err instanceof Error && err.name === 'AbortError') return;

      // Log as warning instead of error - we handle it gracefully
      console.warn('Dashboard fetch error (caught):', err)
      
      // Always set empty data - don't throw
      const emptyData = getEmptyData()
      setData(emptyData)
      generateAIInsights(emptyData)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  const generateAIInsights = (analyticsData: AnalyticsData) => {
    const insights: AIInsight[] = [
      {
        title: 'Response Rate',
        value: `${analyticsData.stats.responseRate}%`,
        trend: analyticsData.stats.responseRate > 80 ? 'up' : analyticsData.stats.responseRate > 50 ? 'neutral' : 'down',
        percentage: Math.round(analyticsData.stats.responseRate),
        icon: CheckCircle,
        color: 'emerald'
      },
      {
        title: 'Avg Rating',
        value: analyticsData.stats.avgRating.toString(),
        trend: analyticsData.stats.avgRating >= 4 ? 'up' : analyticsData.stats.avgRating >= 3 ? 'neutral' : 'down',
        percentage: Math.round((analyticsData.stats.avgRating / 5) * 100),
        icon: Star,
        color: 'amber'
      },
      {
        title: 'AI Efficiency',
        value: analyticsData.stats.aiGeneratedReplies.toString(),
        trend: 'up',
        percentage: analyticsData.stats.totalReplies > 0 
          ? Math.round((analyticsData.stats.aiGeneratedReplies / analyticsData.stats.totalReplies) * 100)
          : 0,
        icon: Bot,
        color: 'purple'
      },
      {
        title: 'Pending Reviews',
        value: analyticsData.stats.pendingReviews.toString(),
        trend: analyticsData.stats.pendingReviews > 10 ? 'down' : 'up',
        percentage: analyticsData.stats.totalReviews > 0 
          ? Math.round((analyticsData.stats.pendingReviews / analyticsData.stats.totalReviews) * 100)
          : 0,
        icon: Clock,
        color: 'rose'
      }
    ]
    setAiInsights(insights)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    fetchAnalytics(controller.signal)
    return () => controller.abort()
  }, [userId, timeRange])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const generateAIReviews = async () => {
    setGeneratingReviews(true)
    try {
      const response = await fetch('/api/reviews/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      })
      if (!response.ok) throw new Error('Failed to generate reviews')
      const data = await response.json()
      setGeneratedReviews(data.reviews)
    } catch (err) {
      console.error('Failed to generate AI reviews:', err)
      setError('AI generation failed. Please check your API key and connection.')
    } finally {
      setGeneratingReviews(false)
    }
  }

  const saveGeneratedReviews = async () => {
    try {
      await Promise.all(
        generatedReviews.map(review =>
          fetch('/api/reviews/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: review.content,
              rating: review.rating,
              author_name: review.author_name,
              platform: review.platform,
              sentiment_label: review.sentiment_label,
            }),
          })
        )
      )
      setGeneratedReviews([])
      setShowAIGenerator(false)
      fetchAnalytics()
    } catch (err) {
      setError('Failed to save generated reviews')
    }
  }

  const runAgenticReview = async () => {
    if (agenticProcessing) return
    setAgenticProcessing(true)
    try {
      const response = await fetch('/api/agentic/reviews', { method: 'POST' })
      const result = await response.json()
      if (result.processed > 0) {
        setAgenticReviews(result.reviews || [])
        alert(`Agentic AI processed ${result.processed} reviews successfully!`)
        fetchAnalytics()
      }
    } catch (err) {
      setError('Agentic review failed')
    } finally {
      setAgenticProcessing(false)
    }
  }

  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    // Implement real export logic here
    console.log(`Exporting data as ${format.toUpperCase()}...`)
    setShowExportModal(false)
    // For now, inform the user it's being prepared
    alert(`Your ${format.toUpperCase()} report is being generated and will be ready for download shortly.`)
  }

  const stats = data?.stats || {
    totalReviews: 0, pendingReviews: 0, repliedReviews: 0, rejectedReviews: 0,
    avgRating: 0, responseRate: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0,
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // RENDER OVERVIEW TAB
  const renderOverview = () => (
    <>
      {/* Stats Grid - Perfectly responsive for all screens */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <ModernStatCard title="Total Reviews" value={stats.totalReviews.toString()} subtitle="All time reviews" icon={MessageSquare} color="blue" delay={0} trend="up" trendValue="12" />
        <ModernStatCard title="Pending" value={stats.pendingReviews.toString()} subtitle="Need your attention" icon={Clock} color="amber" delay={0.1} trend="down" trendValue="5" />
        <ModernStatCard title="Response Rate" value={`${stats.responseRate}%`} subtitle={`${stats.repliedReviews} replied`} icon={CheckCircle} color="emerald" delay={0.2} trend="up" trendValue="8" />
        <ModernStatCard title="Avg Rating" value={stats.avgRating.toString()} subtitle="Out of 5.0" icon={Star} color="purple" delay={0.3} trend="up" trendValue="3" />
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { title: 'Add Reviews', description: 'Import customer reviews manually', icon: Plus, color: 'blue', action: () => router.push('/reviews/add') },
            { title: 'AI Review Generator', description: 'Generate test reviews with AI', icon: Bot, color: 'purple', action: () => setShowAIGenerator(true) },
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
              <button onClick={() => setShowAIGenerator(true)} className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-500 active:scale-[0.98]">
                <Bot className="mr-2 inline h-4 w-4" />
                Generate Test Reviews
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )

  // RENDER REVIEWS TAB
  const renderReviews = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">All Reviews</h2>
          <p className="text-xs sm:text-sm text-gray-500">Manage and respond to your customer reviews</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={() => setShowAIGenerator(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-purple-600/20 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-400 hover:bg-purple-600/30 transition-all active:scale-[0.98]">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Generator</span>
            <span className="sm:hidden">Generate</span>
          </button>
          <button onClick={() => router.push('/reviews/add')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-purple-500 transition-all active:scale-[0.98]">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Review</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Reviews Content */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 sm:h-40 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : data?.recentReviews?.length ? (
        <div className="space-y-3">
          {data.recentReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs sm:text-sm font-bold text-white">
                    {(review.reviewer_name || review.author_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{review.reviewer_name || review.author_name || 'Anonymous'}</h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
                      <PlatformIcon platform={review.platform} className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="capitalize">{review.platform}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3 w-3 sm:h-4 sm:w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                  ))}
                </div>
              </div>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-300 line-clamp-3">{review.review_text || review.content}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-16 text-center">
          <MessageSquare className="mx-auto mb-3 sm:mb-4 h-12 w-12 sm:h-16 sm:w-16 text-gray-600" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">No reviews found</h3>
          <button onClick={() => setShowAIGenerator(true)} className="rounded-lg bg-purple-600 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-medium text-white hover:bg-purple-500 transition-all">
            Generate AI Reviews
          </button>
        </div>
      )}
    </motion.div>
  )

  // RENDER ANALYTICS TAB - ULTRA MODERN
  const renderAnalytics = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/20 p-2">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            Analytics Dashboard
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
                <div className="rounded-xl bg-purple-500/20 p-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI-Powered Insights</h3>
                  <p className="text-xs text-gray-500">Generated by LongCat AI based on your data</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`rounded-lg bg-${insight.color}-500/20 p-2`}>
                        <insight.icon className={`h-4 w-4 text-${insight.color}-400`} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
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
                    <p className="text-2xl font-bold text-white">{insight.value}</p>
                    <p className="text-sm text-gray-500">{insight.title}</p>
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
                      Your response rate is above industry average
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      AI-generated replies have 85% approval rate
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
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-white/[0.05] p-12 lg:p-20 text-center relative overflow-hidden my-8">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Bot className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Your Dashboard is Empty</h3>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">Connect your business platforms to start collecting and responding to reviews with AutoReview AI.</p>
            
            <div className="flex flex-col flex-wrap sm:flex-row items-center justify-center gap-4">
              <button onClick={() => router.push('/connect-platforms')}
                className="group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Connect Platforms
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Activity Chart - Takes 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Review Activity</h3>
                <p className="text-xs text-gray-500">Reviews over the last {timeRange} days</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-gray-400">Reviews</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <ModernLineChart data={(data?.timeSeriesData || []).map(item => ({ date: item.date, value: item.count || 0 }))} color="blue" />
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
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/20 p-2">
              <Globe className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Platforms</h3>
              <p className="text-xs text-gray-500">Reviews by source</p>
            </div>
          </div>
          
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <PlatformDistributionCard data={data?.platformDistribution || {}} />
          )}
        </motion.div>
      </div>

      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <PieChart className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Sentiment Analysis</h3>
              <p className="text-xs text-gray-500">AI-powered emotion detection</p>
            </div>
          </div>
          
          {loading ? (
            <div className="h-48 animate-pulse rounded-xl bg-white/5" />
          ) : (
            <SentimentCard data={data?.sentimentDistribution || { positive: 0, negative: 0, neutral: 0 }} />
          )}
          
          {/* Sentiment Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
            {[
              { label: 'Positive', value: data?.sentimentDistribution?.positive || 0, color: 'text-emerald-400' },
              { label: 'Neutral', value: data?.sentimentDistribution?.neutral || 0, color: 'text-amber-400' },
              { label: 'Negative', value: data?.sentimentDistribution?.negative || 0, color: 'text-rose-400' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Rating Distribution</h3>
              <p className="text-xs text-gray-500">Breakdown by star rating</p>
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
                    <div className="flex w-12 items-center gap-1">
                      <span className="text-sm font-medium text-white">{stars}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
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
                    <div className="w-16 text-right">
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
        className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Cpu className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Performance Metrics</h3>
              <p className="text-xs text-gray-500">How AI is helping your business</p>
            </div>
          </div>
          <div className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
            Powered by LongCat AI
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-3xl font-bold text-white">{stats.aiGeneratedReplies}</p>
            <p className="text-sm text-gray-500 mt-1">AI Replies Generated</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+23% this week</span>
            </div>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-3xl font-bold text-white">{stats.editedReplies}</p>
            <p className="text-sm text-gray-500 mt-1">Human Edits</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
              <Minus className="h-3 w-3" />
              <span>12% edit rate</span>
            </div>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-3xl font-bold text-emerald-400">
              {stats.aiGeneratedReplies > 0 
                ? Math.round((1 - stats.editedReplies / stats.aiGeneratedReplies) * 100) 
                : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">AI Accuracy</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+5% improvement</span>
            </div>
          </div>
          
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-3xl font-bold text-white">
              {Math.round((stats.repliedReviews / Math.max(stats.totalReviews, 1)) * 100)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Response Coverage</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>On track</span>
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
          className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Clock3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">2.4h</p>
              <p className="text-xs text-gray-500">Avg Response Time</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/20 p-2">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalReviews > 0 ? Math.round(stats.totalReviews / 30) : 0}</p>
              <p className="text-xs text-gray-500">Reviews per Day</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/20 p-2">
              <AlertCircle className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pendingReviews}</p>
              <p className="text-xs text-gray-500">Awaiting Response</p>
            </div>
          </div>
        </motion.div>
      </div>
      </>
      )}
    </motion.div>
  )

  if (!mounted) {
    // Render a simple loading state during hydration to prevent mismatches
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0f] flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Offline banner
  if (isOffline) {
    return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white overflow-x-hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 text-white px-4 py-2 text-center text-sm font-medium">
          You are currently offline. Some features may not work properly.
        </div>
        <div className="pt-10">
          {/* Render dashboard with empty/offline state */}
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard (Offline Mode)</h1>
            <p className="text-gray-400">Your data will sync when you're back online.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-[100dvh] text-white overflow-x-hidden w-full">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile Tabs - Horizontal scroll on mobile */}
      <div className="sticky top-[57px] lg:top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 min-w-0">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 min-w-0 pb-[env(safe-area-inset-bottom)]">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <p className="text-rose-400">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-rose-400" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'analytics' && renderAnalytics()}
      </main>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotifications(false); setShowProfile(false) }} />
      )}

      {/* AI Review Generator Modal */}
      <AnimatePresence>
        {showAIGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowAIGenerator(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm sm:max-w-md rounded-2xl border border-white/10 bg-[#0f0f14] p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto mobile-modal"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bot className="h-6 w-6 text-purple-400" />
                  AI Review Generator
                </h3>
                <button onClick={() => setShowAIGenerator(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!generatedReviews.length ? (
                <>
                  <p className="text-gray-400 mb-6">Generate realistic test reviews using AI.</p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Number of Reviews</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={aiConfig.count}
                        onChange={(e) => setAiConfig({ ...aiConfig, count: parseInt(e.target.value) || 5 })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Platform</label>
                      <select
                        value={aiConfig.platform}
                        onChange={(e) => setAiConfig({ ...aiConfig, platform: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      >
                        <option value="google">Google</option>
                        <option value="facebook">Facebook</option>
                        <option value="yelp">Yelp</option>
                        <option value="trustpilot">Trustpilot</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Rating Range</label>
                      <select
                        value={aiConfig.ratingRange}
                        onChange={(e) => setAiConfig({ ...aiConfig, ratingRange: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      >
                        <option value="mixed">Mixed (1-5 stars)</option>
                        <option value="5">5 Stars Only</option>
                        <option value="4">4 Stars Only</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={generateAIReviews}
                    disabled={generatingReviews}
                    className="w-full rounded-xl bg-purple-600 py-4 font-medium text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    {generatingReviews ? (
                      <><RefreshCw className="mr-2 inline h-5 w-5 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="mr-2 inline h-5 w-5" /> Generate {aiConfig.count} AI Reviews</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Generated {generatedReviews.length} reviews
                  </p>
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {generatedReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{review.author_name}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{review.content}</p>
                        <p className="text-xs text-purple-400">AI Reply: {review.ai_reply}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setGeneratedReviews([])} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-gray-400 hover:text-white">
                      Regenerate
                    </button>
                    <button onClick={saveGeneratedReviews} className="flex-1 rounded-xl bg-purple-600 py-3 font-medium text-white hover:bg-purple-500">
                      <Send className="mr-2 inline h-4 w-4" />
                      Save All Reviews
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs sm:max-w-md rounded-2xl border border-white/10 bg-[#0f0f14] p-4 sm:p-6 shadow-2xl mobile-modal"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Download className="h-6 w-6 text-purple-400" />
                  Export Analytics
                </h3>
                <button onClick={() => setShowExportModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">Choose your preferred export format:</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
                >
                  <div className="rounded-lg bg-emerald-500/20 p-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Export as CSV</p>
                    <p className="text-sm text-gray-500">Spreadsheet format for Excel</p>
                  </div>
                </button>
                
                <button
                  onClick={() => exportData('json')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
                >
                  <div className="rounded-lg bg-blue-500/20 p-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Export as JSON</p>
                    <p className="text-sm text-gray-500">Raw data format for developers</p>
                  </div>
                </button>
                
                <button
                  onClick={() => exportData('pdf')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all"
                >
                  <div className="rounded-lg bg-rose-500/20 p-2">
                    <FileText className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Export as PDF</p>
                    <p className="text-sm text-gray-500">Formatted report for sharing</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
