'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { 
  MessageSquare, Star, CheckCircle, Plus, Settings, 
  Puzzle, Sparkles, TrendingUp, Clock, ExternalLink 
} from 'lucide-react'

interface Review {
  id: string
  author: string
  rating: number
  text: string
  platform: string
  sentiment: 'positive' | 'negative' | 'neutral'
  aiReply?: string
  status: 'pending' | 'replied'
  date: string
}

export default function Dashboard() {
  const router = useRouter()
  const { userId } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    if (!userId) return
    const saved = localStorage.getItem(`reviews_${userId}`)
    if (saved) setReviews(JSON.parse(saved))
  }, [userId])

  const generateReply = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId)
    if (!review) return

    let reply = ''
    if (review.rating >= 4) {
      reply = `Thank you ${review.author} for your wonderful review! We're thrilled you had a great experience.`
    } else if (review.rating === 3) {
      reply = `Thank you ${review.author} for your feedback. We appreciate your input.`
    } else {
      reply = `Hi ${review.author}, we sincerely apologize for your experience. Please contact us so we can make this right.`
    }

    const updated = reviews.map(r => 
      r.id === reviewId ? { ...r, aiReply: reply, status: 'replied' as const } : r
    )
    setReviews(updated)
    localStorage.setItem(`reviews_${userId}`, JSON.stringify(updated))
  }

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    replied: reviews.filter(r => r.status === 'replied').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">AutoReview AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/chrome-extension')}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg font-medium transition-colors"
            >
              <Puzzle className="w-4 h-4" />
              Chrome Extension
            </button>
            <button 
              onClick={() => router.push('/settings')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-gray-400">
            Manage your reviews and generate AI replies
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Total Reviews</span>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600/10 to-amber-800/10 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Pending</span>
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.pending}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/10 to-emerald-800/10 border border-emerald-500/20 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Replied</span>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.replied}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm">Avg Rating</span>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgRating}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => router.push('/reviews')}
            className="group p-5 bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-2xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Add Reviews</h3>
            <p className="text-gray-400 text-sm">Manually add customer reviews</p>
          </button>

          <button 
            onClick={() => router.push('/connect-platforms')}
            className="group p-5 bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-2xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Connect Platforms</h3>
            <p className="text-gray-400 text-sm">Link Google, Facebook, Yelp</p>
          </button>

          <button 
            onClick={() => router.push('/chrome-extension')}
            className="group p-5 bg-gray-900 border border-gray-800 hover:border-emerald-500/50 rounded-2xl transition-all text-left"
          >
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Puzzle className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Chrome Extension</h3>
            <p className="text-gray-400 text-sm">Download for quick access</p>
          </button>
        </div>

        {/* Reviews Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
              <p className="text-gray-500 text-sm mt-1">
                {reviews.length === 0 ? 'No reviews yet' : `${reviews.length} reviews found`}
              </p>
            </div>
            {reviews.length > 0 && (
              <button 
                onClick={() => router.push('/reviews')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
              >
                View All
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {reviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-white text-lg mb-2">No reviews yet</p>
              <p className="text-gray-500 mb-6">Add reviews manually or connect platforms</p>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => router.push('/reviews')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                  Add Reviews
                </button>
                <button 
                  onClick={() => router.push('/connect-platforms')}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  Connect Platforms
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className="font-semibold text-white">{review.author}</h3>
                        <span className="text-gray-500 text-sm capitalize">{review.platform}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                            />
                          ))}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          review.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                          review.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {review.sentiment}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4 leading-relaxed">{review.text}</p>
                      
                      {review.aiReply ? (
                        <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">AI Generated Reply</span>
                          </div>
                          <p className="text-gray-300 text-sm">{review.aiReply}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateReply(review.id)}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-xl text-sm font-medium transition-opacity flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate AI Reply
                        </button>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm whitespace-nowrap">{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
