'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'

function UserProfile() {
  const { user } = useUser()
  
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <UserButton afterSignOutUrl="/" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {user?.firstName || user?.username || 'User'}
          </p>
          <p className="text-xs text-white/60 truncate">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>
      <div className="text-xs text-white/50">
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

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <motion.nav
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-72 h-full glass-card border-r border-primary/20 p-6 flex flex-col"
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
  )
}