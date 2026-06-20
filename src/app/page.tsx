import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  ArrowRight, CheckCircle2, Star, Zap, Shield, BarChart3,
  MessageSquare, Mail, Sparkles, Bot, Clock,
} from 'lucide-react'

// Note: Next.js Server Component
export const metadata = {
  title: 'Ai Review Writer | AI Review Management for Local Service Businesses',
  description: 'Ai Review Writer helps restaurants, clinics, salons, repair shops, and local service teams manage, analyze, and reply to customer reviews with AI.',
}

const FEATURES = [
  { icon: Zap, tint: 'text-amber-400', glow: 'from-amber-500/20', title: 'Review Reply Drafts', desc: 'Generate polite, brand-safe replies for happy, angry, and neutral customers without starting from a blank page.' },
  { icon: BarChart3, tint: 'text-cyan-400', glow: 'from-cyan-500/20', title: 'Sentiment Tracking', desc: 'Spot negative review patterns early so the owner or manager can fix the real service issue.' },
  { icon: MessageSquare, tint: 'text-pink-400', glow: 'from-pink-500/20', title: 'Platform Inbox', desc: 'Connect supported platforms or manually add real reviews while OAuth approvals are being completed.' },
  { icon: Shield, tint: 'text-emerald-400', glow: 'from-emerald-500/20', title: 'Human Approval', desc: 'Save AI replies as drafts first, then edit, approve, reject, or delete before using them publicly.' },
  { icon: Star, tint: 'text-violet-400', glow: 'from-violet-500/20', title: 'Manager Dashboard', desc: 'See response rate, review status, rating trends, and pending work without digging through spreadsheets.' },
  { icon: Mail, tint: 'text-blue-400', glow: 'from-blue-500/20', title: 'Damage Control Alerts', desc: 'Route urgent low-star reviews to the person who can respond before the problem gets worse.' },
]

const STEPS = [
  { icon: MessageSquare, title: 'Bring in reviews', desc: 'Connect a platform or add real customer reviews manually — everything lands in one owner-friendly inbox.' },
  { icon: Bot, title: 'AI drafts a reply', desc: 'Sentiment is detected and a reply is drafted in your tone. Negative cases are flagged for a human.' },
  { icon: CheckCircle2, title: 'You approve & post', desc: 'Edit, approve, or reject the draft. Nothing goes public without your sign-off.' },
]

