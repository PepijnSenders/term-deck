'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Theme } from '@/schemas/theme'

interface MatrixDrop {
  x: number
  y: number
  speed: number
  trail: string[]
}

interface MatrixBackgroundProps {
  theme: Theme
  className?: string
}

export function MatrixBackground({ theme, className = '' }: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropsRef = useRef<MatrixDrop[]>([])
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  const generateTrail = useCallback((length: number): string[] => {
    const glyphs = theme.glyphs
    return Array.from({ length }, () =>
      glyphs[Math.floor(Math.random() * glyphs.length)]
    )
  }, [theme.glyphs])

  const initDrops = useCallback((width: number, height: number) => {
    const density = theme.animations.matrixDensity
    const charWidth = 14
    const charHeight = 20
    const cols = Math.ceil(width / charWidth)
    const rows = Math.ceil(height / charHeight)

    dropsRef.current = []
    for (let i = 0; i < density; i++) {
      dropsRef.current.push({
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        speed: 0.3 + Math.random() * 0.7,
        trail: generateTrail(5 + Math.floor(Math.random() * 10)),
      })
    }
  }, [theme.animations.matrixDensity, generateTrail])

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const interval = theme.animations.matrixInterval
    if (timestamp - lastTimeRef.current < interval) {
      animationRef.current = requestAnimationFrame(render)
      return
    }
    lastTimeRef.current = timestamp

    const charWidth = 14
    const charHeight = 20
    const cols = Math.ceil(canvas.width / charWidth)
    const rows = Math.ceil(canvas.height / charHeight)

    // Clear with fade effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = '14px JetBrains Mono, monospace'
    ctx.textBaseline = 'top'

    // Update and render drops
    for (const drop of dropsRef.current) {
      drop.y += drop.speed

      // Reset if off screen
      if (drop.y > rows + drop.trail.length) {
        drop.y = -drop.trail.length
        drop.x = Math.floor(Math.random() * cols)
        drop.trail = generateTrail(5 + Math.floor(Math.random() * 10))
      }

      // Draw trail
      for (let i = 0; i < drop.trail.length; i++) {
        const y = Math.floor(drop.y) - i
        if (y >= 0 && y < rows) {
          const opacity = 1 - (i / drop.trail.length)
          const brightness = i === 0 ? 1 : (Math.random() > 0.7 ? 0.8 : 0.5)

          ctx.fillStyle = hexToRgba(theme.colors.primary, opacity * brightness)
          ctx.fillText(
            drop.trail[i],
            drop.x * charWidth,
            y * charHeight
          )
        }
      }
    }

    animationRef.current = requestAnimationFrame(render)
  }, [theme, generateTrail])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      initDrops(window.innerWidth, window.innerHeight)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Start animation
    animationRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [initDrops, render])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 z-0 ${className}`}
      style={{ background: theme.colors.background }}
    />
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
