'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Particle3D {
  x: number
  y: number
  z: number
  size: number
  speedX: number
  speedY: number
  speedZ: number
  color: string
  rotationX: number
  rotationY: number
}

export default function GlowingParticles() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const particles: Particle3D[] = []
    const particleElements: HTMLDivElement[] = []

    // Create 3D particles
    for (let i = 0; i < 30; i++) {
      const particle: Particle3D = {
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        z: Math.random() * 100 - 50,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        speedZ: (Math.random() - 0.5) * 0.2,
        color: ['#06b6d4', '#a855f7', '#3b82f6'][Math.floor(Math.random() * 3)],
        rotationX: Math.random() * 360,
        rotationY: Math.random() * 360
      }

      const element = document.createElement('div')
      element.style.position = 'absolute'
      element.style.width = `${particle.size}px`
      element.style.height = `${particle.size}px`
      element.style.borderRadius = '50%'
      element.style.backgroundColor = particle.color
      element.style.boxShadow = `0 0 ${particle.size * 3}px ${particle.color}`
      element.style.transition = 'transform 0.1s ease-out'
      
      container.appendChild(element)
      particles.push(particle)
      particleElements.push(element)
    }

    // Animation loop
    let animationId: number
    
    const animate = () => {
      particles.forEach((particle, i) => {
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.z += particle.speedZ
        particle.rotationX += 1
        particle.rotationY += 1

        // Bounce at boundaries
        if (Math.abs(particle.x) > 50) particle.speedX *= -1
        if (Math.abs(particle.y) > 50) particle.speedY *= -1
        if (Math.abs(particle.z) > 50) particle.speedZ *= -1

        // 3D perspective calculation
        const scale = 1 / (1 + particle.z / 100)
        const x = particle.x * scale + 50
        const y = particle.y * scale + 50

        const element = particleElements[i]
        element.style.transform = `
          translate3d(${x}vw, ${y}vh, 0)
          rotateX(${particle.rotationX}deg)
          rotateY(${particle.rotationY}deg)
          scale(${scale})
        `
        element.style.opacity = `${Math.max(0.3, scale)}`
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      particleElements.forEach(el => el.remove())
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ perspective: '1000px' }}
    />
  )
}
