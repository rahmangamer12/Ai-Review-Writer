'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Star, Copy, Check, Loader2, ArrowRight, Wand2, Layers, FileText } from 'lucide-react'

const TONES = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'professional', label: 'Professional' },
  { id: 'apologetic', label: 'Apologetic' },
  { id: 'desi', label: 'Desi (Urdu-English)' },
] as const

type BulkResult = { reviewText: string; rating: number; reply: string; error: string | null }

/**
 * Public lead-magnet tool — no login. A business owner pastes their reviews and
 * instantly gets professional AI replies. Showing value first converts far
 * better than a cold pitch.
 *
 * The BULK tab is the real hook vs a generic chatbot: paste ALL your unanswered
 * reviews and get a reply for each in one click — the same automation the paid
 * product does for connected platforms. Share this link anywhere for inbound leads.
 */
export default function FreeReplyPage() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')

  // Shared
  const [businessName, setBusinessName] = useState('')
  const [tone, setTone] = useState<string>('friendly')

  // ── Single mode ────────────────────────────────────────────────────────────
  const [reviewText, setReviewText] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // ── Bulk mode ──────────────────────────────────────────────────────────────
  const [bulkText, setBulkText] = useState('')
  const [bulkRatings, setBulkRatings] = useState<Record<number, number>>({})
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

  // Lead capture (shown after results in either mode)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSent, setLeadSent] = useState(false)
  const [leadSending, setLeadSending] = useState(false)

  const MAX_BULK = 8

  // Split pasted text into review blocks: separated by a blank line, or one per
  // line if no blank lines are used. Capped so the request stays bounded.
  const bulkItems = useMemo(() => {
    const text = bulkText.trim()
    if (!text) return [] as string[]
    let blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
    if (blocks.length <= 1) {
      blocks = text.split(/\n/).map((b) => b.trim()).filter(Boolean)
    }
    return blocks.slice(0, MAX_BULK)
  }, [bulkText])

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

  const generateBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bulkLoading || bulkItems.length === 0) return
    setBulkLoading(true)
    setBulkError('')
    setBulkResults([])
    setLeadSent(false)
    try {
      const reviews = bulkItems.map((text, i) => ({ reviewText: text, rating: bulkRatings[i] ?? 5 }))
      const res = await fetch('/api/free-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, tone, reviews }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not generate replies.')
      setBulkResults(data.replies || [])
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Could not generate replies.')
    } finally {
      setBulkLoading(false)
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

  const copyBulkOne = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1500)
    } catch {
      /* ignore */
    }
  }

  const copyBulkAll = async () => {
    try {
      const all = bulkResults
        .filter((r) => r.reply)
        .map((r, i) => `Review ${i + 1}: ${r.reviewText}\nReply: ${r.reply}`)
        .join('\n\n———\n\n')
      await navigator.clipboard.writeText(all)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1500)
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
          message: `This person tried the free reply tool${businessName ? ` for "${businessName}"` : ''} and wants to do it for all their reviews automatically. Follow up!`,
        }),
      })
      setLeadSent(true)
    } catch {
      setLeadSent(true) // don't block the visitor on a delivery hiccup
    } finally {
      setLeadSending(false)
    }
  }

  const hasResults = reply || bulkResults.length > 0

  const LeadBox = (
    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
      {leadSent ? (
        <div className="text-center py-2">
          <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-white font-medium">Thank you! We&apos;ll reach out shortly.</p>
        </div>
      ) : (
        <>
          <p className="text-white font-semibold mb-1">Tired of doing this by hand every week?</p>
          <p className="text-white/60 text-sm mb-3">
            Connect your Google &amp; Facebook once and we&apos;ll draft a reply for every new review
            automatically — you just approve and post. Leave your email and we&apos;ll set you up.
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
              {leadSending ? 'Sending...' : 'Set me up'}
            </button>
          </form>
        </>
      )}
    </div>
  )

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
            Reply to all your reviews in one click
          </h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Paste one review or your whole backlog. Get professional, personalized replies in
            seconds — instead of writing each one by hand. Stay responsive, win more customers.
          </p>
        </motion.div>

        {/* Mode tabs */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'single' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> Single review
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'bulk' ? 'bg-primary text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" /> Bulk (up to {MAX_BULK})
            </button>
          </div>
        </div>

        {/* ── SINGLE FORM ──────────────────────────────────────────────────── */}
        {mode === 'single' && (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
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
        )}

        {/* ── BULK FORM ────────────────────────────────────────────────────── */}
        {mode === 'bulk' && (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={generateBulk}
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

            <div>
              <label className="block text-white/80 text-sm mb-1.5">
                Paste your reviews — one per line, or separate each with a blank line *
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
                rows={7}
                placeholder={`Great food, fast service!\n\nWaited 40 minutes and the order was cold.\n\nLove this place, staff is so friendly.`}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-white/40 text-xs mt-1.5">
                {bulkItems.length > 0
                  ? `${bulkItems.length} review${bulkItems.length > 1 ? 's' : ''} detected${
                      bulkItems.length >= MAX_BULK ? ` (max ${MAX_BULK} per batch)` : ''
                    } · set the star rating for each below`
                  : `Add up to ${MAX_BULK} reviews per batch.`}
              </p>
            </div>

            {/* Per-review rating selectors */}
            {bulkItems.length > 0 && (
              <div className="space-y-2">
                {bulkItems.map((text, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <span className="text-white/40 text-xs mt-1 w-5 shrink-0">{i + 1}.</span>
                    <p className="flex-1 text-white/70 text-sm line-clamp-2">{text}</p>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBulkRatings((prev) => ({ ...prev, [i]: s }))}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              s <= (bulkRatings[i] ?? 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {bulkError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {bulkError}
              </div>
            )}

            <button
              type="submit"
              disabled={bulkLoading || bulkItems.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 disabled:opacity-50"
            >
              {bulkLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating {bulkItems.length} replies...</>
              ) : (
                <><Layers className="w-5 h-5" /> Generate all {bulkItems.length > 0 ? bulkItems.length : ''} replies</>
              )}
            </button>
          </motion.form>
        )}

        {/* ── SINGLE RESULT ────────────────────────────────────────────────── */}
        {mode === 'single' && reply && (
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
            {LeadBox}
          </motion.div>
        )}

        {/* ── BULK RESULTS ─────────────────────────────────────────────────── */}
        {mode === 'bulk' && bulkResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border border-emerald-500/30 rounded-2xl p-5 sm:p-6 mt-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> {bulkResults.filter((r) => r.reply).length} replies ready
              </h3>
              <button
                onClick={copyBulkAll}
                className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
              >
                {copiedAll ? <><Check className="w-4 h-4 text-emerald-400" /> Copied all</> : <><Copy className="w-4 h-4" /> Copy all</>}
              </button>
            </div>

            <div className="space-y-4">
              {bulkResults.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white/40 text-xs">Review {i + 1}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/50 text-sm italic mb-2 line-clamp-2">&ldquo;{r.reviewText}&rdquo;</p>
                  {r.error ? (
                    <p className="text-red-300 text-sm">{r.error}</p>
                  ) : (
                    <>
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-sm">{r.reply}</p>
                      <button
                        onClick={() => copyBulkOne(i, r.reply)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
                      >
                        {copiedIdx === i ? (
                          <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy reply</>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {LeadBox}
          </motion.div>
        )}

        {/* Sign-up CTA */}
        {!hasResults && (
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
        )}
      </div>
    </div>
  )
}
