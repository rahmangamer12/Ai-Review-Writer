'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Get canvas dimensions safely
    const getCanvasWidth = () => canvas?.width || window.innerWidth
    const getCanvasHeight = () => canvas?.height || window.innerHeight

    // Particle system
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      color: string

      constructor() {
        this.x = Math.random() * getCanvasWidth()
        this.y = Math.random() * getCanvasHeight()
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
        
        const colors = ['rgba(6, 182, 212, ', 'rgba(168, 85, 247, ', 'rgba(59, 130, 246, ']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        const width = getCanvasWidth()
        const height = getCanvasHeight()

        if (this.x > width) this.x = 0
        if (this.x < 0) this.x = width
        if (this.y > height) this.y = 0
        if (this.y < 0) this.y = height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color + this.opacity + ')'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Floating orbs
    class FloatingOrb {
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      color: string
      pulsePhase: number

      constructor() {
        this.x = Math.random() * getCanvasWidth()
        this.y = Math.random() * getCanvasHeight()
        this.radius = Math.random() * 100 + 50
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.pulsePhase = Math.random() * Math.PI * 2
        
        const colors = [
          'rgba(6, 182, 212, 0.08)',
          'rgba(168, 85, 247, 0.08)',
          'rgba(59, 130, 246, 0.08)'
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.pulsePhase += 0.02

        const width = getCanvasWidth()
        const height = getCanvasHeight()

        if (this.x + this.radius > width || this.x - this.radius < 0) {
          this.speedX *= -1
        }
        if (this.y + this.radius > height || this.y - this.radius < 0) {
          this.speedY *= -1
        }
      }

      draw() {
        if (!ctx) return
        const pulse = Math.sin(this.pulsePhase) * 10
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius + pulse
        )
        
        gradient.addColorStop(0, this.color.replace('0.08', '0.15'))
        gradient.addColorStop(1, this.color.replace('0.08', '0'))
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles and orbs
    const particles: Particle[] = []
    const orbs: FloatingOrb[] = []
    
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle())
    }
    
    for (let i = 0; i < 5; i++) {
      orbs.push(new FloatingOrb())
    }

    // Animation loop
    let animationId: number
    
    const animate = () => {
      const width = getCanvasWidth()
      const height = getCanvasHeight()
      
      // Clear canvas completely instead of semi-transparent fill
      ctx.clearRect(0, 0, width, height)

      orbs.forEach(orb => {
        orb.update()
        orb.draw()
      })

      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      style={{ 
        background: 'transparent',
        backgroundImage: 'linear-gradient(to bottom, rgba(3, 7, 18, 0.8), rgba(12, 18, 34, 0.9))'
      }}
    />
  )
}
