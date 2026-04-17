'use client'

import { motion } from 'framer-motion'
import { Plus, Bot, Search, X, Star, MessageSquare } from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { AnalyticsData } from './types'
import { PlatformIcon } from './DashboardCharts'

interface ReviewsTabProps {
  data: AnalyticsData | null
  loading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  router: AppRouterInstance
  setShowAIGenerator: (show: boolean) => void
}

export default function ReviewsTab({
  data,
  loading,
  searchQuery,
  setSearchQuery,
  router,
  setShowAIGenerator
}: ReviewsTabProps) {
  // Ultra-fast Local Search Filter
  const filteredReviews = data?.recentReviews?.filter(r => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const author = (r.reviewer_name || r.author_name || '').toLowerCase()
    const text = (r.review_text || r.content || '').toLowerCase()
    const platform = (r.platform || '').toLowerCase()
    return author.includes(query) || text.includes(query) || platform.includes(query)
  }) || []

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-2 sm:pt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">All Reviews</h2>
          <p className="text-xs sm:text-sm text-gray-500">Manage, search, and respond to your customer reviews</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => router.push('/reviews/add')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-violet-600/20">
            <Plus className="h-4 w-4" />
            <span>Add Review</span>
          </button>
          <button onClick={() => setShowAIGenerator(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98] border border-white/10">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Mock Data</span>
          </button>
        </div>
      </div>

      {/* ─── REAL TIME SEARCH TOOL ─── */}
      <div className="relative w-full group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
        </div>
        <input
          type="text"
          className="w-full bg-[#0c0c18] border border-white/10 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-gray-600 shadow-inner"
          placeholder="Search reviews by name, content, or platform in real-time..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <X className="h-4 w-4 text-gray-500 hover:text-white transition-colors" />
          </button>
        )}
      </div>

      {/* Reviews Content */}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 sm:h-40 animate-pulse rounded-2xl bg-white/5 border border-white/5" />)}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="space-y-3">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="rounded-2xl border border-white/5 bg-[#0c0c18] p-4 sm:p-5 hover:border-white/10 hover:bg-white/[0.02] transition-all shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm sm:text-base font-bold text-white shadow-lg shadow-violet-500/20">
                    {(review.reviewer_name || review.author_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base sm:text-lg truncate">{review.reviewer_name || review.author_name || 'Anonymous'}</h4>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mt-0.5">
                      <PlatformIcon platform={review.platform} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="capitalize">{review.platform}</span>
                      <span>•</span>
                      <span>{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700/50'}`} />
                    ))}
                  </div>
                  {review.sentiment_label && (
                    <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      review.sentiment_label === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                      review.sentiment_label === 'negative' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {review.sentiment_label}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-5 p-3 sm:p-4 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-sm sm:text-[15px] text-gray-300 leading-relaxed whitespace-pre-wrap">{review.review_text || review.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border border-white/5 bg-gradient-to-b from-[#0c0c18] to-transparent p-8 sm:p-16 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 border border-violet-500/30">
            <MessageSquare className="h-10 w-10 text-violet-400" />
          </div>
          {searchQuery ? (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No results found</h3>
              <p className="text-gray-400 max-w-md mx-auto">We couldn't find any reviews matching "{searchQuery}". Try a different term or clear your search.</p>
              <button onClick={() => setSearchQuery('')} className="mt-6 text-violet-400 hover:text-violet-300 font-medium">Clear search</button>
            </>
          ) : (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Your Inbox is Empty</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
                No API keys yet? No problem. You can test the entire platform right now by manually adding a real text review without generating fake data.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => router.push('/reviews/add')} className="w-full sm:w-auto rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 hover:scale-105 active:scale-[0.98]">
                  Add Manual Review 
                </button>
                <button onClick={() => setShowAIGenerator(true)} className="w-full sm:w-auto rounded-xl bg-white/5 border border-white/10 px-8 py-3.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all active:scale-[0.98]">
                  Load Fake Reviews
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}
