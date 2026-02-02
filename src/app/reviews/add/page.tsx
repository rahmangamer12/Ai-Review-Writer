'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Star, Plus, Send, Loader2, CheckCircle2, 
  AlertCircle, Trash2, MessageSquare, User, Globe,
  Sparkles, X
} from 'lucide-react'

interface ReviewForm {
  author_name: string
  author_email: string
  platform: string
  rating: number
  content: string
}

interface Review {
  id: string
  author_name: string
  platform: string
  rating: number
  content: string
  sentiment: string
}

const platforms = [
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'yelp', label: 'Yelp', icon: '⭐' },
  { value: 'tripadvisor', label: 'TripAdvisor', icon: '✈️' },
  { value: 'trustpilot', label: 'Trustpilot', icon: '💚' },
  { value: 'manual', label: 'Manual Entry', icon: '📝' },
]

export default function AddReviewPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user } = useUser()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [form, setForm] = useState<ReviewForm>({
    author_name: '',
    author_email: '',
    platform: 'google',
    rating: 5,
    content: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkText, setBulkText] = useState('')

  const getSentiment = (rating: number) => {
    if (rating >= 4) return 'positive'
    if (rating <= 2) return 'negative'
    return 'neutral'
  }

  const addToQueue = () => {
    if (!form.author_name.trim() || !form.content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      author_name: form.author_name.trim(),
      platform: form.platform,
      rating: form.rating,
      content: form.content.trim(),
      sentiment: getSentiment(form.rating),
    }

    setReviews([...reviews, newReview])
    setForm({
      author_name: '',
      author_email: '',
      platform: 'google',
      rating: 5,
      content: '',
    })
    setError(null)
  }

  const removeFromQueue = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id))
  }

  const saveAll = async () => {
    if (!userId || reviews.length === 0) return
    
    setSaving(true)
    setError(null)
    
    try {
      const results = await Promise.all(
        reviews.map(review =>
          fetch('/api/reviews/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: review.content,
              rating: review.rating,
              author_name: review.author_name,
              platform: review.platform,
              sentiment_label: review.sentiment,
            }),
          })
        )
      )

      const failed = results.filter(r => !r.ok)
      
      if (failed.length > 0) {
        setError(`Failed to save ${failed.length} review(s). Please try again.`)
      } else {
        setSuccess(true)
        setReviews([])
        setTimeout(() => {
          router.push('/reviews')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save reviews')
    } finally {
      setSaving(false)
    }
  }

  const parseBulkImport = () => {
    // Simple parsing - split by double newline for multiple reviews
    const entries = bulkText.split(/\n\n+/).filter(e => e.trim())
    
    const parsedReviews: Review[] = entries.map(entry => {
      const lines = entry.split('\n').filter(l => l.trim())
      
      // Try to extract rating (look for numbers 1-5 or star symbols)
      let rating = 5
      const ratingMatch = entry.match(/(\d)\s*star/i) || entry.match(/[★⭐]{1,5}/)
      if (ratingMatch) {
        const stars = ratingMatch[0].replace(/[^1-5★⭐]/g, '').length
        rating = stars > 0 ? Math.min(stars, 5) : parseInt(ratingMatch[1]) || 5
      }
      
      // First line as author, rest as content
      const author = lines[0]?.replace(/[:\-]/, '').trim() || 'Anonymous'
      const content = lines.slice(1).join('\n').trim() || entry.trim()
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        author_name: author,
        platform: 'manual',
        rating,
        content,
        sentiment: getSentiment(rating),
      }
    })

    setReviews([...reviews, ...parsedReviews])
    setBulkText('')
    setShowBulkImport(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <button
              onClick={() => router.push('/reviews')}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Add Reviews</h1>
              <p className="text-xs text-gray-500">Import customer reviews manually</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">Reviews saved successfully!</p>
                <p className="text-emerald-400/70 text-sm">Redirecting to reviews...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400" />
              <p className="text-rose-400">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Add Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className={`p-6 rounded-2xl border transition-all text-left ${
              showBulkImport 
                ? 'border-purple-500/50 bg-purple-500/10' 
                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bulk Import</h3>
                <p className="text-xs text-gray-500">Paste multiple reviews at once</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/connect-platforms')}
            className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-left transition-all hover:border-white/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <Globe className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Connect Platform</h3>
                <p className="text-xs text-gray-500">Auto-import from Google, Facebook, etc.</p>
              </div>
            </div>
          </button>
        </div>

        {/* Bulk Import Section */}
        {showBulkImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
          >
            <h3 className="font-semibold text-white mb-4">Bulk Import Reviews</h3>
            <p className="text-sm text-gray-500 mb-4">
              Paste reviews below. Format: Author name on first line, review text on following lines. 
              Separate reviews with a blank line.
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none mb-4"
              placeholder="John Doe&#10;This place is amazing! Great service and friendly staff.&#10;&#10;Jane Smith&#10;Good experience overall. Food was tasty but a bit pricey.&#10;&#10;..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkImport(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={parseBulkImport}
                disabled={!bulkText.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Add to Queue
              </button>
            </div>
          </motion.div>
        )}

        {/* Single Review Form */}
        {!showBulkImport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white">Add Single Review</h3>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
                Manual Entry
              </span>
            </div>

            <div className="space-y-5">
              {/* Author Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                    placeholder="e.g., John Smith"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Platform & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-400">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {platforms.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-400">Rating</label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors ${
                            star <= form.rating
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-white">{form.rating}.0</span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">
                  Review Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  placeholder="Enter the full review text..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">{form.content.length} characters</p>
              </div>

              {/* Add Button */}
              <button
                onClick={addToQueue}
                disabled={!form.author_name.trim() || !form.content.trim()}
                className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white transition-all hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Add to Queue
              </button>
            </div>
          </motion.div>
        )}

        {/* Reviews Queue */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">Reviews to Save</h3>
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
                {reviews.length} Review{reviews.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-white">{review.author_name}</span>
                        <span className="text-lg">
                          {platforms.find(p => p.value === review.platform)?.icon}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          review.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400' :
                          review.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {review.sentiment}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{review.content}</p>
                    </div>
                    <button
                      onClick={() => removeFromQueue(review.id)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Save Button */}
            <button
              onClick={saveAll}
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 font-bold text-white transition-all hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                  Saving {reviews.length} Review{reviews.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Send className="mr-2 inline h-5 w-5" />
                  Save {reviews.length} Review{reviews.length > 1 ? 's' : ''} to Database
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {reviews.length === 0 && !showBulkImport && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Sparkles className="h-8 w-8 text-gray-600" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">No reviews in queue</h4>
            <p className="text-sm text-gray-500">Fill out the form above to add reviews</p>
          </div>
        )}
      </main>
    </div>
  )
}
