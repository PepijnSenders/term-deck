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

// Seeded random number generator for consistent but random-looking positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// Generate random offset with more variety
function getRandomOffset(index: number, axis: 'x' | 'y'): number {
  const seed = index * 137 + (axis === 'x' ? 0 : 73)
  const random = seededRandom(seed)
  // Range: -40 to +40 pixels for x, -30 to +30 for y
  const range = axis === 'x' ? 80 : 60
  return Math.floor(random * range) - range / 2
}

export function SlideWindow({
  slide,
  theme,
  isActive,
  windowIndex,
  onTransitionComplete,
}: SlideWindowProps) {
  const borderColor = WINDOW_COLORS[windowIndex % WINDOW_COLORS.length]
  const { frontmatter, body } = slide

  // Generate truly random-looking offsets for stacking effect
  // First slide stays centered, subsequent slides get random offsets
  const offsetX = windowIndex === 0 ? 0 : getRandomOffset(windowIndex, 'x')
  const offsetY = windowIndex === 0 ? 0 : getRandomOffset(windowIndex, 'y')

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
      className={`cyber-window p-6 w-[75vw] max-w-4xl max-h-[85vh] overflow-y-auto ${isFirstSlide ? 'relative' : 'absolute top-0 left-0'}`}
      style={{
        borderColor,
        boxShadow: `0 0 10px ${borderColor}40, 0 0 20px ${borderColor}20`,
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        zIndex: windowIndex,
      }}
    >
      {/* Window title bar */}
      <div
        className="text-sm mb-4 pb-2 border-b sticky -top-6 bg-cyber-bg/95 -mt-6 -mx-6 px-6 pt-6"
        style={{ borderColor: `${borderColor}40`, zIndex: 1 }}
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
