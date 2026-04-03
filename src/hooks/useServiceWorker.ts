'use client'

import { useEffect, useState } from 'react'

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        setRegistration(reg)

        // Check for updates every 60 seconds
        setInterval(() => {
          reg.update()
        }, 60000)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Only show update notification if there's actually a new version
                const lastUpdateCheck = localStorage.getItem('last-sw-update')
                const currentTime = Date.now()

                if (!lastUpdateCheck || (currentTime - parseInt(lastUpdateCheck)) > 3600000) {
                  // Show update only if last check was more than 1 hour ago
                  setUpdateAvailable(true)
                  localStorage.setItem('last-sw-update', currentTime.toString())
                }
              }
            })
          }
        })
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const dismissUpdate = () => {
    setUpdateAvailable(false)
    localStorage.setItem('update-dismissed', Date.now().toString())
  }

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
