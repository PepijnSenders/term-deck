/**
 * Content Processing Module
 *
 * Responsible for processing slide content through various transformations:
 * - Mermaid diagram conversion
 * - Color token resolution
 * - Text normalization
 *
 * This module follows the Single Responsibility Principle by focusing
 * solely on content transformation, separate from parsing and loading logic.
 */

import type { Theme } from '../schemas/theme.js'
import { colorTokensToBlessedTags } from './theme.js'
import { processMermaidDiagrams } from './utils/mermaid.js'

/**
 * Pattern to match generic code blocks in markdown.
 * Captures optional language and the code content.
 *
 * Matches: ```language\n<content>``` or ```\n<content>```
 * Group 1: Optional language identifier
 * Group 2: The code content
 */
const CODE_BLOCK_PATTERN = /```(\w*)\n([\s\S]*?)```/g

/**
 * Process generic code blocks in content.
 *
 * Strips the ``` delimiters and formats code blocks with a simple
 * box border for visual distinction.
 *
 * @param content - The content containing code blocks
 * @returns Content with code blocks formatted
 */
export function processCodeBlocks(content: string): string {
  return content.replace(CODE_BLOCK_PATTERN, (_match, _lang, code) => {
    const lines = code.trimEnd().split('\n')
    const maxLen = Math.max(...lines.map((l: string) => l.length), 20)

    const top = '┌' + '─'.repeat(maxLen + 2) + '┐'
    const bottom = '└' + '─'.repeat(maxLen + 2) + '┘'

    const boxedLines = lines.map((line: string) => {
      const padded = line.padEnd(maxLen)
      return `│ ${padded} │`
    })

    return [top, ...boxedLines, bottom].join('\n')
  })
}

/**
 * Process markdown inline formatting.
 *
 * Converts common markdown syntax to blessed tags:
 * - **bold** or __bold__ → {bold}bold{/bold}
 * - *italic* or _italic_ → {italic}italic{/italic} (rendered as dim in terminal)
 * - `code` → {inverse}code{/inverse}
 * - ~~strikethrough~~ → {strikethrough}text{/strikethrough}
 *
 * @param content - The content containing markdown formatting
 * @returns Content with markdown converted to blessed tags
 */
export function processMarkdownInline(content: string): string {
  let result = content

  // Bold: **text** or __text__ (process before italic to avoid conflicts)
  result = result.replace(/\*\*([^*]+)\*\*/g, '{bold}$1{/bold}')
  result = result.replace(/__([^_]+)__/g, '{bold}$1{/bold}')

  // Italic: *text* or _text_ (single asterisk/underscore, not inside words)
  // Use negative lookbehind/ahead to avoid matching inside words
  result = result.replace(/(?<![*\w])\*([^*]+)\*(?![*\w])/g, '{light-black-fg}$1{/light-black-fg}')
  result = result.replace(/(?<![_\w])_([^_]+)_(?![_\w])/g, '{light-black-fg}$1{/light-black-fg}')

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, '{inverse} $1 {/inverse}')

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '{strikethrough}$1{/strikethrough}')

  // Headers: # Header (convert to bold)
  result = result.replace(/^(#{1,6})\s+(.+)$/gm, '{bold}$2{/bold}')

  // Horizontal rules: --- or *** or ___
  result = result.replace(/^[-*_]{3,}$/gm, '─'.repeat(40))

  // Lists: - item or * item (preserve but clean up)
  result = result.replace(/^[\s]*[-*+]\s+/gm, '  • ')

  // Numbered lists: 1. item
  result = result.replace(/^[\s]*(\d+)\.\s+/gm, '  $1. ')

  return result
}

/**
 * Process slide body content.
 *
 * Applies the full content processing pipeline:
 * 1. Process mermaid diagrams (convert to ASCII)
 * 2. Apply color tokens (convert to blessed tags)
 *
 * The order is important: mermaid diagrams are processed first so that
 * any color tokens they might contain are then converted to blessed tags.
 *
 * @param body - The slide body content to process
 * @param theme - The theme to use for color token resolution
 * @returns Processed content with mermaid converted and color tokens applied
 *
 * @example
 * const processed = await processSlideContent(
 *   '{GREEN}Hello{/}\n\n```mermaid\ngraph LR\nA-->B\n```',
 *   theme
 * )
 * // Returns: '{#00cc66-fg}Hello{/}\n\n<ascii art>'
 */
export async function processSlideContent(
  body: string,
  theme: Theme
): Promise<string> {
  // Process mermaid diagrams first
  let processed = processMermaidDiagrams(body)

  // Process generic code blocks (before inline markdown to preserve code content)
  processed = processCodeBlocks(processed)

  // Process markdown inline formatting
  processed = processMarkdownInline(processed)

  // Apply color tokens (last, so they override markdown styling if specified)
  processed = colorTokensToBlessedTags(processed, theme)

  return processed
}

/**
 * Normalize bigText to array.
 *
 * Converts the bigText frontmatter field to a consistent array format
 * for use by the renderer. Handles:
 * - undefined → empty array
 * - string → single-element array
 * - string[] → pass through unchanged
 *
 * @param bigText - The bigText value from slide frontmatter
 * @returns Array of strings for rendering
 *
 * @example
 * normalizeBigText(undefined)  // []
 * normalizeBigText('HELLO')    // ['HELLO']
 * normalizeBigText(['A', 'B']) // ['A', 'B']
 */
export function normalizeBigText(bigText: string | string[] | undefined): string[] {
  if (!bigText) return []
  return Array.isArray(bigText) ? bigText : [bigText]
}
