'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Star, Send, CheckCircle, ThumbsUp } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function FeedbackWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Hide on chat page
  if (pathname === '/chat') return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setSubmitted(false)
      setRating(0)
      setFeedback('')
    }, 2000)
  }

  return (
    <>
      <motion.button
        drag
        dragConstraints={{ left: 0, right: 300, top: -500, bottom: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-2xl shadow-lg flex items-center justify-center border border-white/20"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-6 w-[90vw] max-w-[350px] bg-[#0f0f18]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[1000] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Feedback</h3>
                <button onClick={() => setIsOpen(false)} className="text-white/40"><X className="w-5 h-5" /></button>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-white font-bold">Thank you!</p>
                  <p className="text-xs text-white/40 mt-1">Your feedback helps us evolve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        type="button"
                        onClick={() => setRating(s)}
                        className={`text-2xl transition-all ${rating >= s ? 'scale-125' : 'opacity-20 grayscale'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us how we can improve..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[100px] resize-none"
                  />
                  <button
                    disabled={!rating}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  >
                    Submit Report
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
