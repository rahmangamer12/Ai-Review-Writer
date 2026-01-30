'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ArrowLeft, Plus, Star, Send, Trash2 } from 'lucide-react'

interface Review {
  author: string
  platform: 'google' | 'facebook' | 'yelp' | 'other'
  rating: number
  text: string
}

export default function ReviewsPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState<Review>({
    author: '',
    platform: 'google',
    rating: 5,
    text: ''
  })

  const getSentiment = (rating: number) => {
    if (rating >= 4) return 'positive'
    if (rating <= 2) return 'negative'
    return 'neutral'
  }

  const addReview = () => {
    if (!form.author || !form.text) return
    setReviews([...reviews, form])
    setForm({ author: '', platform: 'google', rating: 5, text: '' })
    setShowForm(false)
  }

  const removeReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index))
  }

  const saveAll = () => {
    if (!userId || reviews.length === 0) return
    
    const existing = JSON.parse(localStorage.getItem(`reviews_${userId}`) || '[]')
    const newReviews = reviews.map((r, i) => ({
      id: `manual_${Date.now()}_${i}`,
      ...r,
      sentiment: getSentiment(r.rating),
      status: 'pending',
      date: new Date().toLocaleDateString()
    }))
    
    localStorage.setItem(`reviews_${userId}`, JSON.stringify([...newReviews, ...existing]))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Add Reviews</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-6 px-6 py-4 border-2 border-dashed border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-500 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {reviews.length === 0 ? 'Add Your First Review' : 'Add Another Review'}
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Review</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Customer Name</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Platform</label>
                  <select
                    value={form.platform}
                    onChange={e => setForm({ ...form, platform: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="yelp">Yelp</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Rating</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setForm({ ...form, rating: star })}>
                        <Star className={`w-6 h-6 ${star <= form.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Review Text</label>
                <textarea
                  value={form.text}
                  onChange={e => setForm({ ...form, text: e.target.value })}
                  placeholder="Enter review content..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addReview}
                  disabled={!form.author || !form.text}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium"
                >
                  Add to List
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Reviews to Save ({reviews.length})</h3>
            {reviews.map((review, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-white">{review.author}</h4>
                      <span className="text-gray-500 text-sm capitalize">{review.platform}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{review.text}</p>
                  </div>
                  <button
                    onClick={() => removeReview(index)}
                    className="p-2 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {reviews.length > 0 && (
          <button
            onClick={saveAll}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Save {reviews.length} Review{reviews.length > 1 ? 's' : ''}
          </button>
        )}
      </main>
    </div>
  )
}
