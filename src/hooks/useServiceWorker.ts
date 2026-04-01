'use client'

import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Skip service worker registration in development
    // This prevents the "Network unavailable" errors
    if (process.env.NODE_ENV === 'development') {
      console.log('⏭️ Service Worker skipped in development')
      
      // Still monitor online/offline
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
    
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        setRegistration(reg)

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })

        console.log('✅ Service Worker registered')
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()

    // Monitor online/offline
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const dismissUpdate = () => setUpdateAvailable(false)

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  return { registration, updateAvailable, isOnline, updateServiceWorker, dismissUpdate }
}
