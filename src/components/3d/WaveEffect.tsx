'use client'

import { useEffect, useRef } from 'react'

export default function WaveEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Check if we're on a mobile device to reduce complexity
    const isMobile = window.matchMedia('(max-width: 768px)').matches ||
      navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      // Reduce resolution for better performance on mobile
      const ratio = isMobile ? 0.5 : 1;
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      ctx.scale(ratio, ratio)
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let time = 0
    let animationId: number
    let lastTimestamp = 0
    const frameInterval = isMobile ? 1000 / 30 : 1000 / 60 // 30fps on mobile, 60fps on desktop

    const drawWave = (offset: number, amplitude: number, frequency: number, color: string, opacity: number) => {
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)

      // Reduce number of points for better performance on mobile
      const step = isMobile ? 5 : 2
      for (let x = 0; x < canvas.width; x += step) {
        const y = canvas.height / 2 +
          Math.sin((x + offset) * frequency) * amplitude +
          Math.sin((x + offset) * frequency * 0.5) * amplitude * 0.5

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.strokeStyle = color
      ctx.lineWidth = isMobile ? 1 : 2
      ctx.globalAlpha = opacity
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const animate = (timestamp: number) => {
      // Throttle animation based on frame rate
      if (timestamp - lastTimestamp < frameInterval) {
        animationId = requestAnimationFrame(animate)
        return
      }
      lastTimestamp = timestamp

      // Clear completely - no trail effect to avoid black buildup
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      time += isMobile ? 0.3 : 0.5 // Slower animation on mobile

      // Multiple wave layers for depth
      if (!isMobile) {
        // Only use multiple layers on desktop, single layer on mobile
        drawWave(time, 30, 0.01, '#06b6d4', 0.3) // Cyan
        drawWave(time * 1.2, 40, 0.008, '#a855f7', 0.2) // Purple
        drawWave(time * 0.8, 50, 0.012, '#3b82f6', 0.15) // Blue
      } else {
        // Reduced complexity on mobile
        drawWave(time, 30, 0.01, '#a855f7', 0.2) // Purple only
      }

      animationId = requestAnimationFrame(animate)
    }

    animate(0)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed bottom-0 left-0 w-full h-64 -z-50 pointer-events-none opacity-30"
    />
  )
}
