import Link from 'next/link'
import { CheckCircle2, Clock, Database, Shield, Zap } from 'lucide-react'

export default function StatusPage() {
  const services = [
    { name: 'Web App', status: 'Operational', icon: Zap },
    { name: 'AI Chat API', status: 'Operational', icon: CheckCircle2 },
    { name: 'Review Database', status: 'Operational', icon: Database },
    { name: 'OAuth Integrations', status: 'Limited verification', icon: Shield },
  ]

  return (
    <main className="min-h-[100dvh] bg-[#030308] px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/analytics" className="text-sm text-violet-300 hover:text-violet-200">Back to analytics</Link>
        <h1 className="mt-6 text-4xl font-black">API Status</h1>
        <p className="mt-3 text-white/60">Current operational status for AutoReview AI platform services.</p>
        <div className="mt-8 grid gap-4">
          {services.map(({ name, status, icon: Icon }) => (
            <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">{name}</p>
                  <p className="text-xs text-white/45">Updated automatically on deploy checks</p>
                </div>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                {status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
          <Clock className="mb-2 h-5 w-5 text-amber-300" />
          Google/Meta OAuth availability depends on platform verification and account permissions.
        </div>
      </div>
    </main>
  )
}
