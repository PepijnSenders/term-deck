import { mermaidToAscii as convertMermaid } from 'mermaid-ascii'

/**
 * Pattern to match mermaid code blocks in markdown content.
 * Captures the diagram code inside the block.
 *
 * Matches: ```mermaid\n<content>```
 * Group 1: The mermaid diagram code
 */
const MERMAID_BLOCK_PATTERN = /```mermaid\n([\s\S]*?)```/g

/**
 * Check if content contains mermaid diagrams.
 *
 * @param content - The markdown content to check
 * @returns true if the content contains at least one mermaid code block
 */
export function hasMermaidDiagrams(content: string): boolean {
  // Reset pattern since we use global flag
  MERMAID_BLOCK_PATTERN.lastIndex = 0
  return MERMAID_BLOCK_PATTERN.test(content)
}

/**
 * Extract all mermaid blocks from content.
 *
 * Finds all mermaid code blocks and extracts the diagram code
 * (without the ```mermaid and ``` delimiters).
 *
 * @param content - The markdown content to search
 * @returns Array of mermaid diagram code strings (trimmed)
 */
export function extractMermaidBlocks(content: string): string[] {
  const blocks: string[] = []
  let match: RegExpExecArray | null

  // Reset pattern before use
  MERMAID_BLOCK_PATTERN.lastIndex = 0

  while ((match = MERMAID_BLOCK_PATTERN.exec(content)) !== null) {
    blocks.push(match[1].trim())
  }

  return blocks
}

/**
 * Format a mermaid parsing error as ASCII.
 *
 * Creates a visually recognizable error block showing the
 * first few lines of the diagram with a border.
 *
 * @param code - The mermaid diagram code that failed to parse
 * @param _error - The error that occurred (unused but kept for signature)
 * @returns ASCII art error block
 */
export function formatMermaidError(code: string, _error: unknown): string {
  const lines = [
    '┌─ Diagram (parse error) ─┐',
    '│                         │',
  ]

  // Show first few lines of the diagram
  const codeLines = code.split('\n').slice(0, 5)
  for (const line of codeLines) {
    const truncated = line.slice(0, 23).padEnd(23)
    lines.push(`│ ${truncated} │`)
  }

  if (code.split('\n').length > 5) {
    lines.push('│ ...                     │')
  }

  lines.push('│                         │')
  lines.push('└─────────────────────────┘')

  return lines.join('\n')
}

/**
 * Convert mermaid diagram to ASCII art.
 *
 * Uses the mermaid-ascii library to convert mermaid diagram
 * syntax to ASCII art representation. Falls back to an error
 * block if parsing fails.
 *
 * @param mermaidCode - Raw mermaid diagram code
 * @returns ASCII art representation or error block
 */
export function mermaidToAscii(mermaidCode: string): string {
  try {
    return convertMermaid(mermaidCode)
  } catch (error) {
    // If parsing fails, return a formatted error block
    return formatMermaidError(mermaidCode, error)
  }
}

/**
 * Escape special regex characters in a string.
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Process all mermaid blocks in slide content.
 *
 * Finds all mermaid code blocks in the content and replaces them
 * with their ASCII art representation.
 *
 * @param content - The slide content potentially containing mermaid blocks
 * @returns Content with mermaid blocks replaced by ASCII art
 */
export function processMermaidDiagrams(content: string): string {
  if (!hasMermaidDiagrams(content)) {
    return content
  }

  // Find all blocks and convert
  let result = content
  const blocks = extractMermaidBlocks(content)

  for (const block of blocks) {
    const ascii = mermaidToAscii(block)

    // Replace mermaid block with ASCII
    // The pattern matches the code block including newlines
    result = result.replace(
      new RegExp('```mermaid\\n' + escapeRegex(block) + '\\n?```', 'g'),
      ascii
    )
  }

  return result
}
