'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { MessageSquare, Star, CheckCircle, Plus, Settings } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">AutoReview AI</h1>
          <button onClick={() => router.push('/settings')} className="text-gray-400 hover:text-white">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total</span>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pending</span>
              <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 text-xs">!</div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.pending}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Replied</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.replied}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Avg Rating</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => router.push('/reviews')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Reviews
          </button>
          <button 
            onClick={() => router.push('/connect-platforms')}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            Connect Platforms
          </button>
        </div>

        {/* Reviews */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Reviews</h2>
          </div>
          
          {reviews.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">Add reviews manually or connect platforms</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white">{review.author}</h3>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`}
                            />
                          ))}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          review.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                          review.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {review.sentiment}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4">{review.text}</p>
                      
                      {review.aiReply ? (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <p className="text-sm text-blue-400 mb-1">AI Reply:</p>
                          <p className="text-gray-300 text-sm">{review.aiReply}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateReply(review.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium"
                        >
                          Generate AI Reply
                        </button>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm ml-4">{review.date}</span>
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
