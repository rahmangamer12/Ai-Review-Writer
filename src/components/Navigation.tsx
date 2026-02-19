'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react'

function UserProfile() {
  const { user } = useUser()
  
  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <UserButton afterSignOutUrl="/" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-white truncate">
            {user?.firstName || user?.username || 'User'}
          </p>
          <p className="text-[10px] sm:text-xs text-white/60 truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>
      <div className="text-[10px] sm:text-xs text-white/50">
        <div className="flex items-center justify-between">
          <span>Plan: Free</span>
          <Link href="/subscription" className="text-primary hover:underline">
            Upgrade
          </Link>
        </div>
      </div>
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
      icon: '📊',
      description: 'Overview & Analytics',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      href: '/reviews',
      label: 'Reviews',
      icon: '💬',
      description: 'Manage Reviews',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'AI Insights',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      href: '/connect-platforms',
      label: 'Platforms',
      icon: '🔌',
      description: 'Connect Reviews',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: '👤',
      description: 'My Account',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Configure AI',
      gradient: 'from-orange-500 to-red-500'
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-card border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <h1 className="text-lg font-bold text-gradient">AutoReview</h1>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
            className="lg:hidden fixed top-[57px] left-0 bottom-0 w-[280px] max-w-[85vw] glass-card border-r border-primary/20 p-4 flex flex-col z-50 overflow-y-auto"
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
                    <span className="text-xl relative z-10">{item.icon}</span>

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
                <UserProfile />
              </SignedIn>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Desktop Navigation */}
      <motion.nav
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden lg:flex w-72 h-full glass-card border-r border-primary/20 p-6 flex-col"
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
        <div className="space-y-2 flex-1">
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
                className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                  isActive(item.href)
                    ? 'bg-primary/20 text-white border border-primary/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
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
                <span className="text-2xl group-hover:scale-110 transition-transform relative z-10">
                  {item.icon}
                </span>

                {/* Content */}
                <div className="flex-1 relative z-10">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-60">{item.description}</p>
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

        {/* User Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-6 border-t border-white/20 space-y-4"
        >
          {/* Auth Buttons */}
          <SignedOut>
            <div className="space-y-2">
              <SignInButton mode="modal">
                <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all border border-white/20">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg">
                  Sign Up Free
                </button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <UserProfile />
          </SignedIn>
        </motion.div>
      </motion.nav>
    </>
  )
}