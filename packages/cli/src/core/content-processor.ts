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
