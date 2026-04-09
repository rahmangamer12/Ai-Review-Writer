'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { CreditsManager, type CreditUsage } from '@/lib/credits'

export default function CreditManager() {
  const { user, isLoaded } = useUser()
  const [credits, setCredits] = useState(0)
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([])
  const [plan, setPlan] = useState('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  useEffect(() => {
    async function fetchUserData() {
      if (isLoaded && user) {
        try {
          const response = await fetch('/api/user/me')
          const text = await response.text()
          
          const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')
          if (!isJson) {
            setPlan('free')
            setCredits(0)
            setUsageHistory([])
            return
          }
          
          const data = JSON.parse(text)
          
          if (data.planType) {
            setPlan(data.planType || 'free')
            setCredits(data.aiCredits || 20)
            setUsageHistory([])
          } else {
            setPlan('free')
            setCredits(0)
            setUsageHistory([])
          }
        } catch (err) {
          console.error("Failed to fetch user stats", err)
          setPlan('free')
          setCredits(0)
        }
      }
    }
    fetchUserData()
  }, [isLoaded, user])

  const getPlanCredits = () => {
    const planCredits: Record<string, number> = {
      'free': 20,
      'starter': 100,
      'growth': 300,
      'business': 1000
    }
    return planCredits[plan] || 20
  }

  const creditPercentage = (credits / getPlanCredits()) * 100

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card border-2 border-primary/20 rounded-2xl p-4 sm:p-6 lg:p-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">AI Credits</h3>
                <p className="text-white/60">Your current balance</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-400">{credits}</div>
              <div className="text-white/60 text-sm">of {getPlanCredits()} total</div>
            </div>
          </div>

          {/* Credit Progress Bar */}
          <div className="mb-6">
              <div className="w-full bg-white/10 rounded-full h-3 sm:h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${creditPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/60 text-sm">Credits Used: {getPlanCredits() - credits}</span>
              <span className="text-white/60 text-sm">Resets: 1st of month</span>
            </div>
          </div>

          {/* Plan Info */}
          <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
            <div>
              <p className="text-white/60 text-sm">Current Plan</p>
              <p className="text-white font-semibold capitalize">{plan} Tier</p>
            </div>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all font-medium"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </motion.div>

      {/* Usage History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card border-2 border-primary/20 rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <span>📊</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Recent Usage</h3>
            <p className="text-white/60">Credit consumption history</p>
          </div>
        </div>

        {usageHistory.length > 0 ? (
          <div className="space-y-3">
            {usageHistory.map((usage, index) => (
              <motion.div
                key={usage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between p-4 glass rounded-lg hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm">-</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {usage.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-white/60 text-sm">{usage.details}</p>
                    <p className="text-white/40 text-xs">
                      {new Date(usage.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-red-400 font-semibold">-{usage.creditsUsed}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-white/60 mb-2">No usage history yet</p>
            <p className="text-white/40 text-sm">Start using AI features to track your credit usage</p>
          </div>
        )}
      </motion.div>

      {/* Credit Packages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card border-2 border-primary/20 rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <span>🎁</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Credit Packages</h3>
            <p className="text-white/60">One-time credit purchases</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { credits: 100, price: 9, bonus: 0, color: 'from-blue-500 to-purple-500' },
            { credits: 250, price: 19, bonus: 25, color: 'from-cyan-500 to-teal-500' },
            { credits: 500, price: 29, bonus: 100, color: 'from-emerald-500 to-green-500' }
          ].map((pkg, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card border-2 border-white/10 rounded-xl p-6 text-center relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-10`}></div>
              <div className="relative z-10">
                <div className="text-3xl font-bold text-white mb-2">{pkg.credits + pkg.bonus}</div>
                <div className="text-white/60 text-sm mb-4">Credits</div>
                {pkg.bonus > 0 && (
                  <div className="text-emerald-400 text-xs font-semibold mb-4">
                    +{pkg.bonus} Bonus Credits
                  </div>
                )}
                <div className="text-2xl font-bold text-cyan-400 mb-4">${pkg.price}</div>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          planType: 'credits',
                          creditAmount: pkg.credits + pkg.bonus,
                          price: pkg.price
                        })
                      })
                      const data = await response.json()
                      if (data.checkoutUrl) {
                        window.location.href = data.checkoutUrl
                      } else if (data.demoMode) {
                        alert('Demo Mode: LemonSqueezy not configured. Add API keys to enable payments.')
                      }
                    } catch (error) {
                      console.error('Checkout error:', error)
                      alert('Failed to initiate checkout. Please try again.')
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all font-medium"
                >
                  Purchase
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50"
          onClick={() => setShowUpgradeModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card border-2 border-primary/20 rounded-t-3xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Low Credits</h3>
              <p className="text-white/60 mb-6">
                You're running low on AI credits. Upgrade your plan to get more credits and unlock advanced features.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2 glass text-white rounded-lg hover:bg-white/10 transition-all"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    window.location.href = '/subscription'
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}