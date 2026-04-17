'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { desiPersonas, type Persona } from '@/lib/desiPersonas'

export default function MagicDemo() {
  const [reviewText, setReviewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [selectedPersona, setSelectedPersona] = useState<Persona>(desiPersonas[0])

  const generateMagicReply = async () => {
    if (!reviewText.trim()) {
      alert('Please paste a review first!')
      return
    }

    setLoading(true)
    setResponse('')

    try {
      const prompt = `You are "${selectedPersona.name}" - ${selectedPersona.description}

Tone to use: ${selectedPersona.tone}

Example of your style:
"${selectedPersona.examples.positive}"

Now generate a reply to this customer review in the same style and tone:
Review: "${reviewText}"

Generate ONLY the reply text, nothing else. Match the persona's style exactly.`

      const apiResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a persona-based reply generator. Generate responses that match the exact style and tone of the given persona.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'LongCat-Flash-Chat',
          options: { temperature: 0.85, max_tokens: 400 }
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'AI generation failed');
      }

      const data = await apiResponse.json();
      setResponse(data.reply.trim())
    } catch (error) {
      console.error('Magic demo error:', error)
      setResponse('Sorry! Something went wrong. Please sign in to try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border-2 border-primary/30 rounded-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gradient mb-2">✨ Try AI Review Response</h2>
          <p className="text-white/70">
            Paste any customer review and watch AI generate a professional reply instantly
          </p>
        </div>

        {/* Persona Selector */}
        <div className="mb-6">
          <label className="block text-white mb-3 font-medium text-center">
            🎭 Choose Response Style:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {desiPersonas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona)}
                className={`p-4 rounded-lg font-medium transition-all text-center ${
                  selectedPersona.id === persona.id
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'glass text-white/70 hover:text-white hover:bg-white/10'
                }`}
                title={persona.description}
              >
                <div className="text-3xl mb-2">{persona.icon}</div>
                <div className="text-sm font-semibold">{persona.name}</div>
              </button>
            ))}
          </div>
          <p className="text-center text-white/60 text-sm mt-3">
            Selected: <strong className="text-primary">{selectedPersona.name}</strong> - {selectedPersona.description}
          </p>
        </div>

        {/* Input Box */}
        <div className="mb-4">
          <label className="block text-white mb-2 font-medium">
            Paste Customer Review Here:
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Example: Great product! Fast delivery and excellent quality. Highly recommended!"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary resize-none"
            rows={4}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateMagicReply}
          disabled={loading || !reviewText.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Magic...
            </span>
          ) : (
            '✨ Generate Reply'
          )}
        </button>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-xl p-6 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <span className="text-emerald-400 font-semibold">AI Generated Reply:</span>
              </div>
              <p className="text-white/90 leading-relaxed mb-4 text-lg">
                {response}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(response)
                    alert('✅ Reply copied to clipboard!')
                  }}
                  className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium"
                >
                  📋 Copy Reply
                </button>
                <button
                  onClick={() => {
                    const message = encodeURIComponent(response)
                    window.open(`https://wa.me/?text=${message}`, '_blank')
                  }}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium"
                >
                  📱 Share on WhatsApp
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        {response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center p-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/30"
          >
            <p className="text-white text-lg mb-4">
              <strong>Impressed?</strong> Get unlimited AI replies, auto-posting, and detailed analytics!
            </p>
            <a
              href="/onboarding"
              className="inline-block px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all"
            >
              Start Free Trial →
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
