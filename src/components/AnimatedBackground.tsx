'use client'

import { useEffect, useRef, useCallback } from 'react'

// ─── Performance Detection ───────────────────────────────────────────────────
function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
  const isSlowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  return isMobile || isLowMemory || isSlowConcurrency
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // ── Performance Settings ────────────────────────────────────────────────
    const isLowEnd = isLowEndDevice()
    const particleCount = isLowEnd ? 30 : 80
    const orbCount = isLowEnd ? 2 : 5
    const targetFPS = isLowEnd ? 24 : 30 // Lower FPS for better battery
    const frameInterval = 1000 / targetFPS
    const connectionDistance = isLowEnd ? 60 : 100 // Fewer connection checks

    // ── Canvas Setup ────────────────────────────────────────────────────────
    const resizeCanvas = () => {
      const dpr = isLowEnd ? 1 : Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()

    // Debounced resize handler
    let resizeTimeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 150)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // ── Particle System ─────────────────────────────────────────────────────
    const particles: Array<{
      x: number; y: number; size: number
      speedX: number; speedY: number; opacity: number; color: string
    }> = []

    const colors = ['rgba(6, 182, 212, ', 'rgba(168, 85, 247, ', 'rgba(59, 130, 246, ']

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    // ── Floating Orbs ────────────────────────────────────────────────────────
    const orbs: Array<{
      x: number; y: number; radius: number
      speedX: number; speedY: number; color: string; pulsePhase: number
    }> = []

    const orbColors = [
      'rgba(6, 182, 212, 0.06)',
      'rgba(168, 85, 247, 0.06)',
      'rgba(59, 130, 246, 0.06)',
    ]

    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 80 + 40,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        color: orbColors[Math.floor(Math.random() * orbColors.length)],
      })
    }

    // ── Animation Loop ──────────────────────────────────────────────────────
    let lastTimestamp = 0

    const animate = (timestamp: number) => {
      // Frame rate throttling
      if (timestamp - lastTimestamp < frameInterval) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTimestamp = timestamp

      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      // Draw orbs (cheaper - just gradients)
      for (const orb of orbs) {
        orb.x += orb.speedX
        orb.y += orb.speedY
        orb.pulsePhase += 0.015

        if (orb.x + orb.radius > width || orb.x - orb.radius < 0) orb.speedX *= -1
        if (orb.y + orb.radius > height || orb.y - orb.radius < 0) orb.speedY *= -1

        const pulse = Math.sin(orb.pulsePhase) * 8
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius + pulse)
        gradient.addColorStop(0, orb.color.replace('0.06', '0.12'))
        gradient.addColorStop(1, orb.color.replace('0.06', '0'))
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, orb.radius + pulse, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY

        if (p.x > width) p.x = 0
        else if (p.x < 0) p.x = width
        if (p.y > height) p.y = 0
        else if (p.y < 0) p.y = height

        ctx.fillStyle = p.color + p.opacity + ')'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw connections (only on non-low-end)
      if (!isLowEnd) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const distSq = dx * dx + dy * dy

            if (distSq < connectionDistance * connectionDistance) {
              const dist = Math.sqrt(distSq)
              ctx.strokeStyle = `rgba(6, 182, 212, ${0.08 * (1 - dist / connectionDistance)})`
              ctx.lineWidth = 0.5
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.stroke()
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cleanup()
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [cleanup])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-screen h-screen min-h-[100dvh] -z-10 pointer-events-none"
      style={{
        background: 'transparent',
        backgroundImage: 'linear-gradient(to bottom, rgba(3, 7, 18, 0.8), rgba(12, 18, 34, 0.9))',
      }}
    />
  )
}
