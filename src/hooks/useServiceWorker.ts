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

    let updateInterval: NodeJS.Timeout | null = null

    // When the active worker changes (a new version took control), reload once
    // so the user is immediately on the latest deploy — no manual refresh.
    let reloading = false
    const onControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        setRegistration(reg)

        // A worker already waiting from a previous load? Activate it now.
        if (reg.waiting && navigator.serviceWorker.controller) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }

        // Check for a new deploy every 60 seconds.
        updateInterval = setInterval(() => {
          reg.update()
        }, 60000)

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // A new version finished installing while an old one controls the
              // page → take over immediately. controllerchange then reloads.
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
                newWorker.postMessage({ type: 'SKIP_WAITING' })
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

    // CRITICAL: Cleanup function to prevent memory leaks
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
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
