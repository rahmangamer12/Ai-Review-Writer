'use client'

import { useEffect, useRef } from 'react'

export default function WaveEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let time = 0

    const drawWave = (offset: number, amplitude: number, frequency: number, color: string, opacity: number) => {
      ctx.beginPath()
      ctx.moveTo(0, canvas.height / 2)

      for (let x = 0; x < canvas.width; x++) {
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
      ctx.lineWidth = 2
      ctx.globalAlpha = opacity
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const animate = () => {
      // Clear completely - no trail effect to avoid black buildup
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      time += 0.5

      // Multiple wave layers for depth
      drawWave(time, 30, 0.01, '#06b6d4', 0.3) // Cyan
      drawWave(time * 1.2, 40, 0.008, '#a855f7', 0.2) // Purple
      drawWave(time * 0.8, 50, 0.012, '#3b82f6', 0.15) // Blue

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed bottom-0 left-0 w-full h-64 -z-5 pointer-events-none opacity-30"
    />
  )
}
