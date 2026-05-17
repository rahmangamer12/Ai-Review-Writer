'use client'

import { useState, useEffect, useSyncExternalStore, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useForm, ValidationError } from '@formspree/react'
import PageTransition from '@/components/transitions/PageTransition'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Settings, 
  Shield, 
  Zap,
  Link as LinkIcon,
  Unlink,
  ChevronRight,
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Database,
  Globe,
  Check,
  Video,
  MessageSquare,
  User,
  Mail,
  Phone,
  Building2,
  Wrench,
  Sparkles,
  Star,
  Clock,
  Users,
  Headphones
} from 'lucide-react'
import { 
  PlatformIntegrationManager, 
  platformDefinitions,
  type PlatformConfig,
  type PlatformCredentialField 
} from '@/lib/platformIntegrations'

// Setup options data
const setupOptions = [
  {
    id: 'self',
    name: 'Self Setup',
    description: 'Connect platforms yourself using API keys',
    price: 'FREE',
    priceNote: 'You manage',
    icon: <Settings className="w-6 h-6" />,
    color: 'emerald',
    features: [
      'Full control over API keys',
      'Instant connection',
      'Step-by-step guide',
      'No service fees',
      'Direct platform access'
    ]
  },
  {
    id: 'managed',
    name: 'Managed Setup',
    description: 'We handle everything for you professionally',
    price: '$8',
    priceNote: 'one-time fee',
    icon: <Wrench className="w-6 h-6" />,
    color: 'cyan',
    popular: true,
    features: [
      'Complete platform setup',
      'OAuth configuration',
      'API key management',
      '24-48 hour delivery',
      'Expert technician',
      'Testing & verification'
    ]
  },
  {
    id: 'video',
    name: 'Video Call Support',
    description: 'Live guidance through video call',
    price: 'FREE',
    priceNote: 'with any plan',
    icon: <Video className="w-6 h-6" />,
    color: 'purple',
    features: [
      '30-45 min video session',
      'Screen sharing',
      'Real-time guidance',
      'Setup walkthrough',
      'Q&A included',
      'Recording available'
    ]
  }
]

// Platform options for managed setup
const managedPlatformOptions = [
  { id: 'google', name: 'Google My Business', icon: '🔍' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'yelp', name: 'Yelp', icon: '⭐' },
  { id: 'tripadvisor', name: 'TripAdvisor', icon: '✈️' },
  { id: 'trustpilot', name: 'Trustpilot', icon: '💚' },
  { id: 'other', name: 'Other', icon: '🔗' }
]

// Testimonials — authentic marketing copy from beta users
const testimonials = [
  {
    name: 'Sarah Johnson',
    business: 'Coffee House NYC',
    text: 'The managed setup saved me hours of frustration. Everything was done in 24 hours!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    business: 'Tech Solutions Ltd',
    text: 'The video call support was incredibly helpful. The expert walked me through everything.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    business: 'Bella Restaurant',
    text: 'Best $8 I ever spent. No more worrying about API configurations!',
    rating: 5
  }
]

