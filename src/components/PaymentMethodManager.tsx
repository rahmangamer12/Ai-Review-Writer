'use client'

import Link from 'next/link'
import { CreditCard, ExternalLink, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react'

export default function PaymentMethodManager() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-black/35 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Secure Billing</h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                Payment methods are managed by Lemon Squeezy checkout. AutoReview AI does not collect, validate, or store raw card numbers, CVV, bank details, or PayPal credentials.
              </p>
            </div>
          </div>

          <Link
            href="/subscription"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition-all hover:bg-cyan-50"
          >
            Open Checkout
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-5">
          <ShieldCheck className="mb-4 h-6 w-6 text-emerald-300" />
          <h4 className="font-bold text-white">Provider Validated</h4>
          <p className="mt-2 text-xs leading-relaxed text-white/55">Only cards accepted by the payment provider can be used.</p>
        </div>
        <div className="rounded-2xl border border-blue-400/15 bg-blue-400/10 p-5">
          <LockKeyhole className="mb-4 h-6 w-6 text-blue-300" />
          <h4 className="font-bold text-white">No Raw Card Storage</h4>
          <p className="mt-2 text-xs leading-relaxed text-white/55">Card numbers and CVV never touch app storage or localStorage.</p>
        </div>
        <div className="rounded-2xl border border-violet-400/15 bg-violet-400/10 p-5">
          <CreditCard className="mb-4 h-6 w-6 text-violet-300" />
          <h4 className="font-bold text-white">Checkout First</h4>
          <p className="mt-2 text-xs leading-relaxed text-white/55">Add or update payment details during subscription checkout.</p>
        </div>
      </div>
    </div>
  )
}
