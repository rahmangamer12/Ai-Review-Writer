'use client'

import { useServiceWorker } from '@/hooks/useServiceWorker'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export default function PWAUpdateNotification() {
  const { updateAvailable, isOnline, updateServiceWorker } = useServiceWorker()

  if (!updateAvailable && isOnline) return null

  return (
    <>
      {/* Update Available Notification */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <p className="font-medium">New update available!</p>
            <button
              onClick={updateServiceWorker}
              className="ml-2 bg-white text-green-600 px-4 py-1 rounded-full font-semibold hover:bg-green-50 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Offline Notification */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <WifiOff className="w-5 h-5" />
            <p className="font-medium">You are offline - Limited features available</p>
          </div>
        </div>
      )}

      {/* Back Online Notification */}
      {isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 opacity-0 pointer-events-none transition-opacity duration-300 [&.show]:opacity-100">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <p className="font-medium">You are back online!</p>
          </div>
        </div>
      )}
    </>
  )
}
