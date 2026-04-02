'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Wallet,
  BarChart3,
  Shield,
  Info,
  Settings,
  Loader2
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationType {
  id: string
  icon: React.ReactNode
  title: string
  description: string
}

const notificationTypes: NotificationType[] = [
  {
    id: 'new-reviews',
    icon: <Sparkles className="w-4 h-4" />,
    title: 'New Reviews',
    description: 'Get notified when you receive new reviews on any platform'
  },
  {
    id: 'ai-responses',
    icon: <MessageSquare className="w-4 h-4" />,
    title: 'AI Responses Ready',
    description: 'Sarah has generated responses for your reviews'
  },
  {
    id: 'low-credits',
    icon: <Wallet className="w-4 h-4" />,
    title: 'Low Credits Warning',
    description: 'Alert when your AI credits are running low'
  },
  {
    id: 'weekly-summary',
    icon: <BarChart3 className="w-4 h-4" />,
    title: 'Weekly Summary',
    description: 'Weekly digest of your review performance'
  }
]

interface NotificationManagerProps {
  className?: string
}

export default function NotificationManager({ className = '' }: NotificationManagerProps) {
  const {
    supported,
    permission,
    isGranted,
    isDenied,
    isPrompt,
    requestPermission,
    showNotification
  } = useNotifications()

  const [isRequesting, setIsRequesting] = useState(false)
  const [showTestSuccess, setShowTestSuccess] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    reviewAlerts: true,
    aiUpdates: true,
    creditWarnings: true,
    weeklySummaries: true
  })

  const toggleSetting = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleEnableNotifications = useCallback(async () => {
    setIsRequesting(true)
    const granted = await requestPermission()
    setIsRequesting(false)
    return granted
  }, [requestPermission])

  const handleTestNotification = useCallback(async () => {
    // Ensure notifications are granted before attempting to show
    if (!isGranted) {
      console.warn('Cannot send test notification: permission not granted')
      return
    }

    // Force create a new notification each time
    const timestamp = Date.now()
    const success = await showNotification({
      title: '🎉 Test Notification!',
      body: 'Notifications are working properly! You\'ll receive updates when new reviews arrive.',
      icon: '/icon.png',
      tag: `test-notification-${timestamp}`,
      data: { url: '/dashboard' }
    })

    if (success) {
      setShowTestSuccess(true)
      setTimeout(() => setShowTestSuccess(false), 3000)
    } else {
      // Try using browser notification directly as fallback
      if (Notification.permission === 'granted') {
        const notification = new Notification('🎉 Test Notification!', {
          body: 'Notifications are working properly!',
          icon: '/icon.png',
          tag: `test-notification-${timestamp}`
        })
        setShowTestSuccess(true)
        setTimeout(() => {
          setShowTestSuccess(false)
          notification.close()
        }, 3000)
      }
    }
  }, [showNotification, isGranted])

  const getStatusConfig = () => {
    if (!supported) {
      return {
        icon: <BellOff className="w-6 h-6" />,
        iconBg: 'bg-gray-500/20',
        iconColor: 'text-gray-400',
        title: 'Not Supported',
        description: 'Your browser doesn\'t support push notifications',
        statusColor: 'text-gray-400',
        badgeBg: 'bg-gray-500/20',
        badgeText: 'Unsupported'
      }
    }

    if (isGranted) {
      return {
        icon: <BellRing className="w-6 h-6" />,
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        title: 'Notifications Enabled',
        description: 'You\'re all set to receive updates',
        statusColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20',
        badgeText: 'Active'
      }
    }

    if (isDenied) {
      return {
        icon: <BellOff className="w-6 h-6" />,
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400',
        title: 'Notifications Blocked',
        description: 'Enable notifications in your browser settings',
        statusColor: 'text-red-400',
        badgeBg: 'bg-red-500/20',
        badgeText: 'Blocked'
      }
    }

    return {
      icon: <Bell className="w-6 h-6" />,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      title: 'Enable Notifications',
      description: 'Stay updated with real-time alerts',
      statusColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'Pending'
    }
  }

  const status = getStatusConfig()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Notification Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border-2 border-primary/20 rounded-2xl overflow-hidden"
      >
        {/* Header Section */}
        <div className="relative p-6 sm:p-8">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/10 via-transparent to-[#0F172A]/50" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Icon and Title */}
              <div className="flex items-start gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`w-14 h-14 ${status.iconBg} rounded-2xl flex items-center justify-center shrink-0`}
                >
                  <span className={status.iconColor}>{status.icon}</span>
                </motion.div>
                
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {status.title}
                  </h2>
                  <p className="text-white/60 text-sm">{status.description}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.badgeBg} shrink-0`}>
                {isGranted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isDenied && <XCircle className="w-4 h-4 text-red-400" />}
                {isPrompt && <AlertCircle className="w-4 h-4 text-amber-400" />}
                {!supported && <BellOff className="w-4 h-4 text-gray-400" />}
                <span className={`text-sm font-medium ${status.statusColor}`}>
                  {status.badgeText}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
              {isPrompt && supported && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEnableNotifications}
                  disabled={isRequesting}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#00D4FF] to-cyan-500 text-[#0F172A] rounded-xl font-semibold transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Requesting Permission...
                    </>
                  ) : (
                    <>
                      <BellRing className="w-5 h-5" />
                      Enable Notifications
                    </>
                  )}
                </motion.button>
              )}

              {isGranted && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTestNotification}
                    className="px-6 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Send Test Notification
                  </motion.button>
                </div>
              )}

              {isDenied && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white/80 text-sm font-medium mb-1">
                        How to enable notifications:
                      </p>
                      <ol className="text-white/60 text-sm space-y-1 list-decimal list-inside">
                        <li>Click the lock/info icon in your browser&apos;s address bar</li>
                        <li>Find &quot;Notifications&quot; in the site settings</li>
                        <li>Change it from &quot;Block&quot; to &quot;Allow&quot;</li>
                        <li>Refresh the page</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {!supported && (
                <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                  <p className="text-white/60 text-sm">
                    Your current browser doesn&apos;t support web notifications. 
                    Try using Chrome, Firefox, Safari, or Edge for the best experience.
                  </p>
                </div>
              )}
            </div>

            {/* Test Success Message */}
            <AnimatePresence>
              {showTestSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                >
                  <p className="text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Test notification sent! Check your system notifications.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Notification Types Section */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">What You&apos;ll Receive</h3>
              <p className="text-white/50 text-sm">
                {isGranted 
                  ? 'Active notification types' 
                  : 'Enable notifications to receive these alerts'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notificationTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-xl border transition-all ${
                  isGranted
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isGranted 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-white/10 text-white/60'
                  }`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium text-sm">{type.title}</h4>
                      {isGranted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-white/50 text-xs mt-0.5">{type.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="p-4 bg-[#0F172A]/50 border border-white/10 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#00D4FF] shrink-0 mt-0.5" />
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">
                  Your Privacy Matters
                </p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Notifications are delivered directly through your browser. 
                  We never share your notification preferences with third parties. 
                  You can disable notifications at any time through your browser settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Card (only shown when enabled) */}
      {isGranted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00D4FF]" />
            Notification Settings
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-white/80 text-sm">Review Alerts</span>
              </div>
              <button
                onClick={() => toggleSetting('reviewAlerts')}
                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${
                  notificationSettings.reviewAlerts
                    ? 'bg-emerald-500'
                    : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                  notificationSettings.reviewAlerts ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-white/80 text-sm">AI Response Updates</span>
              </div>
              <button
                onClick={() => toggleSetting('aiUpdates')}
                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${
                  notificationSettings.aiUpdates
                    ? 'bg-emerald-500'
                    : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                  notificationSettings.aiUpdates ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-white/80 text-sm">Credit Warnings</span>
              </div>
              <button
                onClick={() => toggleSetting('creditWarnings')}
                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${
                  notificationSettings.creditWarnings
                    ? 'bg-emerald-500'
                    : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                  notificationSettings.creditWarnings ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-white/80 text-sm">Weekly Summaries</span>
              </div>
              <button
                onClick={() => toggleSetting('weeklySummaries')}
                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${
                  notificationSettings.weeklySummaries
                    ? 'bg-emerald-500'
                    : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                  notificationSettings.weeklySummaries ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <p className="text-white/40 text-xs mt-4">
            Toggle individual notification types on or off as needed.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// Export utility for programmatic use
export { useNotifications }
