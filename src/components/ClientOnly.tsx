'use client'

import { useState, useEffect, ReactNode } from 'react'

function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated
}

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hydrated = useHydrated()

  if (!hydrated) {
    return fallback
  }

  return children
}
