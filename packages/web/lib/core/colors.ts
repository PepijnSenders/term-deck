import type { Theme } from '@/schemas/theme'
import React from 'react'

/**
 * Built-in color mappings for color tokens in slide content.
 */
export const BUILTIN_COLORS: Record<string, string> = {
  GREEN: '#00cc66',
  ORANGE: '#ff6600',
  CYAN: '#00ccff',
  PINK: '#ff0066',
  WHITE: '#ffffff',
  GRAY: '#666666',
}

/**
 * Resolve a color token to its hex value.
 */
export function resolveColorToken(token: string, theme: Theme): string {
  switch (token) {
    case 'PRIMARY':
      return theme.colors.primary
    case 'SECONDARY':
      return theme.colors.secondary ?? theme.colors.primary
    case 'ACCENT':
      return theme.colors.accent
    case 'MUTED':
      return theme.colors.muted
    case 'TEXT':
      return theme.colors.text
    case 'BACKGROUND':
      return theme.colors.background
  }

  return BUILTIN_COLORS[token] ?? theme.colors.text
}

/**
 * Parse color tokens in content and return React elements.
 * Transforms {GREEN}text{/} syntax to <span> elements.
 */
export function parseColorTokens(content: string, theme: Theme): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\{(GREEN|ORANGE|CYAN|PINK|WHITE|GRAY|PRIMARY|SECONDARY|ACCENT|MUTED|TEXT|BACKGROUND|\/)\}/g

  let lastIndex = 0
  let currentColor: string | null = null
  let match: RegExpExecArray | null
  let keyIndex = 0

  // Build segments
  const segments: Array<{ text: string; color: string | null }> = []
  let currentText = ''

  while ((match = regex.exec(content)) !== null) {
    // Add text before this match
    const textBefore = content.slice(lastIndex, match.index)
    if (textBefore) {
      currentText += textBefore
    }

    const token = match[1]

    if (token === '/') {
      // Close tag - push current segment and reset color
      if (currentText) {
        segments.push({ text: currentText, color: currentColor })
        currentText = ''
      }
      currentColor = null
    } else {
      // Open tag - push current segment with old color, then start new color
      if (currentText) {
        segments.push({ text: currentText, color: currentColor })
        currentText = ''
      }
      currentColor = resolveColorToken(token, theme)
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  const remaining = content.slice(lastIndex)
  if (remaining) {
    currentText += remaining
  }
  if (currentText) {
    segments.push({ text: currentText, color: currentColor })
  }

  // Convert segments to React elements
  for (const segment of segments) {
    if (segment.color) {
      parts.push(
        React.createElement('span', {
          key: keyIndex++,
          style: { color: segment.color }
        }, segment.text)
      )
    } else {
      parts.push(segment.text)
    }
  }

  return parts
}

/**
 * Strip color tokens from content (for plain text).
 */
export function stripColorTokens(content: string): string {
  return content.replace(
    /\{(GREEN|ORANGE|CYAN|PINK|WHITE|GRAY|PRIMARY|SECONDARY|ACCENT|MUTED|TEXT|BACKGROUND|\/)\}/g,
    ''
  )
}
