'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Dynamically import animation components with SSR disabled
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false })
const GlowingParticles = dynamic(() => import('./3d/GlowingParticles'), { ssr: false })
const WaveEffect = dynamic(() => import('./3d/WaveEffect'), { ssr: false })

export default function DynamicBackground() {
  const [enhancedEffects, setEnhancedEffects] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)')
    const update = () => setEnhancedEffects(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <>
      <AnimatedBackground />
      {enhancedEffects && (
        <>
          <GlowingParticles />
          <WaveEffect />
        </>
      )}
    </>
  )
}
