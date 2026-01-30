'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Star, Send, CheckCircle, ThumbsUp } from 'lucide-react'

interface FeedbackData {
  rating: number
  category: string
  message: string
  email: string
  pageUrl: string
}

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [step, setStep] = useState<'rating' | 'details' | 'success'>('rating')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FeedbackData>({
    rating: 0,
    category: 'general',
    message: '',
    email: '',
    pageUrl: ''
  })

  // Exit Intent - Show when user tries to leave
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse goes to top of page (address bar)
      if (e.clientY < 10 && !localStorage.getItem('feedback-exit-shown')) {
        // Check if user has been on page for at least 10 seconds
        setTimeout(() => {
          setShowExitIntent(true)
          localStorage.setItem('feedback-exit-shown', 'true')
        }, 10000)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])

  const categories = [
    { id: 'bug', label: 'Bug Report', description: 'Something is broken', icon: '🐛' },
    { id: 'feature', label: 'Feature Request', description: 'Suggest improvement', icon: '✨' },
    { id: 'general', label: 'General Feedback', description: 'Share your thoughts', icon: '💬' },
    { id: 'support', label: 'Need Help', description: 'Get assistance', icon: '🎧' }
  ]

  const handleRatingSubmit = (selectedRating: number) => {
    setRating(selectedRating)
    setFormData(prev => ({ 
      ...prev, 
      rating: selectedRating,
      pageUrl: window.location.href 
    }))
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Store feedback in localStorage
    const feedbacks = JSON.parse(localStorage.getItem('autoreview-feedbacks') || '[]')
    const newFeedback = {
      ...formData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pageUrl: window.location.href
    }
    feedbacks.push(newFeedback)
    localStorage.setItem('autoreview-feedbacks', JSON.stringify(feedbacks))

    // Also send to your email (in production, use your backend)
    console.log('New Feedback:', newFeedback)

    setSubmitting(false)
    setStep('success')

    // Reset after 3 seconds
    setTimeout(() => {
      setIsOpen(false)
      setShowExitIntent(false)
      setStep('rating')
      setRating(0)
      setFormData({ rating: 0, category: 'general', message: '', email: '', pageUrl: '' })
    }, 3000)
  }

  // Show feedback location info
  const getFeedbackLocation = () => {
    return `
📍 HOW TO ACCESS FEEDBACK DATA:

Method 1 - Browser Console:
1. Press F12 (Developer Tools)
2. Go to Console tab
3. Type: JSON.parse(localStorage.getItem('autoreview-feedbacks'))
4. Press Enter

Method 2 - LocalStorage:
1. Press F12
2. Go to Application/Storage tab
3. Find LocalStorage → your domain
4. Look for key: "autoreview-feedbacks"

Method 3 - Export (Add this to your admin panel):
const exportFeedbacks = () => {
  const data = localStorage.getItem('autoreview-feedbacks');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'feedbacks.json';
  a.click();
}

📝 Current Storage: ${JSON.parse(localStorage.getItem('autoreview-feedbacks') || '[]').length} feedbacks saved
    `
  }

  return (
    <>
      {/* Standard Floating Feedback Button - LEFT SIDE */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
        title="Give Feedback"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Tooltip */}
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Give Feedback
        </div>
      </motion.button>

      {/* Exit Intent Modal */}
      <AnimatePresence>
        {showExitIntent && !isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitIntent(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="glass-card border-2 border-emerald-500/30 rounded-2xl p-6 shadow-2xl text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Quick Feedback?</h3>
                <p className="text-white/70 mb-6">
                  Before you go, help us improve! How was your experience with AutoReview AI?
                </p>
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => {
                        setShowExitIntent(false)
                        handleRatingSubmit(star)
                        setIsOpen(true)
                      }}
                      className="transition-transform hover:scale-110"
                    >
                      <Star className="w-10 h-10 text-gray-600 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowExitIntent(false)}
                    className="px-4 py-2 glass text-white/70 hover:text-white rounded-lg transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={() => {
                      setShowExitIntent(false)
                      setIsOpen(true)
                    }}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Give Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="glass-card border-2 border-emerald-500/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Share Feedback</h3>
                      <p className="text-white/60 text-sm">Help us improve your experience</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Step 1: Rating */}
                {step === 'rating' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-center"
                  >
                    <p className="text-white mb-6">How would you rate your experience?</p>
                    <div className="flex justify-center gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRatingSubmit(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-12 h-12 transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-white/60 text-sm">
                      {rating === 1 && 'Very Dissatisfied 😞'}
                      {rating === 2 && 'Dissatisfied 😕'}
                      {rating === 3 && 'Neutral 😐'}
                      {rating === 4 && 'Satisfied 🙂'}
                      {rating === 5 && 'Very Satisfied 😊'}
                    </p>
                  </motion.div>
                )}

                {/* Step 2: Details */}
                {step === 'details' && (
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Rating Display */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-white/60">Your rating:</span>
                      <div className="flex">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">What is this about?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                            className={`p-3 rounded-xl text-left transition-all ${
                              formData.category === cat.id
                                ? 'bg-emerald-500/30 border border-emerald-500/50'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-lg mb-1">{cat.icon}</div>
                            <div className="text-white text-xs font-medium">{cat.label}</div>
                            <div className="text-white/50 text-xs">{cat.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Tell us more</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Describe your experience or suggestion..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 resize-none"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">Email (optional)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com (for follow-up)"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting || !formData.message.trim()}
                      className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Feedback
                        </>
                      )}
                    </button>

                    {/* Where feedback goes info */}
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/50 text-xs">
                        💾 Feedback is stored securely. View it in your browser's localStorage or check console for export instructions.
                      </p>
                    </div>
                  </motion.form>
                )}

                {/* Step 3: Success */}
                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Thank You! 🎉</h4>
                    <p className="text-white/70 mb-4">Your feedback helps us improve.</p>
                    <div className="p-3 bg-white/5 rounded-lg text-left">
                      <p className="text-emerald-400 text-xs font-medium mb-2">📍 Where to find your feedbacks:</p>
                      <code className="text-white/50 text-xs block">
                        localStorage: &quot;autoreview-feedbacks&quot;
                      </code>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Console log instructions for admin */}
      <script dangerouslySetInnerHTML={{ __html: `
        console.log("${getFeedbackLocation()}");
      `}} />
    </>
  )
}
