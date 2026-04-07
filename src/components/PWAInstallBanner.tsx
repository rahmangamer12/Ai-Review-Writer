'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, Share2 } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

/**
 * PWAInstallBanner
 * 
 * A prominent, smart banner that only appears for mobile users who haven't 
 * installed the app yet. It shows OS-specific instructions.
 */
export default function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall()
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 1. Platform Detection
    if (typeof window === 'undefined') return;
    
    const ua = navigator.userAgent.toLowerCase()
    const ios = /ipad|iphone|ipod/.test(ua)
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
    
    setIsIOS(ios)
    setIsMobile(mobile)

    // 2. Already Installed Check
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;

    // 3. Display Logic
    if (mobile && !isStandalone && !isInstalled) {
      const dismissed = localStorage.getItem('pwa-banner-dismissed')
      // Don't show if dismissed within the last 3 days
      if (dismissed) {
        const time = parseInt(dismissed)
        if (Date.now() - time < 1000 * 60 * 60 * 24 * 3) return
      }
      
      const timer = setTimeout(() => setShowBanner(true), 5000)
      return () => clearTimeout(timer)
    }
  }, [isInstalled])

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString())
  }

  const handleInstall = async () => {
    if (isIOS) return; // iOS doesn't support programmatic install
    const success = await promptInstall();
    if (success) {
      handleDismiss();
    }
  }

  if (!showBanner || isInstalled) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        className="fixed bottom-[calc(72px+env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-50 md:hidden"
      >
        <div className="bg-gradient-to-r from-emerald-600/95 to-teal-600/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 relative overflow-hidden">
          {/* Decorative background flare */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-lg mb-0.5">Install AutoReview AI</h4>
              <p className="text-white/80 text-xs leading-snug">
                {isIOS 
                  ? 'Add to Home Screen for easy access' 
                  : 'Fast access & background notifications'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            {isIOS ? (
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white text-sm font-bold mb-2">
                  <Share2 className="w-4 h-4 text-emerald-300" />
                  Quick Installation Guide:
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 text-xs leading-relaxed">
                    1. Tap the <span className="font-bold underline text-white">Share button ⬆️</span> in Safari
                  </p>
                  <p className="text-white/90 text-xs leading-relaxed">
                    2. Select <span className="font-bold underline text-white">"Add to Home Screen" ➕</span>
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full bg-white text-emerald-600 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/20"
              >
                <Download className="w-5 h-5" />
                INSTALL APP NOW
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
