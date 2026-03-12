'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function Home() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return
    
    if (isLoaded) {
      setHasRedirected(true)
      if (isSignedIn) {
        router.replace('/dashboard')
      } else {
        router.replace('/landing')
      }
    }
  }, [isLoaded, isSignedIn, router, hasRedirected])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Loading...</p>
      </div>
    </div>
  )
}
