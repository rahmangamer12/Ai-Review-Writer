'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react'

export default function SubscriptionCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="glass-card border-2 border-yellow-500/30 rounded-2xl p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-10 h-10 text-yellow-400" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
          <p className="text-white/70 mb-2">
            Your subscription was not completed.
          </p>
          <p className="text-white/60 text-sm mb-6">
            No worries! You can try again anytime or choose a different plan that works for you.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/subscription')}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </button>
            
            <button
              onClick={() => router.push('/contact')}
              className="w-full py-3 glass text-white rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs">
              Still have questions? Email us at{' '}
              <a href="mailto:support@autoreview-ai.com" className="text-primary hover:underline">
                support@autoreview-ai.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
