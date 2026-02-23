'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, 
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  Globe,
  Locate
} from 'lucide-react'
import { useLocation } from '@/hooks/useLocation'

interface LocationPermissionProps {
  /** Called when location is successfully granted */
  onGranted?: () => void
  /** Called when location permission is denied */
  onDenied?: () => void
  /** Custom title for the permission request */
  title?: string
  /** Custom description explaining why location is needed */
  description?: string
  /** Whether to show as a compact card instead of a modal */
  compact?: boolean
  /** Additional CSS classes */
  className?: string
}

export default function LocationPermission({
  onGranted,
  onDenied,
  title = 'Enable Location Access',
  description = 'Allow access to your location to see local business insights, nearby reviews, and personalized recommendations in your area.',
  compact = false,
  className = ''
}: LocationPermissionProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const {
    location,
    address,
    permission,
    supported,
    loading,
    error,
    requestLocation,
    refreshLocation,
    clearLocation
  } = useLocation()

  const handleRequestLocation = async () => {
    const success = await requestLocation()
    if (success) {
      onGranted?.()
    } else {
      onDenied?.()
    }
  }

  const handleRefresh = async () => {
    await refreshLocation()
  }

  const handleClear = () => {
    clearLocation()
  }

  // Format location display string
  const getLocationDisplay = () => {
    if (address?.city && address?.country) {
      return `${address.city}, ${address.country}`
    }
    if (address?.city) {
      return address.city
    }
    if (address?.country) {
      return address.country
    }
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    }
    return 'Location detected'
  }

  // Get status icon and colors based on permission state
  const getStatusConfig = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          glowColor: 'shadow-emerald-500/20',
          statusText: 'Location enabled',
          statusColor: 'text-emerald-400'
        }
      case 'denied':
        return {
          icon: XCircle,
          iconColor: 'text-rose-400',
          bgColor: 'bg-rose-500/20',
          borderColor: 'border-rose-500/30',
          glowColor: 'shadow-rose-500/20',
          statusText: 'Access denied',
          statusColor: 'text-rose-400'
        }
      case 'checking':
        return {
          icon: Loader2,
          iconColor: 'text-cyan-400',
          bgColor: 'bg-cyan-500/20',
          borderColor: 'border-cyan-500/30',
          glowColor: 'shadow-cyan-500/20',
          statusText: 'Checking...',
          statusColor: 'text-cyan-400'
        }
      default:
        return {
          icon: MapPin,
          iconColor: 'text-amber-400',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-500/30',
          glowColor: 'shadow-amber-500/20',
          statusText: 'Permission needed',
          statusColor: 'text-amber-400'
        }
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  // Compact card variant
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card border ${status.borderColor} rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
            <StatusIcon className={`w-5 h-5 ${status.iconColor} ${permission === 'checking' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {permission === 'granted' ? getLocationDisplay() : title}
            </p>
            <p className={`text-xs ${status.statusColor}`}>
              {status.statusText}
            </p>
          </div>
          {permission !== 'granted' && permission !== 'checking' && (
            <button
              onClick={handleRequestLocation}
              disabled={loading || !supported || permission === 'denied'}
              className="px-3 py-1.5 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // Full card/modal variant
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden rounded-2xl border ${status.borderColor} bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/90 backdrop-blur-xl shadow-2xl ${status.glowColor} ${className}`}
      >
        {/* Background gradient effects */}
        <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#00D4FF]/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-[#00D4FF]/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <motion.div 
              className={`w-14 h-14 rounded-2xl ${status.bgColor} flex items-center justify-center shrink-0`}
              animate={permission === 'granted' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {permission === 'granted' ? (
                <Globe className="w-7 h-7 text-emerald-400" />
              ) : (
                <MapPin className={`w-7 h-7 ${status.iconColor}`} />
              )}
            </motion.div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                {permission === 'granted' ? 'Location Enabled' : title}
              </h3>
              <p className={`text-sm ${status.statusColor} flex items-center gap-1.5`}>
                <span className={`w-2 h-2 rounded-full ${status.bgColor.replace('/20', '')}`} />
                {status.statusText}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {/* Granted State - Show Location */}
            {permission === 'granted' && address && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                  <Navigation className="w-4 h-4" />
                  <span className="font-medium">Current Location</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {getLocationDisplay()}
                </p>
                {address.region && (
                  <p className="text-white/50 text-sm mt-1">
                    {address.region}
                    {address.postalCode && ` • ${address.postalCode}`}
                  </p>
                )}
                {location.accuracy && (
                  <p className="text-emerald-400/60 text-xs mt-2">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </p>
                )}
              </motion.div>
            )}

            {/* Granted State - Show coordinates if no address */}
            {permission === 'granted' && !address && location.latitude && location.longitude && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
                  <Navigation className="w-4 h-4" />
                  <span className="font-medium">Location Detected</span>
                </div>
                <p className="text-white text-lg font-semibold">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Coordinates detected successfully
                </p>
              </motion.div>
            )}

            {/* Denied State */}
            {permission === 'denied' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium text-sm mb-1">
                      Location access blocked
                    </p>
                    <p className="text-white/60 text-sm">
                      Please enable location permission in your browser settings to use this feature.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prompt State - Show Benefits */}
            {permission === 'prompt' && (
              <div className="space-y-3">
                <p className="text-white/70 text-sm leading-relaxed">
                  {description}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-white/60 text-xs p-2 bg-white/5 rounded-lg">
                    <Locate className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Local insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs p-2 bg-white/5 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Nearby reviews</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && permission !== 'denied' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <p className="text-rose-400 text-sm">{error}</p>
              </div>
            )}

            {/* Not Supported Message */}
            {!supported && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-400 text-sm">
                  Geolocation is not supported by your browser.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {permission === 'granted' ? (
              <>
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors text-sm"
                >
                  View Details
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      Update
                    </>
                  )}
                </button>
              </>
            ) : permission === 'denied' ? (
              <button
                onClick={handleRequestLocation}
                disabled={loading}
                className="w-full py-2.5 bg-white/10 text-white/50 rounded-xl font-medium cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Blocked in Browser
              </button>
            ) : (
              <button
                onClick={handleRequestLocation}
                disabled={loading || !supported}
                className="w-full py-3 bg-gradient-to-r from-[#00D4FF] to-[#00D4FF]/80 hover:from-[#00D4FF]/90 hover:to-[#00D4FF]/70 text-[#0F172A] font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#00D4FF]/20 hover:shadow-[#00D4FF]/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Enable Location
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Location Details Modal */}
      <AnimatePresence>
        {showDetails && permission === 'granted' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card border border-white/10 rounded-2xl p-6 max-w-md w-full bg-gradient-to-br from-[#1E293B] to-[#0F172A]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Location</h3>
                  <p className="text-white/50 text-sm">Detected from your device</p>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-3 mb-6">
                {address?.city && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">City</p>
                    <p className="text-white font-medium">{address.city}</p>
                  </div>
                )}

                {address?.region && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">Region</p>
                    <p className="text-white font-medium">{address.region}</p>
                  </div>
                )}

                {address?.country && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">Country</p>
                    <p className="text-white font-medium">{address.country}</p>
                  </div>
                )}

                {address?.postalCode && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">Postal Code</p>
                    <p className="text-white font-medium">{address.postalCode}</p>
                  </div>
                )}

                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-white/40 text-xs mb-1">Coordinates</p>
                  <p className="text-white font-mono text-sm">
                    {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </p>
                </div>

                {location.accuracy && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">Accuracy</p>
                    <p className="text-emerald-400 text-sm">±{Math.round(location.accuracy)} meters</p>
                  </div>
                )}

                {address?.fullAddress && (
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/40 text-xs mb-1">Full Address</p>
                    <p className="text-white/80 text-sm">{address.fullAddress}</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  Refresh
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl font-medium transition-colors text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Export a hook-based usage example for convenience
export function useLocationPermission() {
  const location = useLocation()
  
  return {
    ...location,
    isGranted: location.permission === 'granted',
    isDenied: location.permission === 'denied',
    isPrompt: location.permission === 'prompt',
    isChecking: location.permission === 'checking'
  }
}
