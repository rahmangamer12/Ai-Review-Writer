'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Star, Loader2, RefreshCw, Check, AlertTriangle } from 'lucide-react'

interface AIReviewGeneratorProps {
  onGenerate?: (review: { content: string; rating: number; author: string }) => void
}

const SAMPLE_PROMPTS = [
  "Positive review about excellent customer service",
  "Negative review about slow delivery",
  "5-star review praising product quality",
  "Mixed review with both pros and cons"
]

export default function AIReviewGenerator({ onGenerate }: AIReviewGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generatedReview, setGeneratedReview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generateReview = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert review generator. Generate realistic customer reviews based on the user prompt.'
            },
            {
              role: 'user',
              content: `Generate a realistic customer review based on: "${prompt}".
              Return ONLY valid JSON with this exact format:
              {"content": "review text here", "rating": 1-5, "author": "Full Name", "sentiment": "positive/negative/neutral"}`
            }
          ],
          model: 'LongCat-Flash-Chat',
          temperature: 0.9
        })
      })

      if (!response.ok) {
        throw new Error(`AI service unavailable (${response.status})`)
      }

      const data = await response.json()
      
      let review
      try {
        const jsonMatch = data.response?.match(/\{[\s\S]*\}/)
        review = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(data.response)
      } catch (parseError) {
        throw new Error('Invalid response format from AI service')
      }

      if (review && review.content && review.rating) {
        setGeneratedReview(review)
      } else {
        throw new Error('Invalid review format from AI service')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate review')
    } finally {
      setLoading(false)
    }
  }

  const handleUseReview = () => {
    if (generatedReview && onGenerate) {
      onGenerate({
        content: generatedReview.content,
        rating: generatedReview.rating,
        author: generatedReview.author
      })
      setIsOpen(false)
      setGeneratedReview(null)
      setPrompt('')
      setError(null)
    }
  }

  const handleQuickPrompt = (p: string) => {
    setPrompt(p)
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">Generate Test Review</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[85vh] bg-[#0f0f0f] border border-white/10 rounded-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Review Generator</h2>
                    <p className="text-white/50 text-sm">Generate realistic test reviews</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Prompt Input */}
                <div>
                  <label className="block text-white/80 mb-2 font-medium">
                    What kind of review do you want?
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'A 5-star review praising fast delivery and great customer service'"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                    rows={3}
                  />
                </div>

                {/* Quick Prompts */}
                <div>
                  <p className="text-white/40 text-sm mb-2">Quick options:</p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_PROMPTS.map((p) => (
                      <button
                        key={p}
                        onClick={() => handleQuickPrompt(p)}
                        className="text-xs bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 px-3 py-1.5 rounded-full text-white/70 transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generated Review */}
                {generatedReview && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
                  >
                    {error && (
                      <div className="text-xs text-red-400/80 bg-red-400/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{generatedReview.author}</p>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < generatedReview.rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          generatedReview.sentiment === 'positive'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : generatedReview.sentiment === 'negative'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {generatedReview.sentiment}
                      </span>
                    </div>
                    
                    <p className="text-white/80 leading-relaxed">{generatedReview.content}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={generateReview}
                    disabled={loading || !prompt.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Review
                      </>
                    )}
                  </button>

                  {generatedReview && (
                    <button
                      onClick={handleUseReview}
                      className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Use This Review
                    </button>
                  )}
                </div>

                {generatedReview && (
                  <button
                    onClick={() => { setGeneratedReview(null); setError(null); }}
                    className="w-full px-4 py-2 text-white/50 hover:text-white text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate Different Review
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
