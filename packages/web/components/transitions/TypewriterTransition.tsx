'use client'

import { useState, useEffect, useRef } from 'react'
import type { Theme } from '@/schemas/theme'

interface TypewriterTransitionProps {
  content: string
  theme: Theme
  onComplete?: () => void
  children: (displayContent: string) => React.ReactNode
}

export function TypewriterTransition({
  content,
  theme,
  onComplete,
  children,
}: TypewriterTransitionProps) {
  const [displayContent, setDisplayContent] = useState('')
  const completedRef = useRef(false)

  useEffect(() => {
    completedRef.current = false
    setDisplayContent('')

    const charDelay = theme.animations.lineDelay / 5
    let currentIndex = 0

    const animate = () => {
      if (completedRef.current) return
      if (currentIndex >= content.length) {
        setDisplayContent(content)
        onComplete?.()
        return
      }

      currentIndex++
      setDisplayContent(content.slice(0, currentIndex))

      // Skip delay for spaces and newlines
      const char = content[currentIndex - 1]
      const delay = char === ' ' || char === '\n' ? 0 : charDelay

      setTimeout(animate, delay)
    }

    animate()

    return () => {
      completedRef.current = true
    }
  }, [content, theme.animations.lineDelay, onComplete])

  return <>{children(displayContent)}</>
}
