'use client'

import { motion } from 'framer-motion'
import { Star, Sparkles, MessageSquare, ExternalLink, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  reply?: {
    id: string
    reply_text?: string
    content?: string
    ai_generated?: boolean
  } | null
}

interface ReviewItemProps {
  review: Review
  index?: number
}

const platformIcons: Record<string, string> = {
  google: '🔍',
  facebook: '📘',
  yelp: '⭐',
  tripadvisor: '✈️',
  trustpilot: '💚',
  manual: '📝',
}

const sentimentConfig = {
  positive: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Positive' },
  negative: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'Negative' },
  neutral: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Neutral' },
}

const statusConfig = {
  pending: { color: 'bg-amber-500/10 text-amber-400', label: 'Pending' },
  approved: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Replied' },
  rejected: { color: 'bg-rose-500/10 text-rose-400', label: 'Rejected' },
}

export default function ReviewItem({ review, index = 0 }: ReviewItemProps) {
  const router = useRouter()
  const authorName = review.reviewer_name || review.author_name || 'Anonymous'
  const reviewText = review.review_text || review.content || ''
  const replyText = review.reply?.reply_text || review.reply?.content || ''
  const platformIcon = platformIcons[review.platform] || '🌐'
  
  const sentiment = review.sentiment_label ? sentimentConfig[review.sentiment_label] : null
  const status = statusConfig[review.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-900/40 p-5 transition-all duration-300 hover:border-gray-700 hover:shadow-lg"
    >
      {/* Left accent line */}
      <div className={`absolute left-0 top-0 h-full w-1 transition-all duration-300 ${
        review.status === 'approved' ? 'bg-emerald-500' : 
        review.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'
      }`} />

      <div className="pl-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
              {authorName.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">{authorName}</h4>
                <span className="text-lg" title={review.platform}>{platformIcon}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {new Date(review.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Rating and badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`}
                />
              ))}
            </div>
            {sentiment && (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sentiment.color}`}>
                {sentiment.label}
              </span>
            )}
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Review Content */}
        <p className="mt-3 text-sm leading-relaxed text-gray-300 line-clamp-2">
          {reviewText}
        </p>

        {/* AI Reply Preview */}
        {replyText && (
          <div className="mt-3 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">AI Reply</span>
              {review.reply?.ai_generated && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                  AI Generated
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400 line-clamp-1">{replyText}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {review.status === 'pending' && !replyText && (
              <button className="flex items-center gap-1.5 rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                Generate Reply
              </button>
            )}
          </div>
          
          <button 
            onClick={() => router.push(`/reviews?id=${review.id}`)}
            className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-white"
          >
            View Details
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
