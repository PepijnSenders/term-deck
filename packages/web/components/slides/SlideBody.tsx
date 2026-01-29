'use client'

import type { Theme } from '@/schemas/theme'
import { parseColorTokens } from '@/lib/core/colors'
import { processMarkdown } from '@/lib/core/markdown'

interface SlideBodyProps {
  content: string
  theme: Theme
  className?: string
}

export function SlideBody({ content, theme, className = '' }: SlideBodyProps) {
  // Process markdown first, then color tokens
  const processed = processMarkdown(content)
  const elements = parseColorTokens(processed, theme)

  return (
    <div
      className={`slide-content whitespace-pre-wrap ${className}`}
      style={{
        // Style markdown elements
      }}
    >
      {elements.map((element, i) => {
        if (typeof element === 'string') {
          // Render HTML from markdown processing
          return <span key={i} dangerouslySetInnerHTML={{ __html: element }} />
        }
        // Color-wrapped elements - need to render their content as HTML too
        if (element && typeof element === 'object' && 'props' in element) {
          const el = element as React.ReactElement
          const text = el.props.children as string
          return (
            <span key={i} style={el.props.style}>
              <span dangerouslySetInnerHTML={{ __html: text }} />
            </span>
          )
        }
        return element
      })}
    </div>
  )
}
