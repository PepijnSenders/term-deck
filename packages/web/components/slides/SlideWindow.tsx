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

// Estimate content height based on slide content
function estimateContentHeight(slide: Slide): number {
  let height = 100 // base padding/chrome

  // BigText adds significant height (ASCII art ~12 lines)
  if (slide.frontmatter.bigText) {
    height += 250
  }

  // Estimate body height: ~24px per line, ~80 chars per line
  const bodyLines = slide.body.split('\n').length
  const estimatedWrappedLines = Math.ceil(slide.body.length / 60)
  height += Math.max(bodyLines, estimatedWrappedLines) * 24

  return height
}

// Generate random X offset
function getRandomOffsetX(index: number): number {
  const seed = index * 137
  const random = seededRandom(seed)
  // Range: -100 to +100 pixels
  return Math.floor(random * 200) - 100
}

// Generate Y offset biased by content height
// Taller content gets positioned higher (more negative offset)
function getRandomOffsetY(index: number, contentHeight: number): number {
  const seed = index * 137 + 73
  const random = seededRandom(seed)

  // Max viewport height we're designing for
  const viewportHeight = 800
  const maxContentHeight = 600

  // Calculate how much space we have below
  const availableSpace = Math.max(0, viewportHeight - contentHeight)

  // Height ratio: 0 = short content, 1 = tall content
  const heightRatio = Math.min(1, contentHeight / maxContentHeight)

  // For tall content: bias towards negative (higher on screen)
  // For short content: allow more randomness
  const maxDownward = availableSpace * 0.3 * (1 - heightRatio)
  const maxUpward = 60 * heightRatio + 30

  // Random value biased by height
  return Math.floor(random * (maxDownward + maxUpward)) - maxUpward
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

  // Estimate content height for positioning
  const contentHeight = estimateContentHeight(slide)

  // Generate offsets for stacking effect
  // First slide stays centered, subsequent slides get random offsets
  // Y offset is biased by content height - taller slides stay higher
  const offsetX = windowIndex === 0 ? 0 : getRandomOffsetX(windowIndex)
  const offsetY = windowIndex === 0 ? 0 : getRandomOffsetY(windowIndex, contentHeight)

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
      className={`cyber-window flex flex-col w-[75vw] max-w-4xl max-h-[85vh] ${isFirstSlide ? 'relative' : 'absolute top-0 left-0'}`}
      style={{
        borderColor,
        boxShadow: `0 0 10px ${borderColor}40, 0 0 20px ${borderColor}20`,
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        zIndex: windowIndex,
      }}
    >
      {/* Window title bar - outside scroll area */}
      <div
        className="text-sm pb-2 border-b px-6 pt-8 shrink-0"
        style={{ borderColor: `${borderColor}40` }}
      >
        <span style={{ color: borderColor }}>┌─ </span>
        <span className="text-white">{frontmatter.title}</span>
        <span style={{ color: borderColor }}> ─┐</span>
      </div>

      {/* Window content - scrollable */}
      <div className="px-6 pb-6 pt-4 overflow-y-auto min-h-[200px] flex-1">
        {renderTransition()}
      </div>
    </div>
  )
}
