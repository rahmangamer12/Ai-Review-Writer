'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, Bot, AlertTriangle, Mail, Play, Loader2, CheckCircle2,
  ArrowUpRight, ShieldCheck, Clock,
} from 'lucide-react'

interface RunResult {
  ok: boolean
  message: string
  items?: { title: string; sub?: string }[]
}

export default function AgenticPage() {
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, RunResult>>({})

  async function run(key: string, url: string) {
    setRunning(key)
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json().catch(() => null)

      if (res.status === 403) {
        setResults((r) => ({ ...r, [key]: { ok: false, message: data?.error || 'This agent requires the Growth or Business plan.' } }))
        return
      }
      if (res.status === 402) {
        setResults((r) => ({ ...r, [key]: { ok: false, message: data?.error || 'Not enough credits for this run.' } }))
        return
      }
      if (!res.ok || !data?.success) {
        setResults((r) => ({ ...r, [key]: { ok: false, message: data?.error || 'Run failed. Please try again.' } }))
        return
      }

      if (key === 'autoreply') {
        const items = (data.reviews || []).map((rv: any) => ({
          title: `${rv.author_name || 'Customer'} · ${rv.rating}★`,
          sub: rv.ai_reply ? rv.ai_reply.slice(0, 120) + '…' : undefined,
        }))
        setResults((r) => ({ ...r, [key]: { ok: true, message: `Drafted ${data.processed} repl${data.processed === 1 ? 'y' : 'ies'} (saved as drafts for your approval).`, items } }))
      } else if (key === 'triage') {
        const items = (data.alerts || []).map((a: any) => ({
          title: `${a.authorName || 'Customer'} · ${a.rating}★ · ${a.urgency}`,
          sub: a.suggestedAction,
        }))
        setResults((r) => ({ ...r, [key]: { ok: true, message: data.triaged ? `${data.triaged} urgent review(s) flagged.` : 'No urgent reviews right now. 🎉', items } }))
      }
    } catch {
      setResults((r) => ({ ...r, [key]: { ok: false, message: 'Network error. Please try again.' } }))
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#030308] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold text-fuchsia-200">
            <Sparkles className="h-3.5 w-3.5" /> Agentic AI
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Run your AI agents</h1>
          <p className="mt-1 max-w-2xl text-white/50">
            Let AI work through your reviews automatically. Drafts are always saved for your approval — nothing is posted publicly without you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Auto-Reply Agent */}
          <AgentCard
            icon={Bot}
            tint="text-violet-300"
            glow="from-violet-500/20"
            title="Auto-Reply Agent"
            desc="Reads pending reviews, detects sentiment, and drafts a reply in your brand tone — saved as drafts for approval. Max 5 per run."
            badge="Growth / Business"
            running={running === 'autoreply'}
            result={results.autoreply}
            onRun={() => run('autoreply', '/api/agentic/reviews')}
          />

          {/* Triage Agent */}
          <AgentCard
            icon={AlertTriangle}
            tint="text-amber-300"
            glow="from-amber-500/20"
            title="Triage / Damage Control"
            desc="Scans for urgent 1–2★ reviews and flags them with a suggested action so you can respond before the problem grows."
            badge="Growth / Business"
            running={running === 'triage'}
            result={results.triage}
            onRun={() => run('triage', '/api/agentic/triage')}
          />

          {/* Weekly Insights (scheduled) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Mail className="h-5 w-5 text-cyan-300" />
            </div>
            <h3 className="mb-1 text-lg font-bold">Weekly Insight Email</h3>
            <p className="text-sm leading-relaxed text-white/50">
              Every Monday, AI summarizes your week's reviews (trends, sentiment, one suggestion) and emails it to you. Runs automatically.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
              <Clock className="h-3.5 w-3.5" /> Scheduled · Mondays 09:00 UTC
            </div>
          </div>

          {/* Guardrails note */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.04] p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <h3 className="mb-1 text-lg font-bold">Human approval, always</h3>
            <ul className="space-y-1.5 text-sm text-white/55">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> AI replies save as drafts — never auto-posted publicly.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Every action is logged in your credit history.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Max actions per run keep credit use predictable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgentCard({
  icon: Icon, tint, glow, title, desc, badge, running, result, onRun,
}: {
  icon: any; tint: string; glow: string; title: string; desc: string; badge: string
  running: boolean; result?: RunResult; onRun: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-6">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100`} />
      <div className="relative mb-4 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className={`h-5 w-5 ${tint}`} />
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40">{badge}</span>
      </div>
      <h3 className="relative mb-1 text-lg font-bold">{title}</h3>
      <p className="relative text-sm leading-relaxed text-white/50">{desc}</p>

      <button
        onClick={onRun}
        disabled={running}
        className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
      >
        {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run now</>}
      </button>

      {result && (
        <div className={`relative mt-4 rounded-xl border p-3 text-sm ${result.ok ? 'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100' : 'border-amber-400/20 bg-amber-500/[0.06] text-amber-100'}`}>
          <p className="font-medium">{result.message}</p>
          {!result.ok && (result.message.toLowerCase().includes('plan') || result.message.toLowerCase().includes('upgrade')) && (
            <Link href="/subscription" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-white underline-offset-2 hover:underline">
              Upgrade plan <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
          {result.items && result.items.length > 0 && (
            <ul className="mt-2 space-y-2">
              {result.items.map((it, i) => (
                <li key={i} className="rounded-lg bg-black/20 p-2">
                  <p className="font-semibold text-white/90">{it.title}</p>
                  {it.sub && <p className="mt-0.5 text-xs text-white/50">{it.sub}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
