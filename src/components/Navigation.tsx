'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { Menu, X, Sparkles, LayoutDashboard, MessageSquare, BarChart3, Plug2, User, Settings, FileText, Puzzle, LogOut } from 'lucide-react'
import { signOut } from '@clerk/nextjs'

function UserProfile() {
  const { user } = useUser()

  const handleSignOut = () => {
    signOut({ redirectUrl: '/' })
  }

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
      <div className="text-[9px] text-white/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
          <span>Plan: Free</span>
          <Link href="/subscription" className="text-primary hover:text-primary/80 hover:underline font-medium transition-all text-[9px]">
            Upgrade ✨
          </Link>
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
  const [isHovered, setIsHovered] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics',
      gradient: 'from-cyan-500 to-blue-500'
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
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10 px-4 py-3 flex items-center justify-between backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <h1 className="text-lg font-bold text-white">AutoReview</h1>
        </Link>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-[57px] left-0 bottom-0 w-full max-w-[100vw] glass-card border-r border-primary/20 p-4 flex flex-col z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            aria-hidden={!mobileMenuOpen}
            suppressHydrationWarning
          >
            {/* Navigation Items */}
            <div className="space-y-2 flex-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * (index + 1) }}
                >
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden min-h-[44px] ${
                      isActive(item.href)
                        ? 'bg-primary/20 text-white border border-primary/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)} // Close menu on item click
                  >
                    {/* Background Gradient on Active */}
                    {isActive(item.href) && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`}
                      />
                    )}

                    {/* Active Indicator */}
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeIndicatorMobile"
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b ${item.gradient} rounded-r-full`}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Icon */}
                    <item.icon className="w-5 h-5 relative z-10 text-white/80" />

                    {/* Content */}
                    <div className="flex-1 relative z-10">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-[10px] opacity-60">{item.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* User Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4 border-t border-white/20 space-y-3 mt-4"
            >
              <SignedOut>
                <div className="space-y-2">
                  <SignInButton mode="modal">
                    <button className="w-full px-3 py-3 min-h-[44px] bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all border border-white/20">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="w-full px-3 py-3 min-h-[44px] bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg">
                      Sign Up Free
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="overflow-y-auto max-h-40">
                  <UserProfile />
                </div>
              </SignedIn>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Navigation - Compact for more space */}
      <motion.nav
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/10 p-3 lg:p-4 xl:p-5 flex-col min-h-0 flex-1 shadow-2xl"
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
          className="mb-8"
        >
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">AutoReview</h1>
              <p className="text-xs text-white/60">Intelligent Review Management</p>
            </div>
          </Link>
        </motion.div>

        {/* Navigation Items */}
        <div className="space-y-1.5 lg:space-y-2 flex-1 overflow-y-auto pr-2">
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
                className={`relative flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-primary/30 to-primary/20 text-white border border-primary/40 shadow-lg shadow-primary/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:border hover:border-white/20'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Background Gradient on Hover/Active */}
                {(isActive(item.href) || isHovered === item.href) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isActive(item.href) ? 0.1 : 0.05 }}
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`}
                  />
                )}

                {/* Active Indicator */}
                {isActive(item.href) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b ${item.gradient} rounded-r-full`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <span className="group-hover:scale-110 transition-transform relative z-10">
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
                    className="relative z-10"
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
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/20 text-sm">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg text-sm">
                  Sign Up Free
                </button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="overflow-y-auto max-h-40 lg:max-h-48">
              <UserProfile />
            </div>
          </SignedIn>
        </motion.div>
      </motion.nav>
    </>
  )
}