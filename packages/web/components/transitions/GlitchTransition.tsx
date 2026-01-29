'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Theme } from '@/schemas/theme'
import { GLITCH_CHARS, PROTECTED_CHARS } from '@/lib/core/constants'

interface GlitchTransitionProps {
  content: string
  theme: Theme
  onComplete?: () => void
  children: (displayContent: string) => React.ReactNode
}

export function GlitchTransition({
  content,
  theme,
  onComplete,
  children,
}: GlitchTransitionProps) {
  const [displayContent, setDisplayContent] = useState('')
  const [isAnimating, setIsAnimating] = useState(true)
  const animationRef = useRef<number>(0)
  const completedRef = useRef(false)

  const glitchLine = useCallback(async (
    currentLines: string[],
    newLine: string,
    iterations: number,
    onFrame: (content: string) => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      let i = iterations

      const animate = () => {
        if (i < 0) {
          resolve()
          return
        }

        const scrambleRatio = i / iterations
        let scrambledLine = ''

        for (const char of newLine) {
          if (PROTECTED_CHARS.has(char)) {
            scrambledLine += char
          } else if (Math.random() < scrambleRatio) {
            scrambledLine += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          } else {
            scrambledLine += char
          }
        }

        onFrame([...currentLines, scrambledLine].join('\n'))
        i--

        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 20)
        })
      }

      animate()
    })
  }, [])

  useEffect(() => {
    completedRef.current = false
    setIsAnimating(true)

    const lines = content.split('\n')
    const revealedLines: string[] = []
    const glitchIterations = theme.animations.glitchIterations
    const lineDelay = theme.animations.lineDelay

    const runAnimation = async () => {
      for (const line of lines) {
        if (completedRef.current) return

        await glitchLine(revealedLines, line, glitchIterations, setDisplayContent)
        revealedLines.push(line)
        setDisplayContent(revealedLines.join('\n'))

        // Delay between lines (skip for empty lines)
        if (line.trim()) {
          await new Promise(r => setTimeout(r, lineDelay))
        }
      }

      setIsAnimating(false)
      onComplete?.()
    }

    runAnimation()

    return () => {
      completedRef.current = true
      cancelAnimationFrame(animationRef.current)
    }
  }, [content, theme.animations.glitchIterations, theme.animations.lineDelay, glitchLine, onComplete])

  return <>{children(displayContent)}</>
}
