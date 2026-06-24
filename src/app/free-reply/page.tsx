'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Star, Copy, Check, Loader2, ArrowRight, Wand2 } from 'lucide-react'

const TONES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'professional', label: 'Professional' },
  { id: 'apologetic', label: 'Apologetic' },
  { id: 'desi', label: 'Desi (Urdu-English)' },
] as const

/**
 * Public lead-magnet tool — no login. A business owner pastes a real review and
 * instantly gets a professional AI reply. Showing value first converts far
 * better than a cold pitch. After the reply, we offer to do it for ALL their
 * reviews (capture the lead). Share this link anywhere to pull inbound leads.
 */
export default function FreeReplyPage() {
  const [businessName, setBusinessName] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [tone, setTone] = useState<string>('friendly')

  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Lead capture (after a reply is shown)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSent, setLeadSent] = useState(false)
  const [leadSending, setLeadSending] = useState(false)

  const generate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setReply('')
    setLeadSent(false)
    try {
      const res = await fetch('/api/free-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, reviewText, authorName, rating, tone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not generate a reply.')
      setReply(data.reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a reply.')
    } finally {
      setLoading(false)
    }
  }

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(reply)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  const sendLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (leadSending || !leadEmail.trim()) return
    setLeadSending(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: businessName.trim() || 'Free-tool lead',
          email: leadEmail.trim(),
          subject: 'Lead — Free Review Reply tool',
          message: `This person tried the free reply tool${businessName ? ` for "${businessName}"` : ''} and wants to do it for all their reviews. Follow up!`,
        }),
      })
      setLeadSent(true)
    } catch {
      setLeadSent(true) // don't block the visitor on a delivery hiccup
    } finally {
      setLeadSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Free tool · no sign-up needed
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-3">
            Free AI Review Reply Generator
          </h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Paste any Google or Facebook review and get a professional, personalized reply in
            seconds. Reply faster, look responsive, win more customers.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={generate}
          className="glass-card border border-primary/20 rounded-2xl p-5 sm:p-6 space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Business name (optional)</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Karachi Grill House"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Reviewer name (optional)</label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Ahmed"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-1.5">The review *</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              rows={4}
              placeholder="Paste the customer's review here..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-7 h-7 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-1.5">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary"
                style={{ colorScheme: 'dark' }}
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id} style={{ backgroundColor: '#1f2937' }}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !reviewText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate free reply</>
            )}
          </button>
        </motion.form>

        {/* Result */}
        {reply && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-emerald-500/30 rounded-2xl p-5 sm:p-6 mt-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Your AI reply
              </h3>
              <button
                onClick={copyReply}
                className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
              >
                {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
              </button>
            </div>
            <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{reply}</p>

            {/* Lead capture / upsell */}
            <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
              {leadSent ? (
                <div className="text-center py-2">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Thank you! We&apos;ll reach out shortly.</p>
                </div>
              ) : (
                <>
                  <p className="text-white font-semibold mb-1">Want this for ALL your reviews — automatically?</p>
                  <p className="text-white/60 text-sm mb-3">
                    Leave your email and we&apos;ll set you up to reply to every Google &amp; Facebook review in seconds.
                  </p>
                  <form onSubmit={sendLead} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={leadSending}
                      className="px-5 py-2.5 rounded-xl font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                    >
                      {leadSending ? 'Sending...' : 'Get started'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Sign-up CTA */}
        <div className="text-center mt-8">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
          >
            Create a free account <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/40 text-xs mt-2">
            200 free AI replies / month · no credit card required
          </p>
        </div>
      </div>
    </div>
  )
}
