'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, AlertTriangle, Mail, Play, Loader2, CheckCircle2,
  ArrowUpRight, ShieldCheck, Clock, Cpu, Activity, Inbox, Gauge,
  Lock, Terminal, Zap, Brain, PenLine, Save, Crown, ChevronRight,
  CircleDot, XCircle, Radio,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────── */

type AgentKey = 'autoreply' | 'triage'
type StageState = 'idle' | 'active' | 'done' | 'error'

interface LogLine {
  id: number
  ts: string
  text: string
  kind: 'info' | 'think' | 'action' | 'success' | 'warn' | 'error'
}

interface DraftItem {
  title: string
  sentiment?: string
  reply?: string
  rating: number
}

interface AlertItem {
  title: string
  urgency: string
  action?: string
  rating: number
}

interface RunOutcome {
  ok: boolean
  message: string
  drafts?: DraftItem[]
  alerts?: AlertItem[]
  upgrade?: boolean
}

interface Stats {
  pending: number
  processedToday: number
  credits: number
  plan: string
}

/* ──────────────────────────────────────────────────────────────────────────
   Pipeline definitions — each step mirrors a REAL backend action.
   ──────────────────────────────────────────────────────────────────────── */

const PIPELINES: Record<AgentKey, { stage: number; text: string; kind: LogLine['kind']; ms: number }[]> = {
  autoreply: [
    { stage: 0, text: 'Authenticating session · verifying Growth/Business access', kind: 'info', ms: 420 },
    { stage: 1, text: 'Scanning review queue for pending items (max 5 / run)', kind: 'action', ms: 620 },
    { stage: 2, text: 'Running sentiment analysis via LongCat AI…', kind: 'think', ms: 780 },
    { stage: 2, text: 'Classifying tone, intent and escalation risk per review', kind: 'think', ms: 560 },
    { stage: 3, text: 'Drafting brand-tone replies grounded in review text', kind: 'action', ms: 820 },
    { stage: 4, text: 'Deducting credits atomically · writing audit trail', kind: 'action', ms: 520 },
    { stage: 5, text: 'Saving as drafts — held for your approval (never auto-posted)', kind: 'success', ms: 480 },
  ],
  triage: [
    { stage: 0, text: 'Authenticating session · verifying plan access', kind: 'info', ms: 420 },
    { stage: 1, text: 'Scanning for unanswered 1–2★ reviews (last 20)', kind: 'action', ms: 640 },
    { stage: 2, text: 'Scoring urgency · matching risk keywords (scam, refund, lawyer…)', kind: 'think', ms: 760 },
    { stage: 3, text: 'Generating recommended damage-control actions', kind: 'action', ms: 700 },
    { stage: 4, text: 'Flagging critical reviews · deducting 1 credit', kind: 'action', ms: 480 },
    { stage: 5, text: 'Triage complete — alerts ready for review', kind: 'success', ms: 420 },
  ],
}

const STAGES = [
  { key: 'auth', label: 'Auth', icon: ShieldCheck },
  { key: 'ingest', label: 'Ingest', icon: Inbox },
  { key: 'analyze', label: 'Analyze', icon: Brain },
  { key: 'draft', label: 'Decide', icon: PenLine },
  { key: 'ledger', label: 'Ledger', icon: Save },
  { key: 'guard', label: 'Guardrail', icon: ShieldCheck },
] as const

const ELIGIBLE = ['growth', 'business']

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────────────── */

