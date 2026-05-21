import Link from 'next/link'
import { ArrowRight, BarChart3, CheckCircle2, MessageSquare, Shield, Star, Zap } from 'lucide-react'

type IndustryLandingPageProps = {
  industry: string
  audience: string
  pain: string
  outcome: string
  examples: string[]
  slug: string
}

const relatedPages = [
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/clinics', label: 'Clinics' },
  { href: '/salons', label: 'Salons' },
  { href: '/repair-shops', label: 'Repair Shops' },
]

export default function IndustryLandingPage({
  industry,
  audience,
  pain,
  outcome,
  examples,
  slug,
}: IndustryLandingPageProps) {
  return (
    <main className="min-h-screen bg-[#030308] text-white">
      <section className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8 lg:pt-44">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/75">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          AI review management for {audience}
        </div>

        <h1 className="max-w-5xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
          Turn {industry} reviews into
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            faster replies and better trust
          </span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/60 sm:text-xl">
          {pain} Ai Review Writer gives {audience} one place to track reviews, understand sentiment, and draft replies before reputation damage grows.
        </p>

        <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/subscription"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-black transition-transform hover:scale-105 sm:w-auto"
          >
            Start Free
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/connect-platforms"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-medium text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            Connect Reviews
          </Link>
        </div>

        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            'AI drafts stay editable',
            'Built for Google review workflows',
            'No fake demo activity required',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#070710] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: 'Reply without guessing',
              text: `Generate professional drafts for positive, neutral, and angry ${industry.toLowerCase()} reviews.`,
            },
            {
              icon: BarChart3,
              title: 'See what needs attention',
              text: 'Track sentiment, pending replies, rating trends, and unresolved customer issues.',
            },
            {
              icon: Shield,
              title: 'Keep owner control',
              text: 'Review, edit, approve, reject, or delete AI replies before using them publicly.',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <feature.icon className="h-6 w-6 text-cyan-300" />
              </div>
              <h2 className="mb-3 text-xl font-bold">{feature.title}</h2>
              <p className="leading-relaxed text-white/55">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">
              <Zap className="h-4 w-4" />
              Practical workflow
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">What {audience} can use it for</h2>
            <p className="mt-4 leading-relaxed text-white/55">{outcome}</p>
          </div>

          <div className="grid gap-3">
            {examples.map((example) => (
              <div key={example} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-white/70">{example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 text-center sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#0c0c18] p-10 shadow-2xl sm:p-14">
          <h2 className="text-3xl font-extrabold sm:text-5xl">Make review replies a daily habit</h2>
          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            Start with your real reviews, draft safer replies with AI, and keep every customer response organized.
          </p>
          <Link
            href="/subscription"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-semibold text-black transition-transform hover:scale-105"
          >
            Try Ai Review Writer
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-white/45">
          {relatedPages
            .filter((page) => page.href !== `/${slug}`)
            .map((page) => (
              <Link key={page.href} href={page.href} className="rounded-full border border-white/10 px-4 py-2 hover:text-white">
                {page.label}
              </Link>
            ))}
        </div>
      </section>
    </main>
  )
}
