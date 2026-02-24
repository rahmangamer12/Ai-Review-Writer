'use client'

import { motion } from 'framer-motion'
import { WifiOff, RefreshCw, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-8"
        >
          <WifiOff className="w-12 h-12 text-purple-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          You&apos;re Offline
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 mb-8"
        >
          It looks like you&apos;ve lost your internet connection. 
          Some features may be limited until you&apos;re back online.
        </motion.p>

        {/* Cached Pages Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card border border-white/10 rounded-xl p-6 mb-8"
        >
          <h2 className="text-white font-semibold mb-3">Available Offline:</h2>
          <ul className="text-left text-white/70 space-y-2 text-sm">
            <li>✓ Dashboard (cached)</li>
            <li>✓ Reviews (cached data)</li>
            <li>✓ Settings</li>
            <li>✓ Profile</li>
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center gap-2 px-6 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors border border-white/20"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-white/40 text-sm"
        >
          <p>💡 Tip: You can still view cached pages and data</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
