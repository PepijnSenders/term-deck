'use client'

import { useState, useEffect } from 'react'
import type { Theme } from '@/schemas/theme'
import { generateBigText, generateMultiLineBigText } from '@/lib/render/figlet-web'
import { getGradientCSS } from '@/lib/core/gradient'

interface BigTextProps {
  text: string | string[]
  gradient?: string
  theme: Theme
  className?: string
}

export function BigText({ text, gradient, theme, className = '' }: BigTextProps) {
  const [asciiArt, setAsciiArt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const generate = async () => {
      setIsLoading(true)
      try {
        if (Array.isArray(text)) {
          const result = await generateMultiLineBigText(text)
          setAsciiArt(result)
        } else {
          const result = await generateBigText(text)
          setAsciiArt(result)
        }
      } catch (error) {
        console.error('Failed to generate bigText:', error)
        setAsciiArt(Array.isArray(text) ? text.join('\n') : text)
      }
      setIsLoading(false)
    }

    generate()
  }, [text])

  if (isLoading) {
    return (
      <div className={`bigtext ${className}`}>
        {/* Show plain text while loading */}
        {Array.isArray(text) ? text.join('\n') : text}
      </div>
    )
  }

  const gradientStyle = gradient ? {
    background: getGradientCSS(gradient, theme),
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } : {
    color: theme.colors.primary,
  }

  return (
    <pre
      className={`bigtext ${gradient ? 'bigtext-gradient' : ''} ${className}`}
      style={gradientStyle}
    >
      {asciiArt}
    </pre>
  )
}
