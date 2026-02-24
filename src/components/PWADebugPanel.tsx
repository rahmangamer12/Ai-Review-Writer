'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react'

export default function PWADebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [installable, setInstallable] = useState(false)
  const [swRegistered, setSwRegistered] = useState(false)
  const [manifestLoaded, setManifestLoaded] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check standalone mode
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Check manifest
    fetch('/manifest.json')
      .then(res => res.ok && setManifestLoaded(true))
      .catch(() => setManifestLoaded(false))

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwRegistered(!!reg)
      })
    }

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert('Install prompt not available. Try:\n1. Close all tabs\n2. Clear site data\n3. Revisit site')
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      alert('✅ App installed successfully!')
    }
    
    setDeferredPrompt(null)
    setInstallable(false)
  }

  const clearDismissal = () => {
    localStorage.removeItem('pwa-install-dismissed')
    alert('✅ Install prompt reset! Refresh page to see it again.')
  }

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
        title="PWA Debug Panel"
      >
        <Smartphone className="w-6 h-6" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-purple-400" />
              PWA Debug Panel
            </h2>

            {/* Status Checks */}
            <div className="space-y-3 mb-6">
              <StatusItem 
                label="Manifest Loaded" 
                status={manifestLoaded} 
              />
              <StatusItem 
                label="Service Worker" 
                status={swRegistered} 
              />
              <StatusItem 
                label="Install Prompt" 
                status={installable} 
              />
              <StatusItem 
                label="Already Installed" 
                status={isStandalone} 
              />
            </div>

            {/* Browser Info */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Browser:</p>
              <p className="text-white text-xs font-mono break-all">
                {navigator.userAgent.substring(0, 80)}...
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {installable && (
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Install PWA Now
                </button>
              )}
              
              <button
                onClick={clearDismissal}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Reset Install Prompt
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-200">
                💡 <strong>Install button nahi dikh raha?</strong><br/>
                1. Clear browser data<br/>
                2. Close all tabs<br/>
                3. Revisit site<br/>
                4. Wait 2-3 seconds
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <span className="text-gray-300 text-sm">{label}</span>
      {status ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )}
    </div>
  )
}
