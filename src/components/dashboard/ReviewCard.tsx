'use client'

import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useState, useCallback } from 'react'
import { Edit2, Trash2, Check, X, ThumbsUp, ThumbsDown, MessageSquare, Send } from 'lucide-react'

interface Review {
  id: string
  content: string
  rating: number
  author: string
  date: string
  sentiment: 'positive' | 'negative' | 'neutral'
  reply?: string | null
}

interface ReviewCardProps {
  review: Review
  onSwipeLeft: (id: string) => void
  onSwipeRight: (id: string) => void
  onEdit?: (id: string, reply: string) => void
  onDelete?: (id: string) => void
  activeTab?: 'pending' | 'approved' | 'rejected'
}

export default function ReviewCard({ 
  review, 
  onSwipeLeft, 
  onSwipeRight, 
  onEdit,
  onDelete,
  activeTab = 'pending'
}: ReviewCardProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedReply, setEditedReply] = useState(review.reply || '')
  
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x
    
    if (offset > 100 || velocity > 500) {
      onSwipeRight(review.id)
    } else if (offset < -100 || velocity < -500) {
      onSwipeLeft(review.id)
    }
    setDragOffset(0)
  }, [review.id, onSwipeLeft, onSwipeRight])

  const handleSaveReply = () => {
    if (onEdit) {
      onEdit(review.id, editedReply)
    }
    setShowEditModal(false)
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50'
      case 'negative':
        return 'from-red-500/20 to-red-600/20 border-red-500/50'
      default:
        return 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/50'
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
        ★
      </span>
    ))
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -300, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
        className={`relative glass-card border-2 rounded-xl p-6 cursor-grab active:cursor-grabbing
          bg-gradient-to-br ${getSentimentColor(review.sentiment)}
          ${dragOffset > 50 ? 'border-emerald-400 shadow-lg shadow-emerald-400/30' : ''}
          ${dragOffset < -50 ? 'border-red-400 shadow-lg shadow-red-400/30' : ''}
          transition-all duration-200
        `}
        style={{
          boxShadow: dragOffset > 50 ? '0 0 30px rgba(16, 185, 129, 0.4)' : 
                     dragOffset < -50 ? '0 0 30px rgba(239, 68, 68, 0.4)' : 
                     '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Swipe Right Indicator - APPROVE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: -20 }}
          animate={{ 
            opacity: dragOffset > 30 ? Math.min(dragOffset / 100, 1) : 0,
            scale: dragOffset > 30 ? 1 : 0.5,
            x: 0
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Check className="w-6 h-6" />
            <span>APPROVE</span>
          </div>
        </motion.div>

        {/* Swipe Left Indicator - REJECT */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: 20 }}
          animate={{ 
            opacity: dragOffset < -30 ? Math.min(Math.abs(dragOffset) / 100, 1) : 0,
            scale: dragOffset < -30 ? 1 : 0.5,
            x: 0
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
        >
          <div className="bg-red-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <X className="w-6 h-6" />
            <span>REJECT</span>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{review.author}</h3>
            <p className="text-sm text-white/50">{review.date}</p>
          </div>
          <div className="flex gap-1">
            {getRatingStars(review.rating)}
          </div>
        </div>

        {/* Review Content */}
        <p className="text-white/90 leading-relaxed mb-4">{review.content}</p>

        {/* AI Reply Section */}
        {review.reply && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Generated Reply:</span>
            </div>
            <p className="text-white/80 text-sm">{review.reply}</p>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          {/* Sentiment Badge */}
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium
            ${review.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : ''}
            ${review.sentiment === 'negative' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : ''}
            ${review.sentiment === 'neutral' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : ''}
          `}>
            {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Edit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEditModal(true)}
              className="p-2 glass rounded-lg text-white hover:bg-white/20 transition-colors"
              title="Edit Reply"
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>

            {/* Delete Button */}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this review?')) {
                    onDelete(review.id)
                  }
                }}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Delete Review"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Swipe Hint & Approve/Reject Buttons */}
        <div className="mt-4 pt-4 border-t border-white/10">
          {activeTab === 'pending' ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-white/40 flex items-center gap-1">
                <span>👆</span>
                Swipe right to approve, left to reject
              </p>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSwipeRight(review.id)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Approve
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSwipeLeft(review.id)}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Reject
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">
                {activeTab === 'approved' ? '✓ This review has been approved' : '✕ This review has been rejected'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete && onDelete(review.id)}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Edit Reply Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border border-white/20 rounded-2xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                Edit AI Reply
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-white/60 mb-2">Original Review:</p>
                <p className="text-white/80 text-sm bg-white/5 rounded-lg p-3">{review.content}</p>
              </div>

              <textarea
                value={editedReply}
                onChange={(e) => setEditedReply(e.target.value)}
                placeholder="Enter your reply..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-primary resize-none"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReply}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Save Reply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ReviewListProps {
  reviews: Array<Review>
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit?: (id: string, reply: string) => void
  onDelete?: (id: string) => void
  activeTab?: 'pending' | 'approved' | 'rejected'
}

export function ReviewList({ reviews, onApprove, onReject, onEdit, onDelete, activeTab }: ReviewListProps) {
  return (
    <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence mode="popLayout">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onSwipeRight={onApprove}
            onSwipeLeft={onReject}
            onEdit={onEdit}
            onDelete={onDelete}
            activeTab={activeTab}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
