'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Star, Search, Filter, Plus, ArrowLeft, 
  CheckCircle, XCircle, Clock, Sparkles, Trash2, Edit3,
  ChevronLeft, ChevronRight, RefreshCw, Send, X, ThumbsUp,
  ThumbsDown, AlertCircle, Bot, Wand2, Brain, Play, Pause,
  CheckCircle2, Settings2, MoreVertical, LayoutGrid, List,
  TrendingUp, Zap, Globe, Facebook, MapPin, Instagram,
  BarChart3, PieChart, Activity, FilterX, Download, Upload,
  Copy, Check, FileText, Lightbulb, Target, Crown, Users
} from 'lucide-react'

interface Review {
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
  updated_at: string
  reply?: {
    id: string
    reply_text?: string
    content?: string
    ai_generated?: boolean
    is_edited_by_human?: boolean
  } | null
}

interface ReviewFilters {
  status: 'all' | 'pending' | 'approved' | 'rejected'
  platform: string
  sentiment: 'all' | 'positive' | 'negative' | 'neutral'
  search: string
  sortBy: 'created_at' | 'rating' | 'updated_at'
  sortOrder: 'desc' | 'asc'
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

// Platform icon component
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

// Platform colors
const platformColors: Record<string, string> = {
  google: 'bg-blue-500/20 text-blue-400',
  facebook: 'bg-indigo-500/20 text-indigo-400',
  yelp: 'bg-red-500/20 text-red-400',
  tripadvisor: 'bg-emerald-500/20 text-emerald-400',
  trustpilot: 'bg-green-500/20 text-green-400',
  instagram: 'bg-pink-500/20 text-pink-400',
  manual: 'bg-gray-500/20 text-gray-400',
}

const sentimentConfig = {
  positive: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Positive', icon: ThumbsUp },
  negative: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'Negative', icon: ThumbsDown },
  neutral: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Neutral', icon: Activity },
}

function ReviewsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading reviews...</p>
      </div>
    </div>
  )
}

function ReviewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId } = useAuth()
  const { user } = useUser()

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [generatingReply, setGeneratingReply] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // AI Generator State
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiConfig, setAiConfig] = useState({
    count: 5,
    platform: 'google',
    ratingRange: 'mixed',
    businessType: 'restaurant',
  })
  const [generatingReviews, setGeneratingReviews] = useState(false)
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReview[]>([])
  
  // Agentic State
  const [agenticMode, setAgenticMode] = useState(false)
  const [agenticProcessing, setAgenticProcessing] = useState(false)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  
  // AI Insights
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  
  // Filters
  const [filters, setFilters] = useState<ReviewFilters>({
    status: (searchParams?.get('status') as any) || 'all',
    platform: 'all',
    sentiment: 'all',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchReviews = useCallback(async (page = currentPage) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', itemsPerPage.toString())
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)

      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.platform !== 'all') params.append('platform', filters.platform)
      if (filters.sentiment !== 'all') params.append('sentiment', filters.sentiment)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/reviews/list?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews')
      }

      setReviews(data.reviews || [])
      setPlatforms(data.platforms || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
      setCurrentPage(data.currentPage || page)
    } catch (err: unknown) {
      console.error('Reviews fetch error:', err)
      // Provide user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Please check your connection and environment variables.'
      setError('Unable to load reviews data. ' + errorMessage)

      // Set empty data to prevent UI breaking
      setReviews([])
      setPlatforms([])
      setTotalPages(1)
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [userId, filters, currentPage, itemsPerPage])

  useEffect(() => {
    if (userId) {
      fetchReviews()
    }
  }, [userId, filters.status, filters.platform, filters.sentiment, filters.sortBy, filters.sortOrder])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId) fetchReviews(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [filters.search])

  // Generate AI Reviews
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
      console.error('AI Review Generation Error:', err)
      setError('Failed to generate reviews. Please check your AI API configuration and try again.')
      setGeneratedReviews([])
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
      fetchReviews()
    } catch (err) {
      setError('Failed to save generated reviews')
    }
  }

  // Run Agentic Review
  const runAgenticReview = async () => {
    if (agenticProcessing) return
    
    setAgenticProcessing(true)
    setError(null)
    
    try {
      console.log('[Agentic] Starting agentic review process...')
      
      const response = await fetch('/api/agentic/reviews', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      console.log('[Agentic] Response:', result)
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to run agentic review')
      }
      
      if (result.processed > 0) {
        // Show success message
        alert(`Agentic AI processed ${result.processed} reviews successfully!`)
        fetchReviews()
      } else {
        alert(result.message || 'No pending reviews to process')
      }
    } catch (err: unknown) {
      console.error('[Agentic] Error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Agentic review failed'
      setError(errorMessage)
    } finally {
      setAgenticProcessing(false)
    }
  }

  // Generate AI Insights
  const generateAIInsights = async () => {
    try {
      const response = await fetch('/api/reviews/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews })
      })
      
      if (!response.ok) throw new Error('Failed to generate insights')
      
      const data = await response.json()
      setAiInsights(data)
      setShowAIInsights(true)
    } catch (err) {
      console.error('AI Insights Error:', err)
      setError('Failed to generate insights. Please ensure you have reviews to analyze.')
    }
  }

  const generateAIReply = async (review: Review) => {
    setGeneratingReply(review.id)
    setSelectedReview(review)
    
    try {
      const response = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          reviewText: review.review_text || review.content,
          rating: review.rating,
          platform: review.platform,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to generate reply')
      
      const data = await response.json()
      setReplyText(data.reply)
      setShowReplyModal(true)
    } catch (err) {
      console.error('AI Reply Generation Error:', err)
      setError('Failed to generate reply. Please check your AI API configuration and try again.')
    } finally {
      setGeneratingReply(null)
    }
  }

  const saveReply = async () => {
    if (!selectedReview || !replyText.trim()) return
    
    try {
      await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: selectedReview.id,
          replyText: replyText.trim(),
          aiGenerated: true,
        }),
      })
      
      setShowReplyModal(false)
      setReplyText('')
      setSelectedReview(null)
      fetchReviews()
    } catch (err) {
      setError('Failed to save reply')
    }
  }

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/reviews/analyze', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status }),
      })
      fetchReviews()
    } catch (err) {
      setError('Failed to update review status')
    }
  }

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    
    try {
      await fetch(`/api/reviews/analyze?id=${reviewId}`, { method: 'DELETE' })
      fetchReviews()
    } catch (err) {
      setError('Failed to delete review')
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, color: 'bg-amber-500/20 text-amber-400', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'bg-emerald-500/20 text-emerald-400', label: 'Approved' },
      rejected: { icon: XCircle, color: 'bg-rose-500/20 text-rose-400', label: 'Rejected' },
    }
    const config = configs[status as keyof typeof configs]
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    )
  }

  if (!mounted) {
    // Render a simple loading state during hydration to prevent mismatches
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-[57px] lg:top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-white truncate">Reviews Management</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{totalCount} total reviews</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" suppressHydrationWarning>
              {/* Agentic Mode Toggle - Mobile icon only */}
              <button
                onClick={() => setAgenticMode(!agenticMode)}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
                  agenticMode 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                    : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
                }`}
                title="Agentic Mode"
                suppressHydrationWarning
              >
                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Agentic</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="hidden sm:flex rounded-lg border border-white/10 bg-white/5 p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors"
                title="Toggle View"
                suppressHydrationWarning
              >
                {viewMode === 'list' ? <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" /> : <List className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>

              <button
                onClick={() => fetchReviews(currentPage)}
                disabled={loading}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh"
                suppressHydrationWarning
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowAIGenerator(true)}
                className="hidden lg:flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-sm font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
                suppressHydrationWarning
              >
                <Bot className="h-4 w-4" />
                AI Generator
              </button>

              <button
                onClick={() => router.push('/reviews/add')}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-purple-600 px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-purple-500 transition-colors"
                suppressHydrationWarning
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add Review</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 min-w-0">
        {/* Agentic Mode Banner */}
        {agenticMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">Agentic Mode Active</p>
                  <p className="text-xs text-emerald-400/70">AI auto-generates replies and processes reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={autoReplyEnabled}
                    onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 h-4 w-4"
                  />
                  Auto-approve
                </label>
                <button
                  onClick={runAgenticReview}
                  disabled={agenticProcessing}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {agenticProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Run Agent
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Processing Status */}
            {agenticProcessing && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400">AI is processing reviews...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* AI Insights Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-purple-400">AI Insights Available</p>
                <p className="text-xs text-purple-400/70">Get AI-powered analysis of your reviews</p>
              </div>
            </div>
            <button
              onClick={generateAIInsights}
              className="flex items-center gap-2 rounded-lg bg-purple-600/20 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Generate Insights
            </button>
          </div>
        </motion.div>

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
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="h-4 w-4 text-rose-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search reviews..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                showFilters ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-white/10 bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-')
                setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any })
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="rating-asc">Lowest Rated</option>
            </select>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-3 overflow-hidden"
              >
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={filters.platform}
                  onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Platforms</option>
                  {platforms.map((p) => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                  ))}
                </select>

                <select
                  value={filters.sentiment}
                  onChange={(e) => setFilters({ ...filters, sentiment: e.target.value as any })}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>

                <button
                  onClick={() => setFilters({
                    status: 'all', platform: 'all', sentiment: 'all', search: '',
                    sortBy: 'created_at', sortOrder: 'desc',
                  })}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <FilterX className="h-4 w-4" />
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reviews List */}
        {loading && reviews.length === 0 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-white/[0.05] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <MessageSquare className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">No Reviews Found</h3>
              <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
                {filters.search || filters.status !== 'all' || filters.platform !== 'all'
                  ? "We couldn't find any reviews matching your current filters. Try adjusting them to see more results."
                  : "You haven't collected any reviews yet. Connect a platform or generate test data to get started."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {!(filters.search || filters.status !== 'all' || filters.platform !== 'all') && (
                  <>
                    <button
                      onClick={() => setShowAIGenerator(true)}
                      className="group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] block w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative flex items-center justify-center gap-2">
                        <Bot className="w-5 h-5" /> AI Generator
                      </span>
                    </button>
                    <button
                      onClick={() => router.push('/connect-platforms')}
                      className="group rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 block w-full sm:w-auto"
                    >
                      <span className="flex items-center justify-center gap-2 text-gray-300 group-hover:text-white">
                        <Globe className="w-5 h-5 text-blue-400" /> Connect Platforms
                      </span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => router.push('/reviews/add')}
                  className={`group rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20 block w-full sm:w-auto ${(filters.search || filters.status !== 'all' || filters.platform !== 'all') ? '' : 'sm:ml-2'}`}
                >
                  <span className="flex items-center justify-center gap-2 text-gray-300 group-hover:text-white">
                    <Plus className="w-5 h-5 text-emerald-400" /> Add Manually
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5' : 'space-y-4'}>
              <AnimatePresence mode="popLayout">
                {reviews.map((review, index) => {
                  const authorName = review.reviewer_name || review.author_name || 'Anonymous'
                  const reviewText = review.review_text || review.content || ''
                  const sentiment = review.sentiment_label ? sentimentConfig[review.sentiment_label] : null
                  const platformColor = platformColors[review.platform] || 'bg-gray-500/20 text-gray-400'
                  
                  return (
                    <motion.div
                      key={review.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/20 hover:bg-white/[0.04]"
                    >
                      <div className={`absolute left-0 top-0 h-full w-1 ${
                        review.status === 'approved' ? 'bg-emerald-500' : 
                        review.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />

                      <div className="pl-4">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm sm:text-base font-bold">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-white text-sm sm:text-base truncate">{authorName}</h4>
                                <span className={`rounded-full px-2 py-0.5 text-xs sm:text-sm ${platformColor}`}>
                                  <span className="flex items-center gap-1">
                                    <PlatformIcon platform={review.platform} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    {review.platform}
                                  </span>
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              {sentiment && (
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium ${sentiment.color}`}>
                                  <sentiment.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  {sentiment.label}
                                </span>
                              )}
                              {getStatusBadge(review.status)}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm sm:text-base leading-relaxed text-gray-300 mb-4 line-clamp-3 sm:line-clamp-4">{reviewText}</p>

                        {review.reply ? (
                          <div className="mb-4 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                              <span className="text-xs font-medium text-purple-400">AI Reply</span>
                              {review.reply.ai_generated && (
                                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">AI</span>
                              )}
                              {review.reply.is_edited_by_human && (
                                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">Edited</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-2">{review.reply.reply_text || review.reply.content}</p>
                          </div>
                        ) : null}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {review.status === 'pending' && !review.reply && (
                              <button
                                onClick={() => generateAIReply(review)}
                                disabled={generatingReply === review.id}
                                className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 px-3 py-2 text-xs sm:text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/30 disabled:opacity-50 touch-target"
                              >
                                {generatingReply === review.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                {generatingReply === review.id ? 'Generating...' : 'Generate Reply'}
                              </button>
                            )}

                            {review.status === 'pending' && review.reply && (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => updateReviewStatus(review.id, 'approved')}
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 touch-target"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateReviewStatus(review.id, 'rejected')}
                                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-2 text-xs sm:text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/30 touch-target"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedReview(review)
                                setReplyText(review.reply?.reply_text || review.reply?.content || '')
                                setShowReplyModal(true)
                              }}
                              className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors touch-target"
                              title="Edit Reply"
                            >
                              <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="rounded-lg p-2 text-gray-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors touch-target"
                              title="Delete Review"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} reviews
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1)
                      setCurrentPage(newPage)
                      fetchReviews(newPage)
                    }}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => {
                      const newPage = Math.min(totalPages, currentPage + 1)
                      setCurrentPage(newPage)
                      fetchReviews(newPage)
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f14] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  {selectedReview.reply ? 'Edit Reply' : 'Generate AI Reply'}
                </h3>
                <button onClick={() => setShowReplyModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-gray-500 mb-2">Original Review</p>
                <p className="text-sm text-gray-300">{selectedReview.review_text || selectedReview.content}</p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none mb-6"
                placeholder="Type your reply..."
              />

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowReplyModal(false)} className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={() => generateAIReply(selectedReview)}
                  disabled={generatingReply === selectedReview.id}
                  className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-6 py-2.5 text-sm font-medium text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
                >
                  {generatingReply === selectedReview.id ? <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 inline h-4 w-4" />}
                  Regenerate
                </button>
                <button
                  onClick={saveReply}
                  disabled={!replyText.trim()}
                  className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  <Send className="mr-2 inline h-4 w-4" />
                  Save Reply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generator Modal */}
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
              className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0f0f14] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
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
                            <span className={`text-xs ${review.sentiment_label === 'positive' ? 'text-emerald-400' : review.sentiment_label === 'negative' ? 'text-rose-400' : 'text-amber-400'}`}>
                              {review.sentiment_label}
                            </span>
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

      {/* AI Insights Modal */}
      <AnimatePresence>
        {showAIInsights && aiInsights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowAIInsights(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-purple-500/20 bg-[#0f0f14] p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-purple-400" />
                  AI Insights
                </h3>
                <button onClick={() => setShowAIInsights(false)} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h4 className="font-medium text-white">Top Sentiment</h4>
                  </div>
                  <p className="text-emerald-400 capitalize">{aiInsights.topSentiment}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <h4 className="font-medium text-white">Average Response Time</h4>
                  </div>
                  <p className="text-blue-400">{aiInsights.avgResponseTime}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-amber-400" />
                    <h4 className="font-medium text-white">Areas for Improvement</h4>
                  </div>
                  <ul className="space-y-1">
                    {aiInsights.improvementAreas.map((area: string, i: number) => (
                      <li key={i} className="text-amber-400 text-sm flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">AI Recommendations</h4>
                  </div>
                  <ul className="space-y-1">
                    {aiInsights.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-purple-400 text-sm flex items-center gap-2">
                        <Check className="h-3 w-3" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsContent />
    </Suspense>
  )
}