export default async function LandingPage() {
  const { userId } = await auth()

  // If user is already signed in, go straight to dashboard
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white font-sans w-full max-w-[100vw] overflow-x-hidden selection:bg-violet-500/30">

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle ambient glow (kept light so it never clashes with the global background) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 left-1/2 h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[130px]" />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm backdrop-blur-md animate-fade-in-up">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            <span className="font-medium text-white/80">AI review management for local businesses</span>
          </div>

          <h1 className="animate-fade-in-up animation-delay-100 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Turn customer reviews into
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              repeat revenue, with AI
            </span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 mt-7 max-w-2xl text-lg leading-relaxed text-white/55 sm:text-xl">
            Track reviews, understand sentiment, and draft better replies from one simple workspace —
            built for restaurants, clinics, salons, repair shops, and local service teams.
          </p>

          <div className="animate-fade-in-up animation-delay-300 mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link href="/subscription" className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-semibold text-black shadow-[0_0_50px_-12px_rgba(255,255,255,0.4)] transition-transform hover:scale-[1.03] active:scale-95 sm:w-auto">
              Start managing reviews
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-medium text-white transition-colors hover:bg-white/10 active:scale-95 sm:w-auto">
              View the dashboard
            </Link>
          </div>

          <div className="animate-fade-in-up animation-delay-400 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/45">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Best for Google review workflows</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> AI drafts stay editable</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No credit card to start</span>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="animate-fade-in-up animation-delay-500 group relative mx-auto mt-20 w-full max-w-5xl">
          <div className="absolute -inset-px rounded-[34px] bg-gradient-to-b from-white/15 to-transparent" aria-hidden />
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0b16] p-2 shadow-2xl sm:p-4">
            <div className="mb-2 flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto h-6 w-full max-w-md rounded-full bg-white/5" />
            </div>
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.06] to-white/[0.01]">
              <div className="absolute inset-0 cyber-grid opacity-20" aria-hidden />
              <div className="z-10 text-center">
                <BarChart3 className="mx-auto mb-4 h-16 w-16 text-white/20" />
                <p className="font-medium text-white/40">Your local reputation command center</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 px-4 sm:px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-300/70">How it works</p>
            <h2 className="text-3xl font-bold sm:text-4xl">From new review to approved reply in three steps</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-8">
                  <span className="absolute right-6 top-6 text-5xl font-black text-white/5">{i + 1}</span>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Icon className="h-6 w-6 text-violet-300" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="leading-relaxed text-white/50">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Built around the local review workflow</h2>
            <p className="text-lg text-white/50">A focused reputation workspace for small teams that cannot afford to miss reviews.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className="group relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#0b0b16] p-8 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.03]">
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${f.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} aria-hidden />
                  <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-110">
                    <Icon className={`h-6 w-6 ${f.tint}`} />
                  </div>
                  <h3 className="relative mb-3 text-xl font-bold">{f.title}</h3>
                  <p className="relative leading-relaxed text-white/50">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Who it's for ───────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-[#05050A] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-10 text-sm font-semibold uppercase tracking-widest text-white/40">
            For restaurants, clinics, salons, repair shops, real estate offices &amp; local service teams
          </p>
          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {[
              { t: 'Capture every review', d: 'Keep Google reviews and manually entered feedback in one owner-friendly workspace.' },
              { t: 'Reply faster', d: 'Use AI to draft professional responses while your team focuses on serving customers.' },
              { t: 'Protect reputation', d: 'Track unresolved negative reviews and make reputation management a daily habit.' },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <h3 className="mb-2 font-bold">{x.t}</h3>
                <p className="text-sm leading-relaxed text-white/50">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Principles (honest, not fake testimonials) ─────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Designed for real review operations</h2>
            <p className="text-lg text-white/50">Built around how local teams actually work — not vanity dashboards.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Shield, name: 'Owner approval', role: 'Before public use', text: 'AI replies are saved as drafts inside your workspace so you can review, edit, approve, or delete them before using them publicly.' },
              { icon: BarChart3, name: 'Real review data', role: 'No fake activity', text: 'The dashboard shows saved platform reviews and manually entered customer reviews, not made-up activity.' },
              { icon: Clock, name: 'Daily workflow', role: 'One workspace', text: 'Manage review status, edit saved replies, remove reviews, and refresh analytics from the same authenticated account.' },
            ].map((c, i) => {
              const Icon = c.icon
              return (
                <div key={i} className="rounded-[24px] border border-white/[0.07] bg-gradient-to-b from-[#0c0c18] to-[#08080f] p-8">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5 text-violet-300" />
                  </div>
                  <p className="mb-8 text-lg leading-relaxed text-white/80">{c.text}</p>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-sm text-white/40">{c.role}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-violet-900/20 to-transparent" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[40px] border border-white/10 bg-[#0c0c18] p-10 text-center shadow-2xl sm:p-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[100px]" aria-hidden />
          <h2 className="relative text-3xl font-extrabold sm:text-5xl">Stop losing trust to unanswered reviews</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-lg text-white/60">
            Start with your real customer reviews, then use AI to respond faster, protect your rating, and keep every review under control.
          </p>
          <Link href="/subscription" className="relative mt-9 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-black shadow-[0_0_50px_-12px_rgba(255,255,255,0.4)] transition-transform hover:scale-[1.03] active:scale-95">
            Start free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#030308] px-4 sm:px-6 lg:px-8 pb-8 pt-16">
        <div className="mx-auto mb-16 grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600 shadow-lg shadow-violet-500/20">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Ai Review Writer
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/40">
              AI review management for local service businesses that need faster, safer customer replies.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/dashboard" className="transition-colors hover:text-white">Features</Link></li>
              <li><Link href="/subscription" className="transition-colors hover:text-white">Pricing</Link></li>
              <li><Link href="/extension" className="transition-colors hover:text-white">Chrome Extension</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Industries</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/restaurants" className="transition-colors hover:text-white">Restaurants</Link></li>
              <li><Link href="/clinics" className="transition-colors hover:text-white">Clinics</Link></li>
              <li><Link href="/salons" className="transition-colors hover:text-white">Salons</Link></li>
              <li><Link href="/repair-shops" className="transition-colors hover:text-white">Repair Shops</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><Link href="/contact" className="transition-colors hover:text-white">Contact Us</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-4 font-semibold text-white">Get started</h4>
            <p className="mb-3 text-sm text-white/40">Create your workspace and add your first review.</p>
            <Link href="/subscription" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-white/30 sm:flex-row">
          <p>© {new Date().getFullYear()} AutoReview AI. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