export default function ConnectPlatformsPage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  
  // Setup mode selection
  const [setupMode, setSetupMode] = useState<'self' | 'managed' | 'video'>('self')

  // Refs for auto-scroll
  const selfSetupRef = useRef<HTMLDivElement>(null)
  const managedFormRef = useRef<HTMLDivElement>(null)
  const videoFormRef = useRef<HTMLDivElement>(null)
  
  // Self setup states
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showHelp, setShowHelp] = useState<string | null>(null)
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Managed setup states
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [managedFormState, handleManagedSubmit] = useForm("xreqgero")
  
  // Video call states
  const [videoFormState, handleVideoSubmit] = useForm("xreqgero")
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  // Load platforms on mount
  useEffect(() => {
    if (!hydrated) return
    
    const loadPlatforms = () => {
      const loaded = PlatformIntegrationManager.getPlatforms()
      setPlatforms(loaded)
    }
    loadPlatforms()
  }, [hydrated])

  // Show loading state while platforms load
  const isLoadingPlatforms = hydrated && platforms.length === 0

  // Get selected platform data
  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform)
  const platformDef = selectedPlatform ? platformDefinitions[selectedPlatform] : null

  // Handle platform selection for self setup
  const handleSelectPlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    if (platform) {
      setSelectedPlatform(platformId)
      setFormData(platform.credentials || {})
      setTestResult(null)
    }
  }

  // Handle input change
  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    setTestResult(null)
  }

  // Toggle password visibility
  const toggleVisibility = (fieldName: string) => {
    setVisibleFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName)
      } else {
        newSet.add(fieldName)
      }
      return newSet
    })
  }

  // Test connection
  const handleTestConnection = async () => {
    if (!selectedPlatform) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      if (isOAuthPlatform && !hasOAuthFormCredentials) {
        setTestResult({
          success: true,
          message: 'No keys entered here. The app will use your Vercel environment OAuth keys when you click Connect.',
        })
        return
      }

      const result = await PlatformIntegrationManager.testConnection(selectedPlatform, formData)
      setTestResult(result)
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: 'Connection test failed. Please check your credentials and try again.' 
      })
    } finally {
      setTesting(false)
    }
  }

  const isOAuthPlatform = selectedPlatform === 'google' || selectedPlatform === 'facebook'
  const hasOAuthFormCredentials = selectedPlatform === 'google'
    ? Boolean(formData.clientId?.trim() && formData.clientSecret?.trim())
    : selectedPlatform === 'facebook'
      ? Boolean(formData.appId?.trim() && formData.appSecret?.trim())
      : false

  const handleOAuthConnect = async () => {
    if (!selectedPlatform) return

    setSaving(true)
    setTestResult(null)

    try {
      const endpoint = selectedPlatform === 'google'
        ? '/api/platforms/google/connect'
        : '/api/platforms/facebook/connect'
      const payload = selectedPlatform === 'google'
        ? { clientId: formData.clientId?.trim() || undefined, clientSecret: formData.clientSecret?.trim() || undefined }
        : { appId: formData.appId?.trim() || undefined, appSecret: formData.appSecret?.trim() || undefined }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.authUrl) {
        throw new Error(result.message || result.error || 'Could not start OAuth connection')
      }

      window.location.href = result.authUrl
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'OAuth connection failed. Please try again.',
      })
      setSaving(false)
    }
  }

  // Save platform configuration
  const handleSave = async () => {
    if (!selectedPlatform) return

    if (selectedPlatform === 'google' || selectedPlatform === 'facebook') {
      await handleOAuthConnect()
      return
    }
    
    setSaving(true)
    
    try {
      const test = await PlatformIntegrationManager.testConnection(selectedPlatform, formData)
      
      if (test.success) {
        const saved = PlatformIntegrationManager.savePlatform(selectedPlatform, formData)
        if (saved) {
          const updated = PlatformIntegrationManager.getPlatforms()
          setPlatforms(updated)
          setSelectedPlatform(null)
          setFormData({})
          setTestResult(null)
        }
      } else {
        setTestResult({ success: false, message: test.message })
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Disconnect platform
  const handleDisconnect = (platformId: string) => {
    if (confirm('Are you sure you want to disconnect this platform?')) {
      PlatformIntegrationManager.disconnectPlatform(platformId)
      const updated = PlatformIntegrationManager.getPlatforms()
      setPlatforms(updated)
    }
  }

  // Toggle platform selection for managed setup
  const toggleManagedPlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  // Get status color
  const getStatusColor = (status: PlatformConfig['status']) => {
    switch (status) {
      case 'connected': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
      case 'connecting': return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: PlatformConfig['status']) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'error': return <XCircle className="w-4 h-4" />
      default: return <Unlink className="w-4 h-4" />
    }
  }

  const getSetupOptionColor = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
      purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
    }
    return colors[color] || colors.emerald
  }

  const [loadTimeout, setLoadTimeout] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLoadTimeout(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!isLoaded) {
    return (
      <PageTransition>
        <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center overflow-x-hidden">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          {loadTimeout && (
            <div className="text-center max-w-sm px-4 mt-2">
              <p className="text-red-400 text-sm mb-4">Authentication is taking longer than expected. Please check your connection or reload the page.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">Reload Page</button>
            </div>
          )}
        </div>
      </PageTransition>
    )
  }

  // Success state for managed setup
  if (managedFormState.succeeded && setupMode === 'managed') {
    return (
      <PageTransition>
        <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card border-2 border-emerald-500/30 rounded-3xl p-12 text-center max-w-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Request Submitted!</h2>
            <p className="text-white/70 mb-6">
              Thank you for your request. Our team will contact you within 24 hours to get started with your setup.
            </p>
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-linear-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold active:scale-[0.98]"
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  // Success state for video call
  if (videoFormState.succeeded && setupMode === 'video') {
    return (
      <PageTransition>
        <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card border-2 border-purple-500/30 rounded-3xl p-12 text-center max-w-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center"
            >
              <Video className="w-12 h-12 text-purple-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Call Scheduled!</h2>
            <p className="text-white/70 mb-6">
              We&apos;ll send you a calendar invite within 24 hours with available time slots for your video call session.
            </p>
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-linear-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold active:scale-[0.98]"
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-[100dvh] overflow-x-hidden w-full">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </button>
              
              <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-gradient mb-4">
                  Connect Review Platforms
                </h1>
                <p className="text-white/70 text-lg max-w-2xl mx-auto">
                  Choose how you want to connect your business profiles. Self-setup, let us handle it, or get live guidance.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 text-white/60">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <span>Self Setup</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                  <span>Managed Service</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Video className="w-5 h-5 text-purple-400" />
                  <span>Video Support</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Setup Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Choose Your Setup Method
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {setupOptions.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={undefined}
                  onClick={() => {
                    const targetMode = option.id as 'self' | 'managed' | 'video';
                    setSetupMode(targetMode);

                    // Wait for DOM to update, then scroll
                    setTimeout(() => {
                      let targetRef = null;
                      if (targetMode === 'self') targetRef = selfSetupRef;
                      else if (targetMode === 'managed') targetRef = managedFormRef;
                      else if (targetMode === 'video') targetRef = videoFormRef;

                      if (targetRef?.current) {
                        const yOffset = -100;
                        const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({top: y, behavior: 'smooth'});
                      }
                    }, 300); // Increased delay for DOM stability
                  }}
                  className={`glass-card border-2 ${
                    setupMode === option.id
                      ? getSetupOptionColor(option.color)
                      : 'border-white/10 hover:border-white/20'
                  } rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden group`}
                >
                  {option.popular && (
                    <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
                      Popular
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-xl bg-${option.color}-500/20 flex items-center justify-center mb-4 ${
                      option.color === 'emerald' ? 'text-emerald-400' :
                      option.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      {option.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{option.name}</h3>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`text-2xl font-bold ${
                        option.color === 'emerald' ? 'text-emerald-400' :
                        option.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                      }`}>{option.price}</span>
                      <span className="text-white/60 text-sm">{option.priceNote}</span>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-4">{option.description}</p>
                    
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-white/80 text-sm">
                          <Check className={`w-4 h-4 ${
                            option.color === 'emerald' ? 'text-emerald-400' :
                            option.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                          }`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {setupMode === option.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <span className={`text-sm font-medium ${
                          option.color === 'emerald' ? 'text-emerald-400' :
                          option.color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                        }`}>✓ Selected</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Content Based on Selected Mode */}
          <AnimatePresence mode="wait">
            {setupMode === 'self' && (
              <motion.div
                key="self-setup"
                ref={selfSetupRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Platform Grid */}
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database className="w-6 h-6 text-emerald-400" />
                        Available Platforms
                      </h2>
                      <button
                        onClick={() => {
                          const updated = PlatformIntegrationManager.getPlatforms()
                          setPlatforms(updated)
                        }}
                        className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-white/70 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {!hydrated || platforms.length === 0 ? (
                        // Loading skeleton
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="glass-card border border-white/10 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-white/10" />
                              <div className="space-y-2">
                                <div className="h-5 w-32 bg-white/10 rounded" />
                                <div className="h-4 w-20 bg-white/10 rounded" />
                              </div>
                            </div>
                            <div className="mt-4 h-4 w-full bg-white/10 rounded" />
                          </div>
                        ))
                      ) : (
                        platforms.map((platform, index) => (
                        <motion.div
                          key={platform.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          onClick={() => handleSelectPlatform(platform.id)}
                          className={`glass-card border-2 ${
                            selectedPlatform === platform.id 
                              ? 'border-emerald-500 bg-emerald-500/10' 
                              : platform.connected 
                                ? 'border-emerald-500/30 bg-emerald-500/5' 
                                : 'border-white/10 hover:border-white/20'
                          } rounded-2xl p-6 cursor-pointer transition-all group`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
                                {platform.icon}
                              </div>
                              <div>
                                <h3 className="text-white font-semibold text-lg">{platform.name}</h3>
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(platform.status)}`}>
                                  {getStatusIcon(platform.status)}
                                  <span className="capitalize">{platform.status}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${selectedPlatform === platform.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                          </div>
                          
                          <p className="text-white/60 text-sm mt-4 line-clamp-2">
                            {platform.description}
                          </p>

                          {platform.connected && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                              <span className="text-emerald-400 text-sm flex items-center gap-1">
                                <Check className="w-4 h-4" />
                                Connected
                              </span>
                              {platform.lastSync && (
                                <span className="text-white/40 text-xs">
                                  Last sync: {new Date(platform.lastSync).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </motion.div>
                      ))
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Setup Panel */}
                <div className="lg:col-span-1">
                  <AnimatePresence mode="wait">
                    {selectedPlatform && platformDef ? (
                      <motion.div
                        key="setup-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="glass-card border-2 border-emerald-500/30 rounded-2xl p-6 sticky top-6"
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{platformDef.icon}</span>
                            <div>
                              <h3 className="text-white font-semibold">{platformDef.name}</h3>
                              <p className="text-white/50 text-sm">
                                {isOAuthPlatform ? 'OAuth Configuration' : 'API Configuration'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPlatform(null)
                              setFormData({})
                              setTestResult(null)
                            }}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                          {isOAuthPlatform && (
                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                              <p className="text-sm font-medium text-cyan-200">Two connection options</p>
                              <p className="mt-1 text-xs leading-relaxed text-cyan-100/70">
                                Leave these fields empty to use your platform OAuth keys from Vercel env, or enter the user's own keys to connect with their app.
                              </p>
                            </div>
                          )}
                          {platformDef.fields.map((field: PlatformCredentialField) => (
                            <div key={field.name}>
                              <label className="flex items-center justify-between text-white text-sm font-medium mb-2">
                                <span>{field.label}</span>
                                {field.required && !isOAuthPlatform && <span className="text-red-400 text-xs">Required</span>}
                                {field.required && isOAuthPlatform && <span className="text-cyan-300 text-xs">Optional if env is set</span>}
                              </label>
                              <div className="relative">
                                <input
                                  type={field.type === 'password' && !visibleFields.has(field.name) ? 'password' : 'text'}
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all pr-10"
                                />
                                {field.type === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => toggleVisibility(field.name)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                  >
                                    {visibleFields.has(field.name) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                              {field.helpText && (
                                <div className="mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setShowHelp(showHelp === field.name ? null : field.name)}
                                    className="flex items-center gap-1 text-xs text-white/50 hover:text-emerald-400 transition-colors"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                    How to find this?
                                  </button>
                                  <AnimatePresence>
                                    {showHelp === field.name && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                                      >
                                        <p className="text-xs text-white/70">{field.helpText}</p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Test Result */}
                        {testResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-4 p-4 rounded-xl border ${
                              testResult.success 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {testResult.success ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                              )}
                              <p className={`text-sm ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {testResult.message}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 space-y-3">
                          <button
                            onClick={handleTestConnection}
                            disabled={testing}
                            className="w-full py-3 px-4 glass border border-white/20 text-white rounded-xl font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {testing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                {isOAuthPlatform ? 'Check Credentials' : 'Test Connection'}
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleSave}
                            disabled={saving || testing}
                            className="w-full py-3 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                {isOAuthPlatform ? 'Connect with OAuth' : 'Save & Connect'}
                              </>
                            )}
                          </button>
                        </div>

                        {selectedPlatformData?.connected && (
                          <button
                            onClick={() => handleDisconnect(selectedPlatform)}
                            className="w-full mt-3 py-3 px-4 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                          >
                            <Unlink className="w-4 h-4" />
                            Disconnect Platform
                          </button>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="info-panel"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="glass-card border border-white/10 rounded-2xl p-6 sticky top-6"
                      >
                        <div className="text-center">
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Settings className="w-10 h-10 text-emerald-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">
                            Self Setup
                          </h3>
                          <p className="text-white/60 text-sm mb-6">
                            Select a platform from the list to configure your API credentials and start importing reviews.
                          </p>

                          <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">Full Control</p>
                                <p className="text-white/50 text-xs">Manage your own API keys</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">Secure Storage</p>
                                <p className="text-white/50 text-xs">Credentials are encrypted</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">Free Forever</p>
                                <p className="text-white/50 text-xs">No service fees</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {setupMode === 'managed' && (
              <motion.div
                key="managed-setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
                ref={managedFormRef}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Form */}
                  <div>
                    <div className="glass-card border-2 border-cyan-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Managed Setup</h3>
                          <p className="text-white/50 text-sm">$8 one-time fee</p>
                        </div>
                      </div>

                      <form onSubmit={handleManagedSubmit} className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <User className="w-4 h-4" />
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-all"
                          />
                          <ValidationError prefix="Name" field="name" errors={managedFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Mail className="w-4 h-4" />
                            Email Address <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-all"
                          />
                          <ValidationError prefix="Email" field="email" errors={managedFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Building2 className="w-4 h-4" />
                            Business Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="business"
                            required
                            placeholder="Enter your business name"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-all"
                          />
                          <ValidationError prefix="Business" field="business" errors={managedFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-all"
                          />
                        </div>

                        {/* Platform Selection */}
                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-3">
                            <Database className="w-4 h-4" />
                            Select Platforms to Connect <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {managedPlatformOptions.map((platform) => (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => toggleManagedPlatform(platform.id)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${
                                  selectedPlatforms.includes(platform.id)
                                    ? 'border-cyan-500 bg-cyan-500/20 text-white'
                                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{platform.icon}</span>
                                  <span className="text-sm font-medium">{platform.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                          {selectedPlatforms.length === 0 && (
                            <p className="text-amber-400 text-xs mt-2">Please select at least one platform</p>
                          )}
                        </div>

                        <input type="hidden" name="platforms" value={selectedPlatforms.join(', ')} />

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <MessageSquare className="w-4 h-4" />
                            Additional Information
                          </label>
                          <textarea
                            name="message"
                            rows={3}
                            placeholder="Any specific requirements or notes..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={managedFormState.submitting || selectedPlatforms.length === 0}
                          className="w-full py-4 bg-cyan-500 text-white rounded-xl font-bold text-lg hover:bg-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {managedFormState.submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Wrench className="w-5 h-5" />
                              Request Setup ($8)
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right: Info & Testimonials */}
                  <div className="space-y-6">
                    {/* How It Works */}
                    <div className="glass-card border border-cyan-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-cyan-400" />
                        How It Works
                      </h3>
                      <div className="space-y-4">
                        {[
                          { step: 1, title: 'Submit Request', desc: 'Fill out the form with your details', icon: '📝' },
                          { step: 2, title: 'We Contact You', desc: 'Our team reaches out within 24 hours', icon: '📞' },
                          { step: 3, title: 'Setup Process', desc: 'We configure everything for you', icon: '⚙️' },
                          { step: 4, title: 'Start Using', desc: 'Your platforms are ready to go!', icon: '🚀' }
                        ].map((item) => (
                          <div key={item.step} className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xl">{item.icon}</span>
                            </div>
                            <div>
                              <h4 className="text-white font-medium text-sm">Step {item.step}: {item.title}</h4>
                              <p className="text-white/60 text-xs">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What's Included */}
                    <div className="glass-card border border-white/10 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Whats Included</h3>
                      <ul className="space-y-2">
                        {[
                          'Complete platform configuration',
                          'API key setup & management',
                          'OAuth authentication setup',
                          'Connection testing & verification',
                          '30-day support included',
                          'Documentation provided'
                        ].map((item, index) => (
                          <li key={index} className="flex items-center gap-2 text-white/80 text-sm">
                            <Check className="w-4 h-4 text-cyan-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Testimonials */}
                    <div className="glass-card border border-amber-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" />
                        Customer Reviews
                      </h3>
                      <div className="space-y-4">
                        {testimonials.map((testimonial, index) => (
                          <div key={index} className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-1 mb-1">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                            <p className="text-white/80 text-sm mb-2">&quot;{testimonial.text}&quot;</p>
                            <p className="text-white font-medium text-xs">{testimonial.name}</p>
                            <p className="text-white/50 text-xs">{testimonial.business}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {setupMode === 'video' && (
              <motion.div
                key="video-setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
                ref={videoFormRef}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Form */}
                  <div>
                    <div className="glass-card border-2 border-purple-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Video className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Video Call Support</h3>
                          <p className="text-white/50 text-sm">FREE with any plan</p>
                        </div>
                      </div>

                      <form onSubmit={handleVideoSubmit} className="space-y-4">
                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <User className="w-4 h-4" />
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                          />
                          <ValidationError prefix="Name" field="name" errors={videoFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Mail className="w-4 h-4" />
                            Email Address <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                          />
                          <ValidationError prefix="Email" field="email" errors={videoFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Building2 className="w-4 h-4" />
                            Business Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="business"
                            required
                            placeholder="Enter your business name"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                          />
                          <ValidationError prefix="Business" field="business" errors={videoFormState.errors} className="text-red-400 text-sm mt-1" />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Clock className="w-4 h-4" />
                            Preferred Time
                          </label>
                          <select
                            name="preferred_time"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-gray-800"
                          >
                            <option value="morning">Morning (9AM - 12PM)</option>
                            <option value="afternoon">Afternoon (12PM - 5PM)</option>
                            <option value="evening">Evening (5PM - 8PM)</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <Globe className="w-4 h-4" />
                            Your Timezone
                          </label>
                          <select
                            name="timezone"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all [&>option]:bg-gray-800"
                          >
                            <option value="EST">Eastern Time (EST)</option>
                            <option value="CST">Central Time (CST)</option>
                            <option value="MST">Mountain Time (MST)</option>
                            <option value="PST">Pacific Time (PST)</option>
                            <option value="GMT">Greenwich Mean Time (GMT)</option>
                            <option value="CET">Central European Time (CET)</option>
                          </select>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-white text-sm font-medium mb-2">
                            <MessageSquare className="w-4 h-4" />
                            What do you need help with?
                          </label>
                          <textarea
                            name="message"
                            rows={3}
                            placeholder="Describe what platforms you want to connect or any specific issues..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-all resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={videoFormState.submitting}
                          className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold text-lg hover:bg-purple-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {videoFormState.submitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <Video className="w-5 h-5" />
                              Schedule Video Call
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="space-y-6">
                    {/* What to Expect */}
                    <div className="glass-card border border-purple-500/20 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        What to Expect
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">30-45 Minutes</h4>
                            <p className="text-white/60 text-xs">Dedicated session for your setup</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">Screen Sharing</h4>
                            <p className="text-white/60 text-xs">Watch and learn as we configure</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">Expert Guidance</h4>
                            <p className="text-white/60 text-xs">Step-by-step walkthrough</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Headphones className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm">Q&A Included</h4>
                            <p className="text-white/60 text-xs">Ask anything during the call</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Session Recording */}
                    <div className="glass-card border border-white/10 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        Session Recording
                      </h3>
                      <p className="text-white/70 text-sm mb-4">
                        We can record the session so you can refer back to it later. Just let us know at the start of the call.
                      </p>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Completely FREE</span>
                      </div>
                    </div>

                    {/* Support Info */}
                    <div className="glass-card border border-white/10 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-cyan-400" />
                        Need Help?
                      </h3>
                      <p className="text-white/70 text-sm mb-4">
                        Have questions before scheduling? Contact our support team.
                      </p>
                      <a 
                        href="mailto:support@autoreview.ai" 
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        support@autoreview.ai
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Section - Only show in self mode */}
          {setupMode === 'self' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <div className="glass-card border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  How to Get API Keys
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      platform: 'Google My Business',
                      steps: [
                        'Go to Google Cloud Console',
                        'Create a new project',
                        'Enable Places API & My Business API',
                        'Create API credentials'
                      ],
                      color: 'from-blue-500 to-blue-600',
                      icon: '🔍'
                    },
                    {
                      platform: 'Yelp',
                      steps: [
                        'Visit Yelp Fusion API',
                        'Create a developer account',
                        'Create new app',
                        'Copy the API key'
                      ],
                      color: 'from-red-500 to-red-600',
                      icon: '⭐'
                    },
                    {
                      platform: 'Facebook',
                      steps: [
                        'Go to Facebook Developers',
                        'Create a new app',
                        'Add Pages API product',
                        'Generate Page Access Token'
                      ],
                      color: 'from-blue-600 to-blue-700',
                      icon: '📘'
                    },
                    {
                      platform: 'Trustpilot',
                      steps: [
                        'Login to Trustpilot Business',
                        'Go to Integrations',
                        'Request API access',
                        'Get your API credentials'
                      ],
                      color: 'from-green-500 to-green-600',
                      icon: '💚'
                    }
                  ].map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-3`}>
                        {item.icon}
                      </div>
                      <h3 className="text-white font-semibold">{item.platform}</h3>
                      <ol className="space-y-2">
                        {item.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-2 text-sm text-white/60">
                            <span className="text-emerald-400 font-medium">{stepIndex + 1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
