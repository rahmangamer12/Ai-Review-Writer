'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  MessageSquare, Star, CheckCircle, Clock, AlertCircle,
  Plus, RefreshCw, X, Bot, Wand2, Send, ChevronDown, LayoutDashboard, BarChart3, Globe, FileText
} from 'lucide-react'

import { AnalyticsData, AIInsight, getEmptyData } from '@/components/dashboard/types'

// Lazy load heavy tab components
const OverviewTab = dynamic(() => import('@/components/dashboard/OverviewTab'), {
  loading: () => <div className="h-96 animate-pulse rounded-xl bg-white/5" />
})
const ReviewsTab = dynamic(() => import('@/components/dashboard/ReviewsTab'), {
  loading: () => <div className="h-96 animate-pulse rounded-xl bg-white/5" />
})
const AnalyticsTab = dynamic(() => import('@/components/dashboard/AnalyticsTab'), {
  loading: () => <div className="h-96 animate-pulse rounded-xl bg-white/5" />
})

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
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast, success: toastSuccess, info: toastInfo } = useToast()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

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

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchAnalytics = async (signal?: AbortSignal) => {
    if (!userId) return
    
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
        cache: 'no-store'
      }).catch((err) => {
        console.warn('Analytics fetch caught error:', err)
        return null
      })

      if (!response) {
        const emptyData = getEmptyData()
        setData(emptyData)
        generateAIInsights(emptyData)
        return
      }

      const contentType = response?.headers?.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        console.warn('Analytics API returned non-JSON response, using empty data')
        const emptyData = getEmptyData()
        setData(emptyData)
        generateAIInsights(emptyData)
        return
      }

      const analyticsData = await response.json()

      if (response.status === 401) {
        const emptyData = getEmptyData()
        setData(emptyData)
        generateAIInsights(emptyData)
        return
      }

      if (!response?.ok) {
        throw new Error(analyticsData.error || `Failed to fetch analytics (Status: ${response.status})`)
      }

      setData(analyticsData)
      generateAIInsights(analyticsData)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('Dashboard fetch error (caught):', err)
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
        toastSuccess(`Processed ${result.processed} reviews`, 'Agentic AI has replied to pending reviews.')
        if (result.results) {
          setAgenticReviews(prev => [...result.results, ...prev].slice(0, 50))
        }
        fetchAnalytics()
      } else {
        toastInfo('No reviews processed', 'There were no pending reviews that required attention.')
      }
    } catch (err) {
      setError('Agentic review failed')
    } finally {
      setAgenticProcessing(false)
    }
  }

  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    setShowExportModal(false)
    toastInfo(`${format.toUpperCase()} export coming soon`, 'This feature is currently being implemented.')
  }

  const stats = data?.stats || {
    totalReviews: 0, pendingReviews: 0, repliedReviews: 0, rejectedReviews: 0,
    avgRating: 0, responseRate: 0, totalReplies: 0, aiGeneratedReplies: 0, editedReplies: 0,
  }

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0f] flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0f] text-white overflow-x-hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 text-white px-4 py-2 text-center text-sm font-medium">
          You are currently offline. Some features may not work properly.
        </div>
        <div className="pt-10">
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

      {/* Mobile Tabs */}
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

      <main className="relative z-10 w-full px-0 md:px-6 lg:px-8 min-w-0">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400" />
                <p className="text-rose-400">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-rose-400" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 md:px-0">
          {activeTab === 'overview' && (
            <OverviewTab 
              data={data} 
              loading={loading} 
              stats={stats} 
              router={router} 
              setActiveTab={setActiveTab} 
              setShowAIGenerator={setShowAIGenerator} 
              runAgenticReview={runAgenticReview} 
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab 
              data={data} 
              loading={loading} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              router={router} 
              setShowAIGenerator={setShowAIGenerator} 
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab 
              data={data} 
              loading={loading} 
              stats={stats} 
              timeRange={timeRange} 
              setTimeRange={setTimeRange} 
              refreshing={refreshing} 
              fetchAnalytics={fetchAnalytics} 
              showAIInsightsPanel={showAIInsightsPanel} 
              setShowAIInsightsPanel={setShowAIInsightsPanel} 
              setShowExportModal={setShowExportModal} 
              aiInsights={aiInsights} 
              router={router}
            />
          )}
        </div>
      </main>

      {/* Dropdown Backdrop */}
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

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Download(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
