'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { CreditsManager } from '@/lib/credits'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoaded } = useUser()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [plan, setPlan] = useState<string>('')

  useEffect(() => {
    const handleSuccess = async () => {
      if (!isLoaded || !user) return

      const planId = searchParams.get('plan') || localStorage.getItem('pending-plan') || 'starter'
      setPlan(planId)

      try {
        // Get current plan before updating
        const currentPlan = localStorage.getItem('autoreview-plan') || 'free'
        
        // Update credits based on new plan
        CreditsManager.handlePlanChange(user.id, currentPlan, planId)
        
        // Update localStorage
        localStorage.setItem('autoreview-plan', planId)
        localStorage.removeItem('pending-plan')
        
        // Store subscription info
        localStorage.setItem('autoreview-subscription', JSON.stringify({
          plan: planId,
          status: 'active',
          activatedAt: new Date().toISOString(),
          userId: user.id
        }))

        setStatus('success')
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } catch (error) {
        console.error('Error activating subscription:', error)
        setStatus('error')
      }
    }

    handleSuccess()
  }, [isLoaded, user, searchParams, router])

  const [loadTimeout, setLoadTimeout] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLoadTimeout(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        {loadTimeout && (
          <div className="text-center max-w-sm px-4">
            <p className="text-red-400 text-sm mb-4">Authentication is taking longer than expected. Please check your connection or reload the page.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">Reload Page</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {status === 'processing' && (
          <div className="glass-card border border-primary/20 rounded-2xl p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Activating Your Subscription</h1>
            <p className="text-white/70">Please wait while we set up your account...</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border-2 border-emerald-500/30 rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </motion.div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            
            <p className="text-white/70 mb-2">
              Welcome to the <span className="text-primary font-semibold capitalize">{plan}</span> plan!
            </p>
            <p className="text-white/60 text-sm mb-6">
              Your subscription is now active and credits have been added to your account.
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <p className="text-emerald-400 text-sm">
                ✨ Redirecting to dashboard in a few seconds...
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="glass-card border-2 border-red-500/30 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something Went Wrong</h1>
            <p className="text-white/70 mb-6">
              Your payment was successful, but we had trouble activating your subscription. 
              Please contact support.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/contact')}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 glass text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
        <p className="text-white/70">Loading...</p>
      </div>
    </div>
  )
}

// Main export with Suspense
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
