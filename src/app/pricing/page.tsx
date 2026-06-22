'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X, Sparkles } from 'lucide-react'
import { PLANS, PLAN_ORDER, platformsLabel } from '@/lib/plans'

/**
 * Public pricing page — no auth required.
 *
 * Source of truth is `@/lib/plans` (same as the in-app /subscription checkout),
 * so prices and features never drift. This page exists so prospective customers
 * (and payment-provider verification bots, e.g. Paddle) can see plans and prices
 * without hitting the login wall on /subscription.
 */
export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Manage your customer reviews and generate AI-written replies. Start free,
            upgrade when you grow. No hidden fees. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 glass rounded-full p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !yearly ? 'bg-primary text-white' : 'text-white/70'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                yearly ? 'bg-primary text-white' : 'text-white/70'
              }`}
            >
              Yearly <span className="text-emerald-400">(2 months free)</span>
            </button>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((id, i) => {
            const plan = PLANS[id]
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const suffix = plan.monthlyPrice === 0 ? '' : yearly ? '/year' : '/month'
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={`glass-card rounded-2xl p-6 flex flex-col border ${
                  plan.popular ? 'border-primary/60 ring-1 ring-primary/40' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="inline-flex items-center gap-1 self-start mb-3 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    <Sparkles className="w-3 h-3" /> Most popular
                  </div>
                )}

                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="text-white/60 text-sm mt-1 min-h-[40px]">{plan.description}</p>

                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold text-white">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {suffix && <span className="text-white/50 text-sm ml-1">{suffix}</span>}
                </div>

                <div className="text-xs text-white/50 mb-5">
                  {plan.credits.toLocaleString()} AI replies · {platformsLabel(plan.id)} platform
                  {plan.platforms === 1 ? '' : 's'}
                </div>

                <Link
                  href="/sign-up"
                  className={`w-full text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'glass border border-white/15 text-white hover:bg-white/5'
                  }`}
                >
                  {plan.monthlyPrice === 0 ? 'Get started free' : `Choose ${plan.name}`}
                </Link>

                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((feat) => (
                    <li key={feat.label} className="flex items-start gap-2 text-sm">
                      {feat.available ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                      )}
                      <span className={feat.available ? 'text-white/80' : 'text-white/40'}>
                        {feat.label}
                        {!feat.available && ' (coming soon)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Trust / legal footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center text-sm text-white/60"
        >
          <p>
            Payments are processed securely by Paddle. Prices in USD. Taxes may apply at checkout.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <span className="text-white/20">·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-white/20">·</span>
            <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            <span className="text-white/20">·</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
