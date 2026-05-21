'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, CheckCircle, Headphones, Lightbulb, MessageSquare, Send, Star, ThumbsUp, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}

interface FeedbackData {
  rating: number
  category: string
  message: string
  email: string
  pageUrl: string
}

const categories = [
  { id: 'bug', label: 'Bug Report', description: 'Something is broken', Icon: Bug },
  { id: 'feature', label: 'Feature Request', description: 'Suggest improvement', Icon: Lightbulb },
  { id: 'general', label: 'General Feedback', description: 'Share your thoughts', Icon: MessageSquare },
  { id: 'support', label: 'Need Help', description: 'Get assistance', Icon: Headphones },
]

export default function FeedbackWidget() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const [isOpen, setIsOpen] = useState(false)
  const [showExitIntent, setShowExitIntent] = useState(false)
  const [step, setStep] = useState<'rating' | 'details' | 'success'>('rating')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState<FeedbackData>({
    rating: 0,
    category: 'general',
    message: '',
    email: '',
    pageUrl: '',
  })

  useEffect(() => {
    if (!hydrated) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !localStorage.getItem('feedback-exit-shown')) {
        window.setTimeout(() => {
          setShowExitIntent(true)
          localStorage.setItem('feedback-exit-shown', 'true')
        }, 10000)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [hydrated])

  const resetForm = () => {
    setIsOpen(false)
    setShowExitIntent(false)
    setStep('rating')
    setRating(0)
    setSubmitError('')
    setFormData({ rating: 0, category: 'general', message: '', email: '', pageUrl: '' })
  }

  const handleRatingSubmit = (selectedRating: number) => {
    setRating(selectedRating)
    setSubmitError('')
    setFormData((prev) => ({
      ...prev,
      rating: selectedRating,
      pageUrl: window.location.href,
    }))
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hydrated || submitting) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rating,
          pageUrl: window.location.href,
        }),
      })
      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Feedback could not be submitted.')
      }

      setStep('success')
      window.setTimeout(resetForm, 2500)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Feedback could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isChatPage = pathname?.startsWith('/chat')

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`group fixed z-[35] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transition-shadow hover:shadow-xl sm:h-14 sm:w-14 left-4 lg:left-8 ${isChatPage ? 'bottom-[120px] lg:bottom-8' : 'bottom-20 lg:bottom-8'}`}
        title="Give Feedback"
        suppressHydrationWarning
      >
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" suppressHydrationWarning />
        <div className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:block">
          Give Feedback
        </div>
      </motion.button>

      <AnimatePresence>
        {showExitIntent && !isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitIntent(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="glass-card rounded-2xl border-2 border-emerald-500/30 p-6 text-center shadow-2xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <ThumbsUp className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white">Quick Feedback?</h3>
                <p className="mb-6 text-white/70">Before you go, help us improve AutoReview AI.</p>
                <div className="mb-6 flex justify-center gap-2">
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
                      <Star className="h-10 w-10 text-gray-600 transition-colors hover:fill-yellow-400 hover:text-yellow-400" />
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={() => setShowExitIntent(false)} className="glass rounded-lg px-4 py-2 text-white/70 transition-colors hover:text-white">
                    Maybe Later
                  </button>
                  <button onClick={() => setIsOpen(true)} className="rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600">
                    Give Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2"
            >
              <div className="glass-card max-h-[90vh] overflow-y-auto rounded-2xl border-2 border-emerald-500/30 p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Share Feedback</h3>
                      <p className="text-sm text-white/60">Help us improve your experience</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-white/40 transition-colors hover:text-white">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {step === 'rating' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                    <p className="mb-6 text-white">How would you rate your experience?</p>
                    <div className="mb-4 flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRatingSubmit(star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star className={`h-12 w-12 transition-colors ${star <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-white/60">
                      {rating === 1 && 'Very dissatisfied'}
                      {rating === 2 && 'Dissatisfied'}
                      {rating === 3 && 'Neutral'}
                      {rating === 4 && 'Satisfied'}
                      {rating === 5 && 'Very satisfied'}
                    </p>
                  </motion.div>
                )}

                {step === 'details' && (
                  <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60">Your rating:</span>
                      <div className="flex">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">What is this about?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => {
                          const Icon = cat.Icon
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                              className={`rounded-xl border p-3 text-left transition-all ${formData.category === cat.id ? 'border-emerald-500/50 bg-emerald-500/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                            >
                              <Icon className="mb-2 h-5 w-5 text-emerald-300" />
                              <div className="text-xs font-medium text-white">{cat.label}</div>
                              <div className="text-xs text-white/50">{cat.description}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Tell us more</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                        placeholder="Describe your experience or suggestion..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Email (optional)</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !formData.message.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Feedback
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {step === 'success' && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h4 className="mb-2 text-xl font-bold text-white">Thank you</h4>
                    <p className="mb-4 text-white/70">Your feedback helps us improve.</p>
                    <p className="rounded-lg bg-white/5 p-3 text-xs text-white/55">It has been saved securely for follow-up.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
