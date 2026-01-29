import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processSlideContent, normalizeBigText } from '../content-processor'
import { DEFAULT_THEME } from '../../schemas/theme'
import type { Theme } from '../../schemas/theme'

/**
 * Tests for content-processor.ts
 *
 * This module is responsible for processing slide content through:
 * 1. Mermaid diagram conversion (to ASCII)
 * 2. Color token resolution (to blessed tags)
 *
 * The normalizeBigText function is already tested in slide.test.ts
 * but we include basic coverage here for module completeness.
 */

describe('processSlideContent', () => {
  describe('color token processing', () => {
    it('converts built-in color tokens to blessed tags', async () => {
      const content = '{GREEN}Hello{/} {ORANGE}World{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}Hello{/} {#ff6600-fg}World{/}')
    })

    it('converts theme color tokens to blessed tags', async () => {
      const content = '{PRIMARY}Primary{/} {ACCENT}Accent{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      // DEFAULT_THEME has primary: #00cc66, accent: #ff6600
      expect(result).toBe('{#00cc66-fg}Primary{/} {#ff6600-fg}Accent{/}')
    })

    it('handles all built-in color tokens', async () => {
      const content = '{GREEN}G{/}{ORANGE}O{/}{CYAN}C{/}{PINK}P{/}{WHITE}W{/}{GRAY}G{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toContain('{#00cc66-fg}G{/}') // GREEN
      expect(result).toContain('{#ff6600-fg}O{/}') // ORANGE
      expect(result).toContain('{#00ccff-fg}C{/}') // CYAN
      expect(result).toContain('{#ff0066-fg}P{/}') // PINK
      expect(result).toContain('{#ffffff-fg}W{/}') // WHITE
      expect(result).toContain('{#666666-fg}G{/}') // GRAY
    })

    it('handles all theme color tokens', async () => {
      const content = '{PRIMARY}P{/}{ACCENT}A{/}{MUTED}M{/}{TEXT}T{/}{BACKGROUND}B{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toContain('{#00cc66-fg}P{/}') // PRIMARY
      expect(result).toContain('{#ff6600-fg}A{/}') // ACCENT
      expect(result).toContain('{#666666-fg}M{/}') // MUTED
      expect(result).toContain('{#ffffff-fg}T{/}') // TEXT
      expect(result).toContain('{#0a0a0a-fg}B{/}') // BACKGROUND
    })

    it('handles SECONDARY token with fallback to primary', async () => {
      // DEFAULT_THEME doesn't have secondary defined, should fall back to primary
      const content = '{SECONDARY}Secondary{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}Secondary{/}') // Falls back to primary
    })

    it('handles SECONDARY token when defined in theme', async () => {
      const themeWithSecondary: Theme = {
        ...DEFAULT_THEME,
        colors: {
          ...DEFAULT_THEME.colors,
          secondary: '#ff00ff',
        },
      }
      const content = '{SECONDARY}Secondary{/}'
      const result = await processSlideContent(content, themeWithSecondary)

      expect(result).toBe('{#ff00ff-fg}Secondary{/}')
    })

    it('preserves closing tags', async () => {
      const content = '{GREEN}Hello{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toContain('{/}')
    })

    it('leaves non-token curly braces unchanged', async () => {
      const content = 'function() { return 42; }'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('function() { return 42; }')
    })

    it('handles content without any color tokens', async () => {
      const content = 'Plain text without any formatting'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('Plain text without any formatting')
    })

    it('handles empty content', async () => {
      const result = await processSlideContent('', DEFAULT_THEME)

      expect(result).toBe('')
    })

    it('handles multiple color tokens on same line', async () => {
      const content = '{GREEN}A{/} {ORANGE}B{/} {CYAN}C{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}A{/} {#ff6600-fg}B{/} {#00ccff-fg}C{/}')
    })

    it('handles nested text between tokens', async () => {
      const content = '{GREEN}start{/} middle {ORANGE}end{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}start{/} middle {#ff6600-fg}end{/}')
    })

    it('handles multiline content with color tokens', async () => {
      const content = `{GREEN}Line 1{/}
{ORANGE}Line 2{/}
{CYAN}Line 3{/}`
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe(`{#00cc66-fg}Line 1{/}
{#ff6600-fg}Line 2{/}
{#00ccff-fg}Line 3{/}`)
    })
  })

  describe('mermaid diagram processing', () => {
    it('converts mermaid code blocks to ASCII', async () => {
      const content = `Before diagram

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

After diagram`
      const result = await processSlideContent(content, DEFAULT_THEME)

      // Mermaid blocks should be converted (no longer contain ```mermaid)
      expect(result).not.toContain('```mermaid')
      expect(result).toContain('Before diagram')
      expect(result).toContain('After diagram')
    })

    it('handles content without mermaid blocks', async () => {
      const content = 'Regular content with no diagrams'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('Regular content with no diagrams')
    })

    it('processes mermaid first, then color tokens', async () => {
      // This tests the order of operations
      const content = `{GREEN}Title{/}

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

{ORANGE}Footer{/}`
      const result = await processSlideContent(content, DEFAULT_THEME)

      // Color tokens should be converted
      expect(result).toContain('{#00cc66-fg}Title{/}')
      expect(result).toContain('{#ff6600-fg}Footer{/}')
      // Mermaid should be converted
      expect(result).not.toContain('```mermaid')
    })
  })

  describe('custom themes', () => {
    it('uses custom theme colors for tokens', async () => {
      const customTheme: Theme = {
        ...DEFAULT_THEME,
        colors: {
          primary: '#ff0000',
          accent: '#00ff00',
          background: '#000000',
          text: '#ffffff',
          muted: '#888888',
        },
      }

      const content = '{PRIMARY}Red{/} {ACCENT}Green{/}'
      const result = await processSlideContent(content, customTheme)

      expect(result).toBe('{#ff0000-fg}Red{/} {#00ff00-fg}Green{/}')
    })
  })

  describe('edge cases', () => {
    it('handles content with only whitespace', async () => {
      const result = await processSlideContent('   \n\t\n   ', DEFAULT_THEME)

      expect(result).toBe('   \n\t\n   ')
    })

    it('handles unicode content', async () => {
      const content = '{GREEN}日本語{/} {ORANGE}中文{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}日本語{/} {#ff6600-fg}中文{/}')
    })

    it('handles special characters in content', async () => {
      const content = '{GREEN}Hello & World < > "{/}'
      const result = await processSlideContent(content, DEFAULT_THEME)

      expect(result).toBe('{#00cc66-fg}Hello & World < > "{/}')
    })
  })
})

describe('normalizeBigText (module completeness)', () => {
  // Basic coverage - detailed tests are in slide.test.ts

  it('returns empty array for undefined', () => {
    expect(normalizeBigText(undefined)).toEqual([])
  })

  it('wraps string in array', () => {
    expect(normalizeBigText('HELLO')).toEqual(['HELLO'])
  })

  it('passes through array unchanged', () => {
    expect(normalizeBigText(['A', 'B'])).toEqual(['A', 'B'])
  })

  it('returns empty array for empty string', () => {
    expect(normalizeBigText('')).toEqual([])
  })
})
