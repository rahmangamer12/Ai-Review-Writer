import Link from 'next/link'
import { FileText, LockKeyhole, ShieldCheck } from 'lucide-react'

export default function CompliancePage() {
  return (
    <main className="min-h-[100dvh] bg-[#030308] px-4 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/analytics" className="text-sm text-violet-300 hover:text-violet-200">Back to analytics</Link>
        <h1 className="mt-6 text-4xl font-black">Compliance</h1>
        <p className="mt-3 text-white/60">Security, privacy, and platform compliance overview for AutoReview AI.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Data Protection', text: 'Sensitive credentials are handled server-side and protected by environment secrets.', icon: LockKeyhole },
            { title: 'OAuth Review', text: 'Google and Meta access depends on app verification and approved scopes.', icon: ShieldCheck },
            { title: 'Legal Docs', text: 'Privacy Policy and Terms are published for OAuth branding review.', icon: FileText },
          ].map(({ title, text, icon: Icon }) => (
            <section key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Icon className="mb-4 h-6 w-6 text-violet-300" />
              <h2 className="font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{text}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Link href="/privacy" className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold">Privacy Policy</Link>
          <Link href="/terms" className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold">Terms</Link>
        </div>
      </div>
    </main>
  )
}
