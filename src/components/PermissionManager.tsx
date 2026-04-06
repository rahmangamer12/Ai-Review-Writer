'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Bell, 
  BellRing,
  BellOff,
  Navigation,
  CheckCircle,
  XCircle,
  Settings,
  Shield,
  Info,
  Smartphone
} from 'lucide-react'

interface PermissionState {
  location: 'granted' | 'denied' | 'prompt' | 'checking'
  notification: 'granted' | 'denied' | 'prompt' | 'checking'
}

interface UserLocation {
  latitude: number
  longitude: number
  city?: string
  country?: string
  address?: string
}

export default function PermissionManager() {
  const [permissions, setPermissions] = useState<PermissionState>({
    location: 'checking',
    notification: 'checking'
  })
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const checkPermissions = useCallback(async () => {
    // Check location permission
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        // Try to get permission state
        if ('permissions' in navigator) {
          const locationPerm = await (navigator as any).permissions.query({ name: 'geolocation' })
          setPermissions(prev => ({ 
            ...prev, 
            location: locationPerm.state as 'granted' | 'denied' | 'prompt'
          }))
          
          locationPerm.addEventListener('change', () => {
            setPermissions(prev => ({ 
              ...prev, 
              location: locationPerm.state as 'granted' | 'denied' | 'prompt'
            }))
          })
        } else {
          // Fallback for browsers without permissions API
          (navigator as any).geolocation.getCurrentPosition(
            () => setPermissions(prev => ({ ...prev, location: 'granted' })),
            () => setPermissions(prev => ({ ...prev, location: 'prompt' })),
            { timeout: 5000 }
          )
        }
      } catch (error) {
        console.error('Error checking location permission:', error)
        setPermissions(prev => ({ ...prev, location: 'prompt' }))
      }
    } else {
      setPermissions(prev => ({ ...prev, location: 'denied' }))
    }

    // Check notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissions(prev => ({ 
        ...prev, 
        notification: Notification.permission as 'granted' | 'denied' | 'prompt'
      }))
    } else {
      setPermissions(prev => ({ ...prev, notification: 'denied' }))
    }
  }, [])

  const loadSavedLocation = useCallback(() => {
    const saved = localStorage.getItem('user-location')
    if (saved) {
      try {
        setUserLocation(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading saved location:', e)
      }
    }
  }, [])

  useEffect(() => {
    checkPermissions()
    loadSavedLocation()
    
    // Check for iOS and standalone mode
    if (typeof window !== 'undefined') {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(iOS)
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }
  }, [checkPermissions, loadSavedLocation])

  const requestLocation = async (): Promise<boolean> => {
    setIsRequesting(true)
    
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setPermissions(prev => ({ ...prev, location: 'denied' }))
        setIsRequesting(false)
        resolve(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Try to get address from coordinates (reverse geocoding)
          let locationData: UserLocation = { latitude, longitude }
          
          try {
            // Using OpenStreetMap Nominatim for free geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en-US,en' } }
            )
            
            if (response.ok) {
              const data = await response.json()
              locationData = {
                latitude,
                longitude,
                city: data.address?.city || data.address?.town || data.address?.village,
                country: data.address?.country,
                address: data.display_name
              }
            }
          } catch (error) {
            console.error('Error getting address:', error)
          }
          
          // Save location
          localStorage.setItem('user-location', JSON.stringify(locationData))
          setUserLocation(locationData)
          setPermissions(prev => ({ ...prev, location: 'granted' }))
          setIsRequesting(false)
          resolve(true)
        },
        (error: GeolocationPositionError) => {
          // Gracefully handled: user denied or extension blocked it. No need to spam console causing dev overlay.
          setPermissions(prev => ({ ...prev, location: 'denied' }))
          setIsRequesting(false)
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  const requestNotificationPermission = async (): Promise<boolean> => {
    setIsRequesting(true)
    
    try {
      if (!('Notification' in window)) {
        setPermissions(prev => ({ ...prev, notification: 'denied' }))
        setIsRequesting(false)
        return false
      }

      // Pillar 3: iOS 16.4+ Compliance Rule
      if (isIOS && !isStandalone) {
        setIsRequesting(false)
        return false
      }

      let permission: NotificationPermission;
      try {
        permission = await Notification.requestPermission()
      } catch (e) {
        permission = await new Promise((resolve) => {
          Notification.requestPermission(resolve);
        });
      }
      setPermissions(prev => ({ ...prev, notification: permission as 'granted' | 'denied' | 'prompt' }))
      
      if (permission === 'granted') {
        // Show a welcome notification
        showNotification(
          '🎉 Notifications Enabled!',
          'You\'ll now receive updates about new reviews and AI responses.',
          '/icon.png'
        )
        
        // Register service worker for background notifications
        await registerServiceWorker()
      }
      
      setIsRequesting(false)
      return permission === 'granted'
    } catch (error) {
      console.error('Notification error:', error)
      setPermissions(prev => ({ ...prev, notification: 'denied' }))
      setIsRequesting(false)
      return false
    }
  }

  const registerServiceWorker = async () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/notification-sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  const showNotification = (title: string, body: string, icon: string = '/icon.png') => {
    if (typeof window !== 'undefined' && permissions.notification === 'granted' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon,
        badge: '/badge.png',
        tag: `autoreview-notification-${Date.now()}`,
        requireInteraction: false,
        silent: false
      })
    }
  }

  // Simulate receiving a notification (for demo)
  const simulateNotification = () => {
    if (typeof window === 'undefined') return
    
    const notifications = [
      { title: '⭐ New 5-Star Review!', body: 'You received a new positive review on Google.' },
      { title: '🤖 AI Response Ready', body: 'Sarah has generated a response to your latest review.' },
      { title: '⚠️ Negative Review Alert', body: 'A customer left a 2-star review. Check it out!' },
      { title: '💳 Low Credits Warning', body: 'You have only 10 credits remaining.' }
    ]
    
    const random = notifications[Math.floor(Math.random() * notifications.length)]
    showNotification(random.title, random.body)
  }

  return (
    <>
      {/* Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location Permission Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card border border-white/10 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                permissions.location === 'granted' 
                  ? 'bg-emerald-500/20' 
                  : permissions.location === 'denied'
                  ? 'bg-red-500/20'
                  : 'bg-amber-500/20'
              }`}>
                <MapPin className={`w-6 h-6 ${
                  permissions.location === 'granted' 
                    ? 'text-emerald-400' 
                    : permissions.location === 'denied'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`} />
              </div>
              <div>
                <h3 className="text-white font-semibold">Location Access</h3>
                <p className="text-white/50 text-sm">
                  {permissions.location === 'granted' 
                    ? 'Access granted' 
                    : permissions.location === 'denied'
                    ? 'Access denied'
                    : 'Permission needed'}
                </p>
              </div>
            </div>
            {permissions.location === 'granted' && (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            {permissions.location === 'denied' && (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>

          {userLocation && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                <Navigation className="w-4 h-4" />
                <span className="font-medium">Current Location</span>
              </div>
              <p className="text-white/80 text-sm">
                {userLocation.city && userLocation.country 
                  ? `${userLocation.city}, ${userLocation.country}`
                  : `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              if (permissions.location === 'granted') {
                setShowLocationModal(true)
              } else {
                requestLocation()
              }
            }}
            disabled={isRequesting || permissions.location === 'denied'}
            className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              permissions.location === 'granted'
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : permissions.location === 'denied'
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Requesting...
              </>
            ) : permissions.location === 'granted' ? (
              <>
                <Settings className="w-4 h-4" />
                Manage Location
              </>
            ) : permissions.location === 'denied' ? (
              <>
                <Shield className="w-4 h-4" />
                Blocked in Browser
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Allow Location Access
              </>
            )}
          </button>
        </motion.div>

        {/* Notification Permission Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-white/10 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                permissions.notification === 'granted' 
                  ? 'bg-emerald-500/20' 
                  : permissions.notification === 'denied'
                  ? 'bg-red-500/20'
                  : 'bg-amber-500/20'
              }`}>
                {permissions.notification === 'granted' ? (
                  <BellRing className="w-6 h-6 text-emerald-400" />
                ) : permissions.notification === 'denied' ? (
                  <BellOff className="w-6 h-6 text-red-400" />
                ) : (
                  <Bell className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">Push Notifications</h3>
                <p className="text-white/50 text-sm">
                  {permissions.notification === 'granted' 
                    ? 'Notifications enabled' 
                    : permissions.notification === 'denied'
                    ? 'Notifications blocked'
                    : 'Enable for updates'}
                </p>
              </div>
            </div>
            {permissions.notification === 'granted' && (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            {permissions.notification === 'denied' && (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            {isIOS && !isStandalone && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Install Required</span>
              </div>
            )}
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>New review alerts</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>AI response ready</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Low credit warnings</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (permissions.notification === 'granted') {
                  simulateNotification()
                } else {
                  requestNotificationPermission()
                }
              }}
              disabled={isRequesting || permissions.notification === 'denied' || (isIOS && !isStandalone)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                permissions.notification === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : permissions.notification === 'denied' || (isIOS && !isStandalone)
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Requesting...
                </>
              ) : permissions.notification === 'granted' ? (
                <>
                  <Bell className="w-4 h-4" />
                  Test Notification
                </>
              ) : isIOS && !isStandalone ? (
                <>
                  <Smartphone className="w-4 h-4" />
                  Install App First
                </>
              ) : permissions.notification === 'denied' ? (
                <>
                  <Shield className="w-4 h-4" />
                  Blocked in Browser
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  Enable Notifications
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Location Details Modal */}
      <AnimatePresence>
        {showLocationModal && userLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Location</h3>
                  <p className="text-white/60 text-sm">Detected from your device</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-xs mb-1">Coordinates</p>
                  <p className="text-white font-mono">
                    {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </p>
                </div>

                {userLocation.city && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-white/50 text-xs mb-1">City</p>
                    <p className="text-white">{userLocation.city}</p>
                  </div>
                )}

                {userLocation.country && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-white/50 text-xs mb-1">Country</p>
                    <p className="text-white">{userLocation.country}</p>
                  </div>
                )}

                {userLocation.address && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-white/50 text-xs mb-1">Full Address</p>
                    <p className="text-white text-sm">{userLocation.address}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => requestLocation()}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  Update Location
                </button>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 py-3 glass text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-white/80 text-sm">
            <span className="font-semibold text-white">Why do we need these permissions?</span>
          </p>
          <ul className="text-white/60 text-sm mt-2 space-y-1">
            <li>• <strong>Location:</strong> To show local business insights and nearby reviews</li>
            <li>• <strong>Notifications:</strong> To alert you about new reviews and AI responses in real-time</li>
          </ul>
          <p className="text-white/40 text-xs mt-2">
            Your data is secure and never shared with third parties. You can revoke permissions anytime.
          </p>
        </div>
      </motion.div>
    </>
  )
}

// Utility function to show notification from anywhere in the app
export const showBrowserNotification = (title: string, body: string, icon: string = '/icon.png') => {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/badge.png',
      tag: 'autoreview-notification',
      requireInteraction: false
    })
  }
}

// Utility to check if notifications are enabled
export const areNotificationsEnabled = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
}

// Utility to get user location
export const getUserLocation = (): UserLocation | null => {
  const saved = localStorage.getItem('user-location')
  return saved ? JSON.parse(saved) : null
}
