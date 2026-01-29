'use client'

import type { Theme } from '@/schemas/theme'
import type { Slide } from '@/schemas/slide'
import { BigText } from './BigText'
import { SlideBody } from './SlideBody'
import { GlitchTransition, FadeTransition, TypewriterTransition } from '@/components/transitions'

interface SlideWindowProps {
  slide: Slide
  theme: Theme
  isActive: boolean
  windowIndex: number
  onTransitionComplete?: () => void
}

const WINDOW_COLORS = [
  '#00cc66', // green
  '#ff6600', // orange
  '#00ccff', // cyan
  '#ff0066', // pink
  '#9966ff', // purple
  '#ffcc00', // yellow
]

export function SlideWindow({
  slide,
  theme,
  isActive,
  windowIndex,
  onTransitionComplete,
}: SlideWindowProps) {
  const borderColor = WINDOW_COLORS[windowIndex % WINDOW_COLORS.length]
  const { frontmatter, body } = slide

  // Generate random-ish offset for stacking effect
  const offsetX = (windowIndex * 7) % 20
  const offsetY = (windowIndex * 5) % 15

  const renderContent = (displayContent: string, opacity?: number) => {
    const style = opacity !== undefined ? { opacity } : {}

    return (
      <div className="space-y-4" style={style}>
        {frontmatter.bigText && (
          <BigText
            text={frontmatter.bigText}
            gradient={frontmatter.gradient}
            theme={theme}
          />
        )}
        {displayContent && (
          <SlideBody content={displayContent} theme={theme} />
        )}
      </div>
    )
  }

  const renderTransition = () => {
    if (!isActive) {
      return renderContent(body)
    }

    const transition = frontmatter.transition || 'glitch'

    switch (transition) {
      case 'glitch':
        return (
          <GlitchTransition
            content={body}
            theme={theme}
            onComplete={onTransitionComplete}
          >
            {(displayContent) => renderContent(displayContent)}
          </GlitchTransition>
        )
      case 'fade':
        return (
          <FadeTransition
            content={body}
            theme={theme}
            onComplete={onTransitionComplete}
          >
            {(displayContent, opacity) => renderContent(displayContent, opacity)}
          </FadeTransition>
        )
      case 'typewriter':
        return (
          <TypewriterTransition
            content={body}
            theme={theme}
            onComplete={onTransitionComplete}
          >
            {(displayContent) => renderContent(displayContent)}
          </TypewriterTransition>
        )
      case 'instant':
      default:
        setTimeout(() => onTransitionComplete?.(), 0)
        return renderContent(body)
    }
  }

  // First slide is relative (establishes size), rest are absolute
  const isFirstSlide = windowIndex === 0

  return (
    <div
      className={`cyber-window p-6 w-[75vw] max-w-4xl ${isFirstSlide ? 'relative' : 'absolute top-0 left-0'}`}
      style={{
        borderColor,
        boxShadow: `0 0 10px ${borderColor}40, 0 0 20px ${borderColor}20`,
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        zIndex: windowIndex,
      }}
    >
      {/* Window title bar */}
      <div
        className="text-sm mb-4 pb-2 border-b"
        style={{ borderColor: `${borderColor}40` }}
      >
        <span style={{ color: borderColor }}>┌─ </span>
        <span className="text-white">{frontmatter.title}</span>
        <span style={{ color: borderColor }}> ─┐</span>
      </div>

      {/* Window content */}
      <div className="min-h-[200px]">
        {renderTransition()}
      </div>
    </div>
  )
}
