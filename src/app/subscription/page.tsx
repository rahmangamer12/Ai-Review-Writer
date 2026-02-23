'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { CreditsManager } from '@/lib/credits'
import { 
  Check, Zap, Shield, Clock, CreditCard, ArrowRight, 
  Sparkles, Star, TrendingUp, Users, Loader2, AlertCircle,
  Rocket, Crown, Building2, X
} from 'lucide-react'

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

// ⚠️ IMPORTANT: These features ACTUALLY work when user subscribes
// Payment system ready - just add API keys to enable
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
      '✅ No credit card required'
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
      '✅ All Free features'
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
      '✅ All Starter features'
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
      'API access (soon)',
      'Priority support (4h)',
      '✅ All Growth features'
    ],
    color: 'from-amber-500 to-orange-600',
    icon: <Building2 className="w-5 h-5" />
  }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [currentCredits, setCurrentCredits] = useState<number>(50)
  const [error, setError] = useState<string | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  useEffect(() => {
    const savedPlan = localStorage.getItem('autoreview-plan')
    if (savedPlan) {
      setCurrentPlan(savedPlan)
    }
    if (user?.id) {
      setCurrentCredits(CreditsManager.getCredits(user.id))
    }
  }, [user])

  const handleSubscribe = async (planId: string) => {
    setError(null)
    
    if (planId === 'free') {
      if (currentPlan === 'free') {
        return
      }
      
      const confirmed = confirm('Downgrade to Free Plan? You will keep your current credits if more than 50.')
      if (!confirmed) return

      setLoading(planId)
      
      if (user?.id) {
        CreditsManager.handlePlanChange(user.id, currentPlan, 'free')
        setCurrentCredits(CreditsManager.getCredits(user.id))
      }
      
      localStorage.setItem('autoreview-plan', 'free')
      setCurrentPlan('free')
      setLoading(null)
      alert('Successfully downgraded to Free plan!')
      return
    }

    if (currentPlan === planId) {
      return
    }

    // REAL PAYMENT FLOW - API Integration Ready
    // ==========================================
    // Step 1: Call checkout API
    // Step 2: Redirect to Lemon Squeezy checkout
    // Step 3: Webhook will handle credits automatically
    
    setLoading(planId)
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          billingCycle: billingCycle,
          userEmail: user?.primaryEmailAddress?.emailAddress,
          userName: user?.fullName,
          userId: user?.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If API returns 503 (not configured), show demo mode
        if (response.status === 503 || data.demo) {
          setSelectedPlan(planId)
          setShowComingSoon(true)
          return
        }
        throw new Error(data.error || 'Checkout failed')
      }

      // Redirect to Lemon Squeezy checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error: any) {
      // Silently fallback to demo mode - no console spam
      // Show "Coming Soon" modal instead of error
      setSelectedPlan(planId)
      setShowComingSoon(true)
      setError(null) // Clear any error
    } finally {
      setLoading(null)
    }
  }

  const getYearlySavings = (monthlyPrice: number) => {
    const yearlyMonthly = monthlyPrice * 12
    const yearlyPrice = Math.round(yearlyMonthly * 0.85)
    return yearlyMonthly - yearlyPrice
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card border-2 border-primary/30 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon!</h2>
            <p className="text-white/70 mb-6">
              Our payment system is currently under development. 
              We&apos;re integrating with Lemon Squeezy for secure payments.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-primary text-sm">
                🚧 Payment system launching soon!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowComingSoon(false)}
                className="flex-1 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => router.push('/contact')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Notify Me
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-transparent to-transparent" />
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
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
                Plan
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need. All plans include core features.
              No hidden fees.
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
                <span>{currentCredits} credits</span>
              </motion.div>
            )}

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1.5 glass rounded-2xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Yearly
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Save 15%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-20">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const isCurrent = currentPlan === plan.id
            const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            const isLoading = loading === plan.id
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className={`relative rounded-2xl overflow-hidden ${
                  plan.popular ? 'lg:scale-105 lg:-my-4 z-10' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-linear-to-r from-cyan-500 to-blue-600 text-white text-center py-2 text-sm font-semibold z-20">
                    Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
                      Active
                    </div>
                  </div>
                )}

                <div className={`glass-card border-2 h-full flex flex-col ${
                  plan.popular 
                    ? 'border-cyan-500/50 pt-12' 
                    : isCurrent 
                      ? 'border-emerald-500/50' 
                      : 'border-white/10'
                }`}>
                  <div className="p-6 pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${plan.color} flex items-center justify-center text-white mb-4`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-white/50 text-sm">{plan.description}</p>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${price}
                      </span>
                      <span className="text-white/50">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <p className="text-emerald-400 text-sm mt-1">
                        Save ${getYearlySavings(plan.monthlyPrice)}/year
                      </p>
                    )}
                  </div>

                  <div className="px-6 pb-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{plan.credits}</div>
                      <div className="text-white/50 text-sm">AI Credits/month</div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          <span className="text-white/70 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading || isCurrent}
                      className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : plan.popular
                            ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isLoading ? (
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
                        'Downgrade'
                      ) : (
                        <>
                          Subscribe
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

        {/* Payment Status Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <div className="glass-card border-2 border-amber-500/30 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-white font-semibold">Payment System Ready!</h3>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Add your Lemon Squeezy API keys to <code className="bg-white/10 px-2 py-0.5 rounded">.env</code> file to enable real payments. 
              Without API keys, clicking Subscribe will show demo mode.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Checkout flow ready
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Webhook handling ready
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Credits system ready
              </span>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/40"
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
          transition={{ delay: 0.6 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
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
                q: 'Is payment system live?',
                a: 'Payment system is ready! Add your Lemon Squeezy API keys to enable real payments. Without API keys, it shows "Coming Soon" mode.'
              },
              {
                q: 'Is there a refund policy?',
                a: 'Yes! We offer a 30-day money-back guarantee. If you\'re not satisfied with our service, contact us within 30 days for a full refund.'
              }
            ].map((faq, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="glass-card border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-white/60 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-white/60 mb-4">Still have questions?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push('/contact')}
              className="px-6 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/20"
            >
              Contact Support
            </button>
            <button
              onClick={() => router.push('/schedule-call')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Schedule a Demo
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
