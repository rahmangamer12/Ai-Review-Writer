'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Check, Zap, Shield, Clock, CreditCard, ArrowRight,
  Sparkles, Star, TrendingUp, Users, Loader2, AlertCircle,
  Rocket, Crown, Building2, X, Mail, Bell, CheckCircle2
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  credits: number
  features: string[]
  popular?: boolean
  color: string
  icon: React.ReactNode
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try before you buy',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 20,
    features: [
      '20 AI responses per month',
      '1 platform connection',
      'Basic dashboard',
      'Email support',
      'No credit card required'
    ],
    color: 'from-gray-500 to-gray-600',
    icon: <Star className="w-5 h-5" />
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small business',
    monthlyPrice: 9,
    yearlyPrice: 90,
    credits: 100,
    features: [
      '100 AI responses per month',
      '3 platform connections',
      'Bulk reply generation',
      'Response templates',
      'Analytics dashboard',
      'All Free features'
    ],
    popular: true,
    color: 'from-cyan-500 to-blue-600',
    icon: <Rocket className="w-5 h-5" />
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: 300,
    features: [
      '300 AI responses per month',
      'Unlimited platforms',
      'Auto-draft mode',
      'Sentiment reports',
      'Slack notifications',
      'Priority support',
      'All Starter features'
    ],
    color: 'from-purple-500 to-pink-600',
    icon: <Crown className="w-5 h-5" />
  },
  {
    id: 'business',
    name: 'Business',
    description: 'For multi-location teams',
    monthlyPrice: 39,
    yearlyPrice: 390,
    credits: 1000,
    features: [
      '1000 AI responses per month',
      'Up to 5 team members',
      'Advanced analytics',
      'Custom integrations',
      'API access',
      'Priority support (4h SLA)',
      'All Growth features'
    ],
    color: 'from-amber-500 to-orange-600',
    icon: <Building2 className="w-5 h-5" />
  }
]

