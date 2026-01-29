'use client'

import { useState, useEffect, useRef } from 'react'
import type { Theme } from '@/schemas/theme'

interface FadeTransitionProps {
  content: string
  theme: Theme
  onComplete?: () => void
  children: (displayContent: string, opacity: number) => React.ReactNode
}

export function FadeTransition({
  content,
  theme,
  onComplete,
  children,
}: FadeTransitionProps) {
  const [opacity, setOpacity] = useState(0)
  const [displayContent, setDisplayContent] = useState('')
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    setDisplayContent(content)
    setOpacity(0)

    const steps = 10
    const stepDelay = 50 / theme.animations.revealSpeed
    let currentStep = 0

    const animate = () => {
      if (completedRef.current) return
      if (currentStep >= steps) {
        setOpacity(1)
        onComplete?.()
        return
      }

      currentStep++
      setOpacity(currentStep / steps)
      setTimeout(animate, stepDelay)
    }

    // Start after a short delay
    setTimeout(animate, 50)

    return () => {
      completedRef.current = true
    }
  }, [content, theme.animations.revealSpeed, onComplete])

  return <>{children(displayContent, opacity)}</>
}
