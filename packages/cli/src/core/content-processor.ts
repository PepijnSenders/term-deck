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

  // Process generic code blocks
  processed = processCodeBlocks(processed)

  // Apply color tokens
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
