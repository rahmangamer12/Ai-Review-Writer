'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isInStandalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Don't show if already installed or dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed || isInStandalone) return

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS, show install prompt if not standalone
    if (iOS && !isInStandalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }

      setDeferredPrompt(null)
    }

    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-br from-purple-600/95 to-blue-600/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              Install AutoReview AI
            </h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {isIOS 
                ? "Apne home screen par add karein for quick access!"
                : "App ki tarah use karein - faster aur offline bhi kaam karta hai!"}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>⚡ Lightning fast access</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>📱 Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>🔔 Push notifications</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isIOS ? (
          <div className="space-y-3">
            <div className="bg-white/10 rounded-lg p-3 text-white/90 text-sm">
              <p className="mb-2 font-medium">Installation Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tap the <strong>Share</strong> button ⬆️</li>
                <li>Scroll down aur tap <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong> to confirm</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full bg-white text-purple-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors"
            >
              Got it!
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/20 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-purple-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
