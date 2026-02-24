'use client'

import { useState, useEffect } from 'react'
import { Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function PWATestPage() {
  const [manifestLoaded, setManifestLoaded] = useState(false)
  const [swRegistered, setSWRegistered] = useState(false)
  const [iconsValid, setIconsValid] = useState(false)
  const [installable, setInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check manifest
    fetch('/manifest.json')
      .then(res => {
        setManifestLoaded(res.ok)
        return res.json()
      })
      .then(data => {
        // Check icons
        Promise.all(
          data.icons.map((icon: any) => 
            fetch(icon.src).then(r => r.ok)
          )
        ).then(results => {
          setIconsValid(results.every(r => r))
        })
      })
      .catch(() => setManifestLoaded(false))

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then(reg => {
        setSWRegistered(!!reg)
      })
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Install prompt not available. Try:\n1. Use Chrome/Edge browser\n2. Access via HTTPS (not localhost)\n3. Clear cache and reload')
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

  const StatusIcon = ({ condition }: { condition: boolean }) => 
    condition ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">PWA Test Dashboard</h1>
          <p className="text-white/70 mb-8">Check karo ke PWA theek se configure hai ya nahi</p>

          {/* Status Checks */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Manifest File</h3>
                <p className="text-white/60 text-sm">manifest.json load ho raha hai</p>
              </div>
              <StatusIcon condition={manifestLoaded} />
            </div>

            <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Service Worker</h3>
                <p className="text-white/60 text-sm">Background worker registered hai</p>
              </div>
              <StatusIcon condition={swRegistered} />
            </div>

            <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">App Icons</h3>
                <p className="text-white/60 text-sm">Sab icons available hain</p>
              </div>
              <StatusIcon condition={iconsValid} />
            </div>

            <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Install Prompt</h3>
                <p className="text-white/60 text-sm">App install karne ke liye ready</p>
              </div>
              {installable ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstallClick}
            disabled={!installable}
            className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
              installable
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white cursor-pointer'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Download className="w-6 h-6" />
            {installable ? 'Install App Now' : 'Install Prompt Not Available'}
          </button>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-yellow-300 font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Agar Install Button Nahi Dikh Raha:
            </h3>
            <ul className="text-white/80 space-y-2 text-sm">
              <li>✓ <strong>Chrome ya Edge browser</strong> use karo (Firefox/Safari mein PWA support kam hai)</li>
              <li>✓ <strong>HTTPS required hai</strong> - localhost pe testing ke liye Chrome DevTools &gt; Application &gt; Manifest check karo</li>
              <li>✓ <strong>Already installed</strong> to hai nahi? Check chrome://apps/</li>
              <li>✓ <strong>Cache clear karo</strong> aur page reload karo (Ctrl+Shift+R)</li>
              <li>✓ <strong>Production pe deploy karo</strong> (Vercel/Netlify) - localhost pe install prompt nahi aata</li>
            </ul>
          </div>

          {/* Manual Install Instructions */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-blue-300 font-semibold mb-3">Manual Install (Chrome):</h3>
            <ol className="text-white/80 space-y-2 text-sm list-decimal list-inside">
              <li>Chrome address bar mein <strong>install icon</strong> (⊕) dekho</li>
              <li>Ya 3 dots menu (⋮) &gt; <strong>"Install AutoReview AI"</strong></li>
              <li>Mobile pe: Menu &gt; <strong>"Add to Home screen"</strong></li>
            </ol>
          </div>

          {/* Dev Tools Tip */}
          <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-purple-300 font-semibold mb-3">Developer Testing:</h3>
            <p className="text-white/80 text-sm mb-3">
              Chrome DevTools me PWA check karo:
            </p>
            <ol className="text-white/80 space-y-1 text-sm list-decimal list-inside">
              <li>F12 press karo (DevTools open)</li>
              <li><strong>Application</strong> tab pe jao</li>
              <li><strong>Manifest</strong> section check karo</li>
              <li><strong>Service Workers</strong> section check karo</li>
            </ol>
          </div>

          {/* Back Button */}
          <div className="mt-8">
            <a
              href="/dashboard"
              className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
