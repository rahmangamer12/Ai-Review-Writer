'use client'

import { useState, useEffect, useCallback } from 'react'

interface NotificationState {
  permission: NotificationPermission | null
  supported: boolean
  serviceWorkerReady: boolean
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

interface ShowNotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  data?: Record<string, unknown>
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: null,
    supported: false,
    serviceWorkerReady: false
  })

  // Check if notifications are supported and get current permission
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window
      const permission = supported ? Notification.permission : null
      
      setState(prev => ({
        ...prev,
        supported,
        permission
      }))
    }

    checkSupport()
  }, [])

  // Check service worker registration
  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          setState(prev => ({
            ...prev,
            serviceWorkerReady: !!registration
          }))
        } catch (error) {
          console.error('Service Worker not ready:', error)
        }
      }
    }

    checkServiceWorker()
  }, [])

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/notification-sw.js')
      console.log('Service Worker registered:', registration)
      setState(prev => ({ ...prev, serviceWorkerReady: true }))
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.supported) {
      console.warn('Notifications not supported')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setState(prev => ({ ...prev, permission }))
      
      if (permission === 'granted') {
        // Register service worker if not already done
        await registerServiceWorker()
      }
      
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [state.supported, registerServiceWorker])

  // Show notification
  const showNotification = useCallback(async (options: ShowNotificationOptions): Promise<boolean> => {
    // Check if notifications are supported and permission is granted
    if (!state.supported) {
      console.warn('Cannot show notification: notifications not supported')
      return false
    }

    if (state.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted')
      return false
    }

    // ALWAYS prefer Service Worker for mobile compatibility (iOS/Android)
    if (state.serviceWorkerReady || 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration) {
          const notificationOptions: NotificationOptions & { actions?: NotificationAction[] } = {
            body: options.body,
            icon: options.icon || '/icon.png',
            badge: options.badge || '/badge.png',
            tag: options.tag || 'autoreview-notification',
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
            data: options.data || { url: '/dashboard' },
            actions: [
              { action: 'open', title: 'Open App' },
              { action: 'dismiss', title: 'Dismiss' }
            ] as NotificationAction[]
          }
          await registration.showNotification(options.title, notificationOptions)
          return true
        }
      } catch (swError) {
        console.warn('Service Worker notification failed, falling back to legacy API:', swError)
      }
    }

    // Fallback for desktop browsers that don't support/have SW ready
    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon.png',
        badge: options.badge || '/badge.png',
        tag: options.tag || 'autoreview-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || { url: '/dashboard' }
      }

      const notification = new Notification(options.title, notificationOptions)

      notification.onclick = () => {
        window.focus()
        notification.close()
        const url = typeof options.data?.url === 'string' ? options.data.url : '/dashboard'
        window.location.href = url
      }

      return true
    } catch (error) {
      console.error('Error showing notification:', error)
      return false
    }
  }, [state.supported, state.permission, state.serviceWorkerReady])

  // Show notification via service worker (for background notifications)
  const showNotificationViaSW = useCallback(async (options: ShowNotificationOptions): Promise<boolean> => {
    if (!state.serviceWorkerReady) {
      // Fallback to regular notification
      return showNotification(options)
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      // Create notification options with extended type support
      const notificationOptions: NotificationOptions & { actions?: NotificationAction[] } = {
        body: options.body,
        icon: options.icon || '/icon.png',
        badge: options.badge || '/badge.png',
        tag: options.tag || 'autoreview-notification',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || { url: '/dashboard' },
        actions: [
          { action: 'open', title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss' }
        ] as NotificationAction[]
      }
      
      await registration.showNotification(options.title, notificationOptions)

      return true
    } catch (error) {
      console.error('Error showing notification via SW:', error)
      // Fallback to regular notification
      return showNotification(options)
    }
  }, [state.serviceWorkerReady, showNotification])

  // Send message to service worker
  const sendMessageToSW = useCallback(async (message: Record<string, unknown>): Promise<unknown> => {
    if (!state.serviceWorkerReady) {
      console.warn('Service Worker not ready')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel()
        
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data)
        }
        
        registration.active?.postMessage(message, [messageChannel.port2])
      })
    } catch (error) {
      console.error('Error sending message to SW:', error)
      return null
    }
  }, [state.serviceWorkerReady])

  // Schedule a notification (for reminders)
  const scheduleNotification = useCallback((delayMs: number, options: ShowNotificationOptions): number => {
    const timeoutId = window.setTimeout(() => {
      showNotification(options)
    }, delayMs)

    return timeoutId
  }, [showNotification])

  // Cancel scheduled notification
  const cancelScheduledNotification = useCallback((timeoutId: number) => {
    window.clearTimeout(timeoutId)
  }, [])

  return {
    // State
    supported: state.supported,
    permission: state.permission,
    serviceWorkerReady: state.serviceWorkerReady,
    isGranted: state.permission === 'granted',
    isDenied: state.permission === 'denied',
    isPrompt: state.permission === 'default' || state.permission === null,
    
    // Actions
    requestPermission,
    showNotification,
    showNotificationViaSW,
    registerServiceWorker,
    sendMessageToSW,
    scheduleNotification,
    cancelScheduledNotification
  }
}

export default useNotifications

// Utility function to create common notification types
export const createReviewNotification = (
  platform: string,
  rating: number,
  reviewerName?: string
): ShowNotificationOptions => {
  const isPositive = rating >= 4
  const isNegative = rating <= 2
  
  return {
    title: isPositive 
      ? `⭐ New ${rating}-Star Review!` 
      : isNegative 
        ? `⚠️ New ${rating}-Star Review` 
        : `New ${rating}-Star Review`,
    body: reviewerName 
      ? `${reviewerName} left a review on ${platform}`
      : `You received a new review on ${platform}`,
    icon: '/icon.png',
    tag: `review-${Date.now()}`,
    data: { url: '/reviews' }
  }
}

export const createAIResponseNotification = (
  reviewCount: number
): ShowNotificationOptions => ({
  title: '🤖 AI Responses Ready',
  body: `Sarah has generated ${reviewCount} response${reviewCount > 1 ? 's' : ''} to your reviews.`,
  icon: '/icon.png',
  tag: 'ai-responses',
  data: { url: '/reviews' }
})

export const createLowCreditsNotification = (
  creditsRemaining: number
): ShowNotificationOptions => ({
  title: '💳 Low Credits Warning',
  body: `You have only ${creditsRemaining} credit${creditsRemaining > 1 ? 's' : ''} remaining. Upgrade to continue using AI features.`,
  icon: '/icon.png',
  tag: 'low-credits',
  requireInteraction: true,
  data: { url: '/subscription' }
})

export const createWeeklySummaryNotification = (
  reviewCount: number,
  avgRating: number
): ShowNotificationOptions => ({
  title: '📊 Weekly Review Summary',
  body: `You received ${reviewCount} reviews this week with an average rating of ${avgRating.toFixed(1)} stars.`,
  icon: '/icon.png',
  tag: 'weekly-summary',
  data: { url: '/analytics' }
})