// ─── Early Access Modal (shows when payment not yet configured) ───────────────
function EarlyAccessModal({
  planName,
  onClose
}: {
  planName: string
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress)
    }
  }, [user])

  const handleNotify = async () => {
    if (!email.trim() || !email.includes('@')) return
    setSubmitting(true)
    try {
      // Save to waitlist API
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: planName })
      })
    } catch {}
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="relative w-full max-w-lg bg-[#0d0d1a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-pink-500 rounded-t-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <>
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Bell className="w-8 h-8 text-violet-400" />
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Payments Launching Soon 🚀
            </h2>
            <p className="text-white/60 text-center text-sm mb-2">
              You selected the <span className="text-violet-400 font-semibold capitalize">{planName}</span> plan.
            </p>
            <p className="text-white/50 text-center text-sm mb-8">
              We're finalizing our payment integration. Enter your email and we'll notify you the moment it's live — plus get an exclusive early-bird discount!
            </p>

            {/* Email Input */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNotify()}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
                />
              </div>
              <button
                onClick={handleNotify}
                disabled={submitting || !email.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-violet-600/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Notify Me When It's Live
                  </>
                )}
              </button>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🎁', label: 'Early-bird discount' },
                { icon: '⚡', label: 'Priority access' },
                { icon: '🔒', label: 'No spam, ever' },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-[10px] text-white/50">{item.label}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Success State
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">You're on the list! 🎉</h2>
            <p className="text-white/60 text-sm mb-2">
              We'll email <span className="text-white font-medium">{email}</span> the moment payments go live.
            </p>
            <p className="text-white/40 text-xs mb-8">
              You'll receive an exclusive early-bird offer on the {planName} plan.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              Back to Plans
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [currentCredits, setCurrentCredits] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [earlyAccessPlan, setEarlyAccessPlan] = useState<string | null>(null)
  const { warning: toastWarning } = useToast()

  useEffect(() => {
    async function fetchUserData() {
      if (user?.id) {
        try {
          const response = await fetch('/api/user/me')
          const text = await response.text()
          const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
          if (!isJson) { setCurrentPlan('free'); setCurrentCredits(0); return }
          const data = JSON.parse(text)
          if (data.planType) {
            setCurrentPlan(data.planType || 'free')
            setCurrentCredits(data.aiCredits || 20)
          } else {
            setCurrentPlan('free')
            setCurrentCredits(0)
          }
        } catch {
          setCurrentPlan('free')
          setCurrentCredits(0)
        }
      }
    }
    fetchUserData()
  }, [user])

  const handleSubscribe = async (planId: string) => {
    setError(null)

    if (planId === 'free') {
      if (currentPlan === 'free') return
      toastWarning('Downgrade not available', 'Plan downgrades are managed through the billing portal.')
      return
    }

    if (currentPlan === planId) return

    setLoading(planId)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          billingCycle,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          userName: user?.fullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Payment not configured → show Early Access modal
        if (response.status === 503 || data.demo || data.earlyAccess) {
          setEarlyAccessPlan(planId)
          return
        }
        throw new Error(data.error || 'Checkout failed')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch {
      // Network error or any other issue → show Early Access modal
      setEarlyAccessPlan(planId)
    } finally {
      setLoading(null)
    }
  }

  const getYearlySavings = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 12 * 0.15)
  }

  const getPlanPrice = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.monthlyPrice * 12 * 0.85)
    }
    return plan.monthlyPrice
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden w-full">
      {/* Early Access Modal */}
      <AnimatePresence>
        {earlyAccessPlan && (
          <EarlyAccessModal
            planName={plans.find(p => p.id === earlyAccessPlan)?.name || earlyAccessPlan}
            onClose={() => setEarlyAccessPlan(null)}
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simple, transparent pricing</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                Plan
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need. All plans include core AI features.
              No hidden fees, cancel anytime.
            </p>

            {/* Current Plan Badge */}
            {currentPlan !== 'free' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 mb-6"
              >
                <Check className="w-4 h-4" />
                <span className="capitalize">Current Plan: {currentPlan}</span>
                <span className="text-white/40">|</span>
                <span>{currentCredits} credits remaining</span>
              </motion.div>
            )}

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-1 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  billingCycle === 'monthly'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${
                  billingCycle === 'yearly'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Yearly
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Save 15%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-20">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
          {plans.map((plan, index) => {
            const isCurrent = currentPlan === plan.id
            const price = getPlanPrice(plan)
            const isLoadingThis = loading === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl overflow-hidden flex flex-col ${
                  plan.popular ? 'ring-2 ring-cyan-500/50 shadow-2xl shadow-cyan-500/10' : ''
                } ${isCurrent ? 'ring-2 ring-emerald-500/40' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-center py-2 text-xs font-bold tracking-wide z-10">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-3 right-3 z-20">
                    <div className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      Active
                    </div>
                  </div>
                )}

                <div className={`bg-[#0d0d1a] border border-white/[0.08] h-full flex flex-col ${plan.popular ? 'pt-10' : ''}`}>
                  <div className="p-6 pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-white/40 text-sm">{plan.description}</p>
                  </div>

                  <div className="px-6 pb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-white/40 text-sm">/{billingCycle === 'yearly' ? 'year' : 'mo'}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <p className="text-emerald-400 text-xs mt-1 font-medium">
                        Save ${getYearlySavings(plan.monthlyPrice)}/year
                      </p>
                    )}
                  </div>

                  <div className="px-6 pb-5">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-violet-400">{plan.credits}</div>
                      <div className="text-white/40 text-xs">AI Credits / month</div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex-1">
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                          <span className="text-white/60 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoadingThis || isCurrent}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px] text-sm ${
                        isCurrent
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
                          : plan.popular
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 shadow-lg shadow-cyan-500/20'
                          : plan.id === 'free'
                          ? 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                          : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90 shadow-lg`
                      } ${isLoadingThis ? 'opacity-70 cursor-wait' : ''} active:scale-[0.98]`}
                      aria-label={isCurrent ? 'Current plan' : `Subscribe to ${plan.name}`}
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        <>
                          <Check className="w-4 h-4" />
                          Current Plan
                        </>
                      ) : plan.id === 'free' ? (
                        'Downgrade to Free'
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-14 max-w-2xl mx-auto"
        >
          <div className="bg-[#0d0d1a] border-2 border-emerald-500/20 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold">Secure & Trusted Payments</h3>
            </div>
            <p className="text-white/50 text-sm mb-4">
              All payments are processed securely via Lemon Squeezy. Your data is encrypted and protected.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400" /> 256-bit SSL encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400" /> 30-day money-back guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-400" /> Cancel anytime
              </span>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/30"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Instant Activation</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Cancel Anytime</span>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'What are AI credits?',
                a: 'AI credits are used for generating AI responses to reviews. Each response generation uses 1 credit. Analytics and other features may use credits based on complexity.'
              },
              {
                q: 'Can I change plans anytime?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features and credits.'
              },
              {
                q: 'When will payments go live?',
                a: 'Very soon! Sign up for early access notifications and you\'ll be the first to know — plus receive an exclusive early-bird discount.'
              },
              {
                q: 'What is your refund policy?',
                a: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, contact us within 30 days for a full refund — no questions asked.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.08 }}
                className="bg-[#0d0d1a] border border-white/[0.08] rounded-xl p-6 hover:border-violet-500/30 transition-colors"
              >
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16 text-center"
        >
          <p className="text-white/50 mb-4">Still have questions?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push('/contact')}
              className="px-6 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/20 active:scale-[0.98]"
            >
              Contact Support
            </button>
            <button
              onClick={() => router.push('/schedule-call')}
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              Schedule a Demo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