export default function AgenticPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [running, setRunning] = useState<AgentKey | null>(null)
  const [activeStage, setActiveStage] = useState<number>(-1)
  const [stageStates, setStageStates] = useState<StageState[]>(Array(STAGES.length).fill('idle'))
  const [log, setLog] = useState<LogLine[]>([])
  const [outcome, setOutcome] = useState<Record<AgentKey, RunOutcome | undefined>>({ autoreply: undefined, triage: undefined })
  const [lastRun, setLastRun] = useState<AgentKey | null>(null)
  const [automation, setAutomation] = useState<{ agentAutoReply: boolean; agentTriageAlerts: boolean } | null>(null)
  const [savingAuto, setSavingAuto] = useState<string | null>(null)

  const logIdRef = useRef(0)
  const consoleRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef(false)

  // null = still loading plan; avoids flashing "Run agent" before we know the plan.
  const eligible: boolean | null = stats ? ELIGIBLE.includes(stats.plan.toLowerCase()) : null

  /* ── Load real status ── */
  const loadStats = useCallback(async () => {
    try {
      const [a, u] = await Promise.all([
        fetch('/api/agentic/reviews', { method: 'GET' }).then((r) => r.json()).catch(() => ({})),
        fetch('/api/user/me', { method: 'GET' }).then((r) => r.json()).catch(() => ({})),
      ])
      setStats({
        pending: a?.pending ?? 0,
        processedToday: a?.processedToday ?? 0,
        credits: u?.aiCredits ?? a?.credits ?? 0,
        plan: (u?.planType || 'free') as string,
      })
    } catch {
      setStats({ pending: 0, processedToday: 0, credits: 0, plan: 'free' })
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  /* ── Load automation settings ── */
  const loadSettings = useCallback(async () => {
    try {
      const s = await fetch('/api/agentic/settings', { method: 'GET' }).then((r) => r.json()).catch(() => null)
      if (s && !s.error) setAutomation({ agentAutoReply: !!s.agentAutoReply, agentTriageAlerts: s.agentTriageAlerts !== false })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  async function toggleAutomation(key: 'agentAutoReply' | 'agentTriageAlerts', value: boolean) {
    if (savingAuto) return
    setSavingAuto(key)
    // optimistic
    setAutomation((a) => ({ agentAutoReply: a?.agentAutoReply ?? false, agentTriageAlerts: a?.agentTriageAlerts ?? true, [key]: value }))
    try {
      const res = await fetch('/api/agentic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        // revert on failure
        setAutomation((a) => ({ agentAutoReply: a?.agentAutoReply ?? false, agentTriageAlerts: a?.agentTriageAlerts ?? true, [key]: !value }))
      } else {
        setAutomation({ agentAutoReply: !!data.agentAutoReply, agentTriageAlerts: data.agentTriageAlerts !== false })
      }
    } catch {
      setAutomation((a) => ({ agentAutoReply: a?.agentAutoReply ?? false, agentTriageAlerts: a?.agentTriageAlerts ?? true, [key]: !value }))
    } finally {
      setSavingAuto(null)
    }
  }

  /* ── Auto-scroll console ── */
  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight
  }, [log])

  function pushLog(text: string, kind: LogLine['kind']) {
    const d = new Date()
    const ts = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    setLog((l) => [...l, { id: logIdRef.current++, ts, text, kind }])
  }

  const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

  /* ── Run an agent: animate the real pipeline while the request is in flight ── */
  async function run(agent: AgentKey, url: string) {
    if (running) return
    cancelRef.current = false
    setRunning(agent)
    setLastRun(agent)
    setActiveStage(0)
    setStageStates(Array(STAGES.length).fill('idle'))
    setLog([])
    setOutcome((o) => ({ ...o, [agent]: undefined }))

    pushLog(`▸ Booting ${agent === 'autoreply' ? 'Auto-Reply' : 'Triage'} agent…`, 'info')

    // Fire the real request immediately, animate steps in parallel.
    const reqPromise = fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then(async (res) => ({ status: res.status, data: await res.json().catch(() => null) }))
      .catch(() => ({ status: 0, data: null }))

    const steps = PIPELINES[agent]
    for (let i = 0; i < steps.length; i++) {
      if (cancelRef.current) break
      const s = steps[i]
      setActiveStage(s.stage)
      setStageStates((prev) => {
        const next = [...prev]
        for (let k = 0; k < s.stage; k++) if (next[k] !== 'error') next[k] = 'done'
        next[s.stage] = 'active'
        return next
      })
      pushLog(s.text, s.kind)
      await sleep(s.ms)
    }

    const { status, data } = await reqPromise

    // Reconcile animation with the real result.
    if (status === 401) {
      failPipeline('Session expired — please sign in again.', false)
    } else if (status === 403) {
      failPipeline(data?.error || 'This agent needs the Growth or Business plan.', true)
    } else if (status === 402) {
      failPipeline(data?.error || 'Not enough credits for this run.', true)
    } else if (status === 503) {
      failPipeline(data?.error || 'AI provider is not configured right now.', false)
    } else if (status === 0 || !data || (!data.success && status >= 400)) {
      failPipeline(data?.error || 'Run failed. Please try again.', false)
    } else {
      completePipeline(agent, data)
    }

    setRunning(null)
    loadStats()
  }

  function failPipeline(message: string, upgrade: boolean) {
    setStageStates((prev) => {
      const next = [...prev]
      const idx = next.findIndex((s) => s === 'active')
      if (idx >= 0) next[idx] = 'error'
      return next
    })
    setActiveStage(-1)
    pushLog(`✖ ${message}`, 'error')
    setOutcome((o) => ({ ...o, [lastRun || 'autoreply']: { ok: false, message, upgrade } }))
  }

  function completePipeline(agent: AgentKey, data: any) {
    setStageStates(Array(STAGES.length).fill('done'))
    setActiveStage(-1)

    if (agent === 'autoreply') {
      const drafts: DraftItem[] = (data.reviews || []).map((rv: any) => ({
        title: `${rv.author_name || 'Customer'}`,
        rating: rv.rating,
        sentiment: rv.sentiment_label,
        reply: rv.ai_reply,
      }))
      const msg = data.processed
        ? `Drafted ${data.processed} repl${data.processed === 1 ? 'y' : 'ies'} — saved for your approval.`
        : 'No pending reviews to process right now.'
      pushLog(`✔ ${msg}`, 'success')
      setOutcome((o) => ({ ...o, autoreply: { ok: true, message: msg, drafts } }))
    } else {
      const alerts: AlertItem[] = (data.alerts || []).map((a: any) => ({
        title: `${a.authorName || 'Customer'}`,
        rating: a.rating,
        urgency: a.urgency,
        action: a.suggestedAction,
      }))
      const msg = data.triaged ? `${data.triaged} urgent review${data.triaged === 1 ? '' : 's'} flagged for action.` : 'No urgent reviews right now — you’re clear.'
      pushLog(`✔ ${msg}`, 'success')
      setOutcome((o) => ({ ...o, triage: { ok: true, message: msg, alerts } }))
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#030308] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* ── Header ── */}
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0c0c1a] to-[#070710] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-[90px]" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-600/10 blur-[80px]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold text-fuchsia-200">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Agent Command Center
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
                Autonomous review agents
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">
                Orchestrate AI agents that read, reason over, and act on your reviews — sentiment, drafting,
                triage and ledgering run as one pipeline. Every action is logged and held for your approval.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5">
              <span className={`relative flex h-2.5 w-2.5 ${running ? '' : ''}`}>
                <span className={`absolute inline-flex h-full w-full rounded-full ${running ? 'animate-ping bg-emerald-400' : 'bg-emerald-500'} opacity-75`} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-semibold text-white/70">{running ? 'Agent running' : 'Systems nominal'}</span>
            </div>
          </div>
        </div>

        {/* ── Real stats strip ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Inbox} label="Pending reviews" value={stats ? String(stats.pending) : '—'} tint="text-cyan-300" />
          <StatCard icon={Activity} label="Drafted today" value={stats ? String(stats.processedToday) : '—'} tint="text-violet-300" />
          <StatCard icon={Gauge} label="LongCat credits" value={stats ? String(stats.credits) : '—'} tint="text-emerald-300" />
          <StatCard icon={Crown} label="Plan" value={stats ? cap(stats.plan) : '—'} tint="text-amber-300" />
        </div>

        {/* ── Pipeline graph ── */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Cpu className="h-4 w-4 text-fuchsia-300" /> Agent pipeline
            </div>
            <span className="text-[11px] font-medium text-white/35">Live orchestration graph</span>
          </div>
          <div className="flex items-stretch gap-1 overflow-x-auto pb-1 sm:gap-2">
            {STAGES.map((st, i) => {
              const state = stageStates[i]
              return (
                <div key={st.key} className="flex min-w-0 flex-1 items-center">
                  <PipelineNode icon={st.icon} label={st.label} state={state} active={activeStage === i} />
                  {i < STAGES.length - 1 && <Connector active={stageStates[i] === 'done' || (activeStage > i)} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Agent launchers ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AgentCard
            icon={Bot}
            tint="text-violet-300"
            glow="from-violet-500/25"
            title="Auto-Reply Agent"
            tagline="Reads → analyses sentiment → drafts brand-tone replies"
            desc="Processes up to 5 pending reviews per run. Replies are saved as drafts for your approval — never posted publicly."
            eligible={eligible}
            running={running === 'autoreply'}
            disabled={!!running}
            onRun={() => run('autoreply', '/api/agentic/reviews')}
          />
          <AgentCard
            icon={AlertTriangle}
            tint="text-amber-300"
            glow="from-amber-500/25"
            title="Triage / Damage Control"
            tagline="Detects 1–2★ → scores urgency → suggests action"
            desc="Scans for urgent low-star reviews, flags critical ones, and recommends a response before reputation damage spreads."
            eligible={eligible}
            running={running === 'triage'}
            disabled={!!running}
            onRun={() => run('triage', '/api/agentic/triage')}
          />
        </div>

        {/* ── Live execution console ── */}
        <AnimatePresence>
          {(running || log.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              className="mt-6 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#06060d]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/40 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
                  <Terminal className="h-4 w-4 text-emerald-300" /> Execution console
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                </div>
              </div>
              <div ref={consoleRef} className="max-h-72 overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
                {log.map((l) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span className="shrink-0 text-white/25">{l.ts}</span>
                    <span className={logColor(l.kind)}>{l.text}</span>
                  </motion.div>
                ))}
                {running && (
                  <div className="mt-1 flex items-center gap-2 text-white/40">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="animate-pulse">agent thinking…</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        {lastRun && outcome[lastRun] && (
          <ResultPanel agent={lastRun} outcome={outcome[lastRun]!} />
        )}

        {/* ── Automation ── */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
              <Cpu className="h-4 w-4 text-fuchsia-300" /> Automation
            </div>
            <span className="text-[11px] font-medium text-white/35">Agents run on a schedule — drafts only, you approve</span>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AutomationRow
              icon={Bot}
              tint="text-violet-300"
              title="Auto-Reply automation"
              desc="Every few hours, draft replies for new pending reviews. Saved as drafts for your approval."
              badge={eligible === false ? 'Growth / Business' : undefined}
              on={automation?.agentAutoReply ?? false}
              disabled={!eligible || savingAuto === 'agentAutoReply'}
              saving={savingAuto === 'agentAutoReply'}
              onToggle={(v) => toggleAutomation('agentAutoReply', v)}
            />
            <AutomationRow
              icon={AlertTriangle}
              tint="text-amber-300"
              title="Triage alerts"
              desc="Get notified when urgent 1–2★ reviews appear so you can respond fast. On by default."
              on={automation?.agentTriageAlerts ?? true}
              disabled={savingAuto === 'agentTriageAlerts'}
              saving={savingAuto === 'agentTriageAlerts'}
              onToggle={(v) => toggleAutomation('agentTriageAlerts', v)}
            />
          </div>
        </div>

        {/* ── Footer: scheduled + guardrails ── */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Mail className="h-5 w-5 text-cyan-300" />
            </div>
            <h3 className="mb-1 text-lg font-bold">Weekly Insight Email</h3>
            <p className="text-sm leading-relaxed text-white/50">
              Every Monday an agent summarizes your week — trends, sentiment shift, and one concrete suggestion —
              and emails it to you automatically.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
              <Clock className="h-3.5 w-3.5" /> Scheduled · Mondays 09:00 UTC
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.04] p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <h3 className="mb-1 text-lg font-bold">Guardrails — human in the loop</h3>
            <ul className="space-y-1.5 text-sm text-white/55">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Replies save as drafts — never auto-posted publicly.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Every action is written to your credit + audit history.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> Per-run caps keep credit spend predictable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0b0b16] p-4">
      <div className="mb-2 flex items-center justify-between">
        <Icon className={`h-4 w-4 ${tint}`} />
      </div>
      <div className="text-2xl font-black tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-white/35">{label}</div>
    </div>
  )
}

function PipelineNode({ icon: Icon, label, state, active }: { icon: any; label: string; state: StageState; active: boolean }) {
  const ring =
    state === 'error' ? 'border-rose-400/50 bg-rose-500/10 text-rose-300'
      : state === 'done' ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
        : active ? 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200'
          : 'border-white/10 bg-white/[0.03] text-white/40'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={active ? { repeat: Infinity, duration: 1.1 } : {}}
        className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border ${ring}`}
      >
        {state === 'done' ? <CheckCircle2 className="h-5 w-5" />
          : state === 'error' ? <XCircle className="h-5 w-5" />
            : active ? <CircleDot className="h-5 w-5" />
              : <Icon className="h-5 w-5" />}
        {active && <span className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-fuchsia-500/20" />}
      </motion.div>
      <span className={`text-[10px] font-semibold ${state === 'idle' ? 'text-white/35' : 'text-white/70'}`}>{label}</span>
    </div>
  )
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="relative mx-1 h-[2px] flex-1 self-center overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-violet-400 to-emerald-400"
        initial={{ x: '-100%' }}
        animate={active ? { x: '0%' } : { x: '-100%' }}
        transition={{ duration: 0.6 }}
      />
    </div>
  )
}

function AgentCard({
  icon: Icon, tint, glow, title, tagline, desc, eligible, running, disabled, onRun,
}: {
  icon: any; tint: string; glow: string; title: string; tagline: string; desc: string
  eligible: boolean | null; running: boolean; disabled: boolean; onRun: () => void
}) {
  const loading = eligible === null
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0b0b16] p-6">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100`} />
      <div className="relative mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Icon className={`h-6 w-6 ${tint}`} />
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/40">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking
          </span>
        ) : eligible ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
            <Zap className="h-3 w-3" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
            <Lock className="h-3 w-3" /> Growth / Business
          </span>
        )}
      </div>
      <h3 className="relative mb-1 text-lg font-bold">{title}</h3>
      <p className={`relative mb-2 text-xs font-semibold ${tint}`}>{tagline}</p>
      <p className="relative text-sm leading-relaxed text-white/50">{desc}</p>

      {loading ? (
        <div className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking plan…
        </div>
      ) : eligible ? (
        <button
          onClick={onRun}
          disabled={disabled}
          className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</> : <><Play className="h-4 w-4" /> Run agent</>}
        </button>
      ) : (
        <Link
          href="/subscription"
          className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Crown className="h-4 w-4" /> Unlock agent <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

function AutomationRow({
  icon: Icon, tint, title, desc, badge, on, disabled, saving, onToggle,
}: {
  icon: any; tint: string; title: string; desc: string; badge?: string
  on: boolean; disabled: boolean; saving: boolean; onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Icon className={`h-5 w-5 ${tint}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          {badge && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
              <Lock className="h-2.5 w-2.5" /> {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-white/45">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onToggle(!on)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-emerald-500' : 'bg-white/15'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'} ${saving ? 'animate-pulse' : ''}`} />
      </button>
    </div>
  )
}

function ResultPanel({ agent, outcome }: { agent: AgentKey; outcome: RunOutcome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-6 overflow-hidden rounded-3xl border p-5 sm:p-6 ${outcome.ok ? 'border-emerald-400/20 bg-emerald-500/[0.04]' : 'border-amber-400/25 bg-amber-500/[0.05]'}`}
    >
      <div className="mb-3 flex items-center gap-2">
        {outcome.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 text-amber-400" />}
        <p className={`font-semibold ${outcome.ok ? 'text-emerald-100' : 'text-amber-100'}`}>{outcome.message}</p>
      </div>

      {outcome.upgrade && (
        <Link href="/subscription" className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:scale-[1.02]">
          Upgrade plan <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}

      {agent === 'autoreply' && outcome.drafts && outcome.drafts.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {outcome.drafts.map((d, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white/90">{d.title}</span>
                <span className="text-amber-300">{'★'.repeat(d.rating)}<span className="text-white/20">{'★'.repeat(Math.max(0, 5 - d.rating))}</span></span>
                {d.sentiment && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${sentimentTint(d.sentiment)}`}>{d.sentiment}</span>}
              </div>
              {d.reply && <p className="text-sm leading-relaxed text-white/60">{d.reply}</p>}
            </div>
          ))}
          <Link href="/reviews" className="inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white">
            Review &amp; approve drafts <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {agent === 'triage' && outcome.alerts && outcome.alerts.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {outcome.alerts.map((a, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white/90">{a.title}</span>
                <span className="text-amber-300">{'★'.repeat(a.rating)}<span className="text-white/20">{'★'.repeat(Math.max(0, 5 - a.rating))}</span></span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${urgencyTint(a.urgency)}`}>{a.urgency}</span>
              </div>
              {a.action && <p className="text-sm leading-relaxed text-white/60"><span className="text-white/40">Suggested:</span> {a.action}</p>}
            </div>
          ))}
          <Link href="/reviews" className="inline-flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white">
            Open reviews <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}

/* ── helpers ── */

function logColor(kind: LogLine['kind']) {
  switch (kind) {
    case 'success': return 'text-emerald-300'
    case 'error': return 'text-rose-300'
    case 'warn': return 'text-amber-300'
    case 'think': return 'text-fuchsia-200/90'
    case 'action': return 'text-cyan-200/90'
    default: return 'text-white/55'
  }
}

function sentimentTint(s: string) {
  const v = s.toLowerCase()
  if (v === 'positive') return 'bg-emerald-500/15 text-emerald-300'
  if (v === 'negative') return 'bg-rose-500/15 text-rose-300'
  return 'bg-white/10 text-white/50'
}

function urgencyTint(u: string) {
  const v = u.toLowerCase()
  if (v === 'critical') return 'bg-rose-500/15 text-rose-300'
  if (v === 'high') return 'bg-amber-500/15 text-amber-300'
  return 'bg-white/10 text-white/50'
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
