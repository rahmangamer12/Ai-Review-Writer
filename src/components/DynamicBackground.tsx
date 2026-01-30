'use client'

import dynamic from 'next/dynamic'

// Dynamically import animation components with SSR disabled
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false })
const GlowingParticles = dynamic(() => import('./3d/GlowingParticles'), { ssr: false })
const WaveEffect = dynamic(() => import('./3d/WaveEffect'), { ssr: false })

export default function DynamicBackground() {
  return (
    <>
      <AnimatedBackground />
      <GlowingParticles />
      <WaveEffect />
    </>
  )
}
