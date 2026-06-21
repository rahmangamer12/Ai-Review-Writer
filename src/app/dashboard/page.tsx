'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  MessageSquare, Star, CheckCircle, Clock, AlertCircle,
  Plus, RefreshCw, X, Bot, Wand2, Send, ChevronDown, LayoutDashboard, BarChart3, FileText, Download
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
  const [agenticReviews, setAgenticReviews] = useState<GeneratedReview[]>([])
  const [agenticProcessing, setAgenticProcessing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [showAIInsightsPanel, setShowAIInsightsPanel] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast, success: toastSuccess, info: toastInfo, error: toastError } = useToast()

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

  const runAgenticReview = async () => {
    if (agenticProcessing) return
    setAgenticProcessing(true)
    try {
      const response = await fetch('/api/agentic/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApprove: false }),
      })
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

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/reviews/analyze', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Could not update review')
      }

      toastSuccess('Review updated', `Review marked as ${status}.`)
      await fetchAnalytics()
    } catch (err) {
      toastError('Update failed', err instanceof Error ? err.message : 'Please try again.')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review?')) return

    try {
      const response = await fetch(`/api/reviews/analyze?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Could not delete review')
      }

      toastSuccess('Review deleted', 'The review was removed from your workspace.')
      await fetchAnalytics()
    } catch (err) {
      toastError('Delete failed', err instanceof Error ? err.message : 'Please try again.')
    }
  }

  const editReviewReply = async (reviewId: string, currentReply: string) => {
    const replyText = window.prompt('Edit saved reply:', currentReply)
    if (replyText === null) return

    try {
      const response = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          replyText: replyText.trim(),
          aiGenerated: false,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Could not save reply')
      }

      toastSuccess('Reply saved', 'The review reply was updated.')
      await fetchAnalytics()
    } catch (err) {
      toastError('Save failed', err instanceof Error ? err.message : 'Please try again.')
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
      <div className="min-h-[100dvh] bg-[#030308] flex items-center justify-center overflow-x-hidden w-full">
        <div className="text-center px-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden w-full">
        <div className="fixed top-0 inset-x-0 z-50 bg-yellow-600/90 text-white px-4 py-2 text-center text-sm font-medium">
          You are currently offline. Some features may not work properly.
        </div>
        <div className="pt-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Dashboard (Offline Mode)</h1>
            <p className="text-gray-400 break-words">Your data will sync when you're back online.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] text-white overflow-x-hidden w-full">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[#030308]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-violet-950/25 to-transparent" />
      </div>

      {/* Mobile Tabs */}
      <div className="sticky top-[57px] lg:top-0 z-40 border-b border-white/5 bg-[#030308]/80 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-w-0">
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

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 min-w-0">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 min-w-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                <p className="text-rose-400 break-words min-w-0">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto shrink-0"><X className="h-4 w-4 text-rose-400" /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab 
              data={data} 
              loading={loading} 
              stats={stats} 
              router={router} 
              setActiveTab={setActiveTab} 
               
              runAgenticReview={runAgenticReview} 
              agenticProcessing={agenticProcessing}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab 
              data={data} 
              loading={loading} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              router={router} 
              onDeleteReview={deleteReview}
              onUpdateStatus={updateReviewStatus}
              onEditReply={editReviewReply}
               
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
              <div className="mb-6 flex items-center justify-between gap-3 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 min-w-0">
                  <Download className="h-6 w-6 text-purple-400 shrink-0" />
                  <span className="truncate">Export Analytics</span>
                </h3>
                <button onClick={() => setShowExportModal(false)} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">Choose your preferred export format:</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all min-w-0"
                >
                  <div className="shrink-0 rounded-lg bg-emerald-500/20 p-2">
                    <FileText className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">Export as CSV</p>
                    <p className="text-sm text-gray-500 truncate">Spreadsheet format for Excel</p>
                  </div>
                </button>

                <button
                  onClick={() => exportData('json')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all min-w-0"
                >
                  <div className="shrink-0 rounded-lg bg-blue-500/20 p-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">Export as JSON</p>
                    <p className="text-sm text-gray-500 truncate">Raw data format for developers</p>
                  </div>
                </button>

                <button
                  onClick={() => exportData('pdf')}
                  className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition-all min-w-0"
                >
                  <div className="shrink-0 rounded-lg bg-rose-500/20 p-2">
                    <FileText className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">Export as PDF</p>
                    <p className="text-sm text-gray-500 truncate">Formatted report for sharing</p>
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

