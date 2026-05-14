'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser, useClerk } from '@clerk/nextjs'
import { Menu, X, Sparkles, LayoutDashboard, MessageSquare, BarChart3, Plug2, User, Settings, FileText, Puzzle, LogOut, Bot, Download } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { useToast } from '@/components/ui/Toast'
import { sanitizationService } from '@/lib/sanitization'

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

function UserProfile() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [userData, setUserData] = useState<{ plan: string, aiCredits: number, promptCount: number } | null>(null)
  const hydrated = useHydrated()

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setUserData(null)
      return
    }

    let isMounted = true
    let retryCount = 0
    const MAX_RETRIES = 3

    const fetchUserData = async () => {
      // Don't fetch if component unmounted or max retries reached
      if (!isMounted || retryCount >= MAX_RETRIES) return

      try {
        const response = await fetch('/api/user/me', {
          cache: 'no-store'
        })

        // 401 = not signed in, silently bail
        if (response.status === 401 || response.status === 500) {
          setUserData(null)
          return
        }

        const text = await response.text()

        // Check if response is NOT valid JSON
        const isJson = text.trim().startsWith('{') || text.trim().startsWith('[')

        if (!isJson) {
          setUserData(null)
          return
        }

        const data = JSON.parse(text)

        if (data.planType && isMounted) {
          setUserData({ plan: data.planType, aiCredits: data.aiCredits, promptCount: data.promptCount || 0 })
          retryCount = 0 // Reset on success
        }
      } catch (err) {
        retryCount++
        // Silently handle - don't show error
        if (isMounted) {
          setUserData(null)
        }
      }
    }

    fetchUserData()

    // Reduced from 30s to 60s to prevent API spam
    const interval = setInterval(() => {
      if (isMounted) {
        fetchUserData()
      }
    }, 60000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [isLoaded, isSignedIn])

  const handleSignOut = async () => {
    await signOut()
  }

  const plan = userData?.plan || 'Free'
  const credits = userData?.aiCredits ?? 0
  const promptCount = userData?.promptCount ?? 0

  return (
    <div className="rounded-xl p-2 sm:p-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <UserButton afterSignOutUrl="/" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">
            {user?.firstName || user?.username || 'User'}
          </p>
          <p className="text-[9px] text-white/60 truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>
      <div className="text-[9px] text-white/50 space-y-1">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
          <span className="capitalize">Plan: {plan}</span>
          <Link href="/subscription" className="text-primary hover:text-primary/80 hover:underline font-medium transition-all text-[9px]">
            Upgrade ✨
          </Link>
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5">
          <div className="flex items-center justify-between">
            <span>Credits: {credits}</span>
            <Link href="/subscription" className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-all text-[9px]">
              Get More 💳
            </Link>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between items-center text-[8px] uppercase tracking-tighter text-white/40">
              <span>Usage Progress</span>
              <span>{promptCount}/10 prompts</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(promptCount / 10) * 100}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-colors text-xs font-medium"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const [isHovered, setIsHovered] = useState<string | null>(null)
  const { canInstall, isInstalled, isChecking, triggerInstall, deferredPrompt: currentPrompt } = usePWAInstall();
  const { success: toastSuccess } = useToast()
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installInstructions, setInstallInstructions] = useState<{title: string, desc: string, icon: any} | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installStarted, setInstallStarted] = useState(false)

  const menuKey = `${pathname}-${mobileMenuOpen}`

  const handleInstallClick = async () => {
    if (isInstalling || installStarted) return
    
    setIsInstalling(true)
    setInstallStarted(true)

    if (isInstalled) {
      toastSuccess('Already installed', 'Check your home screen or app list.')
      setIsInstalling(false)
      return
    }

    console.log('Install clicked - canInstall:', canInstall, 'hasPrompt:', !!currentPrompt)

    if (canInstall && currentPrompt) {
      try {
        await currentPrompt.prompt()
        const { outcome } = await currentPrompt.userChoice
        console.log('Install outcome:', outcome)
        if (outcome === 'accepted') {
          console.log('App installed!')
        }
      } catch (e) {
        console.log('Install prompt error:', e)
      }
      setIsInstalling(false)
      return
    }

    if (typeof window === 'undefined') {
      setIsInstalling(false)
      return
    }

    const ua = navigator.userAgent.toLowerCase()
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const isAndroid = /android/.test(ua) && !/windows/.test(ua)
    const isMacSafari = /macintosh/.test(ua) && /safari/.test(ua) && !/chrome/.test(ua) && !/crios/.test(ua)
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
    
    if (isIOS || (isMobile && !isAndroid)) {
      setInstallInstructions({
        title: 'Install on iPhone/iPad',
        desc: "1. Tap the Share button below ↓\n\n2. Scroll down and tap 'Add to Home Screen'\n\n3. Tap 'Add' to confirm",
        icon: '📱'
      })
      setShowInstallModal(true)
    } else if (isAndroid) {
      setInstallInstructions({
        title: 'Install on Android',
        desc: "1. Tap the menu (⋮) in top right corner\n\n2. Tap 'Add to Home Screen' or 'Install'\n\n3. Tap 'Install' to confirm",
        icon: '📲'
      })
      setShowInstallModal(true)
    } else if (isMacSafari) {
      setInstallInstructions({
        title: 'Install on Mac Safari',
        desc: "1. Click the Share button in toolbar ↑\n\n2. Click 'Add to Dock'\n\n3. App will appear in your Dock",
        icon: '🍎'
      })
      setShowInstallModal(true)
    } else {
      setInstallInstructions({
        title: 'Install App',
        desc: "Click the install icon in your address bar, OR click the menu (⋮) and select 'Install'",
        icon: '💻'
      })
      setShowInstallModal(true)
    }

    setIsInstalling(false)
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      href: '/chat',
      label: 'AI Chat',
      icon: Bot,
      description: 'Ask Sarah AI',
      gradient: 'from-violet-500 to-indigo-500'
    },
    {
      href: '/reviews',
      label: 'Reviews',
      icon: MessageSquare,
      description: 'Manage Reviews',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'AI Insights',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      href: '/connect-platforms',
      label: 'Platforms',
      icon: Plug2,
      description: 'Connect Reviews',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      description: 'My Account',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Configure AI',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      href: '/extension',
      label: 'Extension',
      icon: Puzzle,
      description: 'Chrome Extension',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      href: '/docs',
      label: 'Documentation',
      icon: FileText,
      description: 'Help & Guide',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ]

  const isActive = (href: string) => pathname === href

  // Prevent hydration mismatch by not rendering until mounted
  if (!hydrated) {
    return null
  }

  return (
    <>
      {/* Skip Navigation Link - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
      >
        Skip to main content
      </a>

      {/* Mobile Header - Native Minimal - EDGE TO EDGE */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-white/5 px-4 h-[calc(57px+env(safe-area-inset-top))] flex items-end pb-3 max-w-[100vw]">
        <div className="w-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 min-h-[44px] active:scale-95 transition-transform">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">AutoReview</h1>
          </Link>
          <div className="flex items-center gap-2">
            <SignedIn>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
            </SignedIn>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 active:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-[1000]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer - Native Bottom Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setMobileMenuOpen(false)
              }
            }}
            className="lg:hidden fixed inset-x-0 bottom-0 max-h-[85dvh] bg-[#0f0f14] rounded-t-[32px] border-t border-white/10 flex flex-col z-[1001] shadow-2xl max-w-[100vw] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            {/* Native Drag Handle - Fixed at top of drawer */}
            <div className="w-full pt-4 pb-2 bg-[#0f0f14] rounded-t-[32px] flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto" />
            </div>
            
            {/* Scrollable Area - Content goes here */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(10rem+env(safe-area-inset-bottom))] custom-scrollbar">
              <div className="space-y-2 py-4">
                {navItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all active:scale-[0.97] min-h-[56px] ${
                      isActive(item.href)
                        ? 'bg-purple-600/20 text-white border border-purple-500/30'
                        : 'text-white/60 hover:text-white bg-white/5'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label={`Go to ${item.label}`}
                    title={item.description}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? 'text-purple-400' : ''}`} />
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                {/* Install App Button - Always visible until installed */}
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] shadow-lg ${
                    isInstalled 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isInstalling
                      ? 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300 cursor-wait'
                      : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500/30 shadow-emerald-900/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isInstalled ? (
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    ) : isInstalling ? (
                      <div className="w-6 h-6 animate-spin">
                        <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : (
                      <Download className="w-6 h-6" />
                    )}
                    <span className="text-base">
                      {isInstalled ? 'App Installed ✓' : isInstalling ? 'Installing...' : 'Install App'}
                    </span>
                  </div>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${isInstalled ? 'bg-emerald-500/20' : 'bg-emerald-500/20'}`}>
                    PWA
                  </div>
                </button>

                <SignedOut>
                  <div className="grid grid-cols-2 gap-3">
                    <SignInButton mode="modal">
                      <button className="px-4 py-4 rounded-2xl bg-white/5 text-white font-semibold border border-white/10 active:scale-95 transition-transform min-h-[48px]">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-4 py-4 rounded-2xl bg-purple-600 text-white font-semibold active:scale-95 transition-transform min-h-[48px]">
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="w-full">
                    <UserProfile />
                  </div>
                </SignedIn>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar - iOS/Android Native Style - EDGE TO EDGE */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full flex items-center justify-around bg-background/95 backdrop-blur-2xl border-t border-white/10 z-[999] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] px-2 max-w-[100vw]">
        {[
          { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
          { href: '/reviews', icon: MessageSquare, label: 'Reviews' },
          { href: '/chat', icon: Bot, label: 'Chat' },
          { href: '/analytics', icon: BarChart3, label: 'Analytics' },
          { href: '/profile', icon: User, label: 'Profile' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all active:scale-[0.85] ${
              isActive(item.href)
                ? 'text-purple-500'
                : 'text-white/40'
            }`}
          >
            <item.icon className={`transition-all ${isActive(item.href) ? 'w-6 h-6' : 'w-5 h-5 opacity-80'}`} />
            <span className={`text-[10px] font-medium tracking-tight transition-opacity ${isActive(item.href) ? 'opacity-100' : 'opacity-60'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Desktop Navigation - Fixed sidebar with enhanced hover states */}
      <nav
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 p-3 lg:p-4 xl:p-5 flex-col z-40 shadow-2xl custom-scrollbar overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(15, 15, 25, 0.95) 100%)',
        }}
        suppressHydrationWarning
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex-shrink-0"
        >
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform duration-300">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">AutoReview</h1>
              <p className="text-xs text-white/60">Intelligent Review Management</p>
            </div>
          </Link>
        </motion.div>

        {/* Navigation Items */}
        <div className="space-y-1.5 lg:space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              onMouseEnter={() => setIsHovered(item.href)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <Link
                href={item.href}
                className={`relative flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive(item.href)
                    ? 'bg-gradient-to-r from-primary/30 to-primary/20 text-white border border-primary/40 shadow-lg shadow-primary/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:border hover:border-white/20 hover:shadow-md'
                  }`}
                style={{
                  backdropFilter: 'blur(10px)',
                }}
                aria-label={`Navigate to ${item.label}`}
                title={item.description}
              >
                {/* Background Gradient on Hover/Active */}
                {(isActive(item.href) || isHovered === item.href) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive(item.href) ? 0.1 : 0.05 }}
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} pointer-events-none`}
                  />
                )}

                {/* Active Indicator */}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${item.gradient} rounded-r-full pointer-events-none`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <span className="group-hover:scale-110 transition-transform duration-300 relative z-10">
                  {item.icon && <item.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white/80" />}
                </span>

                {/* Content */}
                <div className="flex-1 relative z-10">
                  <p className="font-medium text-sm lg:text-base">{item.label}</p>
                  <p className="text-[10px] lg:text-xs opacity-60">{item.description}</p>
                </div>

                {/* Hover Arrow */}
                {isHovered === item.href && !isActive(item.href) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 pointer-events-none"
                  >
                    <span className="text-primary">→</span>
                  </motion.div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* User Section - Always visible at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4 lg:pt-6 border-t border-white/20 space-y-3 lg:space-y-4 mt-auto flex-shrink-0"
        >
          {/* Auth Buttons */}
          <SignedOut>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <SignInButton mode="modal">
                  <button className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold transition-colors font-sans">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-semibold transition-all shadow-lg active:scale-[0.98] font-sans">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </div>
          </SignedOut>
          
          {/* PWA Install Button (Always visible in sidebar) */}
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-sans my-4 ${
              isInstalled
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : isInstalling
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {isInstalled ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>App Installed ✓</span>
                </>
              ) : isInstalling ? (
                <>
                  <div className="w-5 h-5 animate-spin">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Install App</span>
                </>
              )}
            </div>
            <div className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              PWA
            </div>
          </button>

          {/* User Profile */}
          <SignedIn>
            <div className="w-full">
              <UserProfile />
            </div>
          </SignedIn>
        </motion.div>
      </nav>

      {/* Install Modal - Clean UI */}
      <AnimatePresence>
        {showInstallModal && installInstructions && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#0f0f14] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-3xl border border-emerald-500/30">
                  {installInstructions.icon}
                </div>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-white mb-3">{installInstructions.title}</h2>
              <div className="text-sm text-white/70 space-y-3 whitespace-pre-line mb-6 bg-white/5 rounded-xl p-4">
                {installInstructions.desc}
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Got it ✓
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}