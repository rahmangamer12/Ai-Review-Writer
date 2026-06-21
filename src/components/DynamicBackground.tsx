'use client'

import dynamic from 'next/dynamic'

// Lightweight canvas background only. The Three.js GlowingParticles + WaveEffect
// were removed from the global background: they ran on every page and caused
// continuous GPU/CPU cost and jank for no functional benefit. Per-page gradient
// blobs already provide the premium look.
const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false })

export default function DynamicBackground() {
  return <AnimatedBackground />
}
