'use client'

import type { Theme } from '@/schemas/theme'
import { parseColorTokens } from '@/lib/core/colors'

interface SlideBodyProps {
  content: string
  theme: Theme
  className?: string
}

export function SlideBody({ content, theme, className = '' }: SlideBodyProps) {
  const elements = parseColorTokens(content, theme)

  return (
    <div className={`slide-content whitespace-pre-wrap ${className}`}>
      {elements}
    </div>
  )
}
