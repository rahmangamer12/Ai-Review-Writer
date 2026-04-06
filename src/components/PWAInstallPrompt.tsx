'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, Smartphone, Tablet, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent.toLowerCase()
      const isIPad = /ipad/.test(ua)
      const isIPhone = /iphone|ipod/.test(ua)
      const isIOS = isIPad || isIPhone
      const isAndroid = /android/.test(ua) && !/windows/.test(ua)
      
      setIsIOS(isIOS)
      setIsAndroid(isAndroid)

      const width = window.innerWidth
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }

      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: fullscreen)').matches
      
      setIsStandalone(isStandalone)
      
      return { isIOS, isAndroid, isStandalone }
    }

    const { isIOS: isIosDev, isAndroid: isAndroidDev, isStandalone: isStandaloneDev } = checkDevice()

    if (isStandaloneDev) return

    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time')
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed-time')) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    window.addEventListener('appinstalled', () => {
      setIsStandalone(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      localStorage.removeItem('pwa-install-dismissed-time')
    })

    if ((isIosDev || isAndroidDev) && !isStandaloneDev) {
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed-time')) {
          setShowPrompt(true)
        }
      }, 5000)
    }

    const handleResize = () => checkDevice()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt && !isIOS) return

    if (deferredPrompt) {
      deferredPrompt.prompt()

      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }

      setDeferredPrompt(null)
    }

    setShowPrompt(false)
  }, [deferredPrompt, isIOS])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString())
  }, [])

  const getDeviceIcon = () => {
    if (isIOS) return <Smartphone className="w-6 h-6" />
    if (isAndroid) return <Smartphone className="w-6 h-6" />
    if (deviceType === 'tablet') return <Tablet className="w-6 h-6" />
    return <Monitor className="w-6 h-6" />
  }

  const getInstallInstructions = () => {
    if (isIOS) {
      return {
        title: 'Install on iPhone/iPad',
        steps: [
          { icon: '1', text: 'Tap the Share button below' },
          { icon: '2', text: 'Scroll down and tap "Add to Home Screen"' },
          { icon: '3', text: 'Tap "Add" to confirm' }
        ]
      }
    }
    if (isAndroid) {
      return {
        title: 'Install on Android',
        steps: [
          { icon: '1', text: 'Tap the menu (three dots)' },
          { icon: '2', text: 'Select "Add to Home Screen"' },
          { icon: '3', text: 'Tap "Install"' }
        ]
      }
    }
    return {
      title: 'Install as App',
      steps: [
        { icon: '1', text: 'Click the install button below' },
        { icon: '2', text: 'Follow the browser prompt' },
        { icon: '3', text: 'App will be added to your desktop' }
      ]
    }
  }

  if (!showPrompt || isStandalone) return null

  const instructions = getInstallInstructions()

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-br from-purple-600/95 to-blue-600/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {getDeviceIcon()}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              Install AutoReview AI
            </h3>
            <p className="text-white/90 text-sm leading-relaxed">
              {isIOS 
                ? "Home screen par add karein for quick access!"
                : isAndroid
                ? "App jaise install karein - offline bhi kaam karega!"
                : "Desktop par app ki tarah use karein!"}
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>{isIOS || isAndroid ? '⚡ Tez access' : '⚡ Lightning fast'}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>{isIOS || isAndroid ? '📱 Offline kaam karega' : '📱 Works offline'}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>🔔 Notifications</span>
          </div>
        </div>

        {isIOS || isAndroid ? (
          <div className="space-y-3">
            <div className="bg-white/10 rounded-lg p-3 text-white/90 text-sm">
              <p className="mb-2 font-medium">{instructions.title}</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                {instructions.steps.map((step) => (
                  <li key={step.icon}>{step.text}</li>
                ))}
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full bg-white text-purple-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-white/90 transition-colors"
            >
              Samajh gaya!
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/20 transition-colors"
            >
              Baad mein
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
