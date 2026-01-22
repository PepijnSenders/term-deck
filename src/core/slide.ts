import matter from 'gray-matter'
import { join } from 'path'
import fg from 'fast-glob'
import { readFile, access } from 'fs/promises'
import { mermaidToAscii as convertMermaid } from 'mermaid-ascii'
import type { Slide } from '../schemas/slide.js'
import type { DeckConfig } from '../schemas/config.js'
import type { Theme } from '../schemas/theme.js'
import { SlideFrontmatterSchema, SlideSchema } from '../schemas/slide.js'
import { DeckConfigSchema } from '../schemas/config.js'
import { safeParse } from '../schemas/validation.js'
import { DEFAULT_THEME } from '../schemas/theme.js'
import { colorTokensToBlessedTags } from './theme.js'

/**
 * Raw parsed slide before validation.
 * This is the intermediate structure after parsing frontmatter
 * but before Zod validation.
 */
export interface RawSlide {
  frontmatter: Record<string, unknown>
  body: string
  notes?: string
  sourcePath: string
}

/**
 * Deck structure containing all slides and configuration.
 * Represents a complete presentation loaded from disk.
 */
export interface Deck {
  slides: Slide[]
  config: DeckConfig
  basePath: string
}

/**
 * Slide file info for sorting and loading.
 * Used during the slide discovery phase.
 */
export interface SlideFile {
  path: string
  name: string
  index: number
}

/**
 * Result of extracting notes from slide content.
 */
export interface ExtractedNotes {
  body: string
  notes?: string
}

const NOTES_MARKER = '<!-- notes -->'
const NOTES_END_MARKER = '<!-- /notes -->'

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
 * Extract presenter notes from body content.
 *
 * Notes are delimited by `<!-- notes -->` marker.
 * An optional `<!-- /notes -->` end marker can be used to include
 * content after notes in the body.
 *
 * @param content - Raw body content from markdown file
 * @returns Object containing separated body and notes
 */
export function extractNotes(content: string): ExtractedNotes {
  const notesStart = content.indexOf(NOTES_MARKER)

  if (notesStart === -1) {
    return { body: content }
  }

  const body = content.slice(0, notesStart).trim()

  // Check for explicit end marker
  const notesEnd = content.indexOf(NOTES_END_MARKER, notesStart)

  let notes: string
  if (notesEnd !== -1) {
    notes = content.slice(notesStart + NOTES_MARKER.length, notesEnd).trim()
  } else {
    // Everything after marker is notes
    notes = content.slice(notesStart + NOTES_MARKER.length).trim()
  }

  return { body, notes: notes || undefined }
}

/**
 * Parse a single slide file.
 *
 * Reads the markdown file, extracts frontmatter using gray-matter,
 * extracts presenter notes, and validates the result against the schema.
 *
 * @param filePath - Path to the markdown slide file
 * @param index - The slide index in the deck (0-indexed)
 * @returns Validated Slide object
 * @throws {ValidationError} If frontmatter or slide validation fails
 */
export async function parseSlide(
  filePath: string,
  index: number
): Promise<Slide> {
  // Read file content
  const content = await readFile(filePath, 'utf-8')

  // Parse frontmatter with gray-matter
  const { data, content: rawBody } = matter(content)

  // Extract notes from body
  const { body, notes } = extractNotes(rawBody)

  // Validate frontmatter
  const frontmatter = safeParse(
    SlideFrontmatterSchema,
    data,
    `frontmatter in ${filePath}`
  )

  // Build full slide object
  const slide = {
    frontmatter,
    body: body.trim(),
    notes: notes?.trim(),
    sourcePath: filePath,
    index,
  }

  // Validate complete slide and return
  return safeParse(SlideSchema, slide, `slide ${filePath}`)
}

/**
 * Find and sort slide files in a directory.
 *
 * Finds all markdown files (*.md), excludes non-slide files like
 * README.md and files starting with underscore, and sorts them
 * numerically by filename (e.g., 01-intro.md, 02-content.md).
 *
 * @param dir - Directory to search for slide files
 * @returns Array of SlideFile objects sorted by filename
 */
export async function findSlideFiles(dir: string): Promise<SlideFile[]> {
  const pattern = join(dir, '*.md')
  const foundFiles = await fg(pattern, { onlyFiles: true })

  const files: SlideFile[] = []

  for (const filePath of foundFiles) {
    const name = filePath.split('/').pop() || ''

    // Skip non-slide files
    if (name === 'README.md' || name.startsWith('_')) {
      continue
    }

    files.push({
      path: filePath,
      name,
      index: 0, // Will be set after sorting
    })
  }

  // Sort by filename numerically (01-intro.md, 02-problem.md, etc.)
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  // Assign indices after sorting
  files.forEach((file, i) => {
    file.index = i
  })

  return files
}

/**
 * Load deck configuration from deck.config.ts in slides directory.
 *
 * Looks for a deck.config.ts file in the specified directory.
 * If found, dynamically imports and validates it against DeckConfigSchema.
 * If not found, returns a default config with the DEFAULT_THEME.
 *
 * @param slidesDir - Directory to search for deck.config.ts
 * @returns Validated DeckConfig object
 * @throws {ValidationError} If config file exists but fails validation
 */
export async function loadDeckConfig(slidesDir: string): Promise<DeckConfig> {
  const configPath = join(slidesDir, 'deck.config.ts')

  try {
    // Check if config file exists
    try {
      await access(configPath)
    } catch {
      // File doesn't exist, return default config with DEFAULT_THEME
      return {
        theme: DEFAULT_THEME,
      }
    }

    // Dynamic import of TypeScript config
    // Add cache buster to prevent module caching in tests
    const configModule = await import(configPath + '?t=' + Date.now())

    if (!configModule.default) {
      throw new Error('deck.config.ts must export default config')
    }

    // Validate config against schema
    return safeParse(DeckConfigSchema, configModule.default, 'deck.config.ts')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      // No config file found, use defaults
      return { theme: DEFAULT_THEME }
    }
    throw error
  }
}

/**
 * Load a complete deck from a directory.
 *
 * Loads the deck configuration, finds all slide files, and parses
 * them in parallel. Returns a Deck object containing all slides,
 * the configuration, and the base path.
 *
 * @param slidesDir - Directory containing slide files and optional deck.config.ts
 * @returns Complete Deck object with slides, config, and basePath
 * @throws {ValidationError} If any slide fails to parse or validate
 */
export async function loadDeck(slidesDir: string): Promise<Deck> {
  // Load config first
  const config = await loadDeckConfig(slidesDir)

  // Find all markdown files
  const slideFiles = await findSlideFiles(slidesDir)

  // Parse all slides in parallel
  const slides = await Promise.all(
    slideFiles.map((file) => parseSlide(file.path, file.index))
  )

  return {
    slides,
    config,
    basePath: slidesDir,
  }
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

/**
 * Error class for slide parsing failures.
 * Includes the file path of the slide that failed to parse and
 * optionally the underlying cause for error chaining.
 */
export class SlideParseError extends Error {
  /**
   * @param message - The error message describing what went wrong
   * @param filePath - Path to the slide file that failed to parse
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(
    message: string,
    public readonly filePath: string,
    public override readonly cause?: Error
  ) {
    super(message)
    this.name = 'SlideParseError'
  }
}

/**
 * Error class for deck loading failures.
 * Includes the directory path of the slides and optionally
 * the underlying cause for error chaining.
 */
export class DeckLoadError extends Error {
  /**
   * @param message - The error message describing what went wrong
   * @param slidesDir - Path to the directory that was being loaded
   * @param cause - Optional underlying error that caused this failure
   */
  constructor(
    message: string,
    public readonly slidesDir: string,
    public override readonly cause?: Error
  ) {
    super(message)
    this.name = 'DeckLoadError'
  }
}

/**
 * Format a slide parse error for user-friendly display.
 * Creates a multi-line message with the file path, error message,
 * and optional cause chain.
 *
 * @param error - The SlideParseError to format
 * @returns A formatted string suitable for console output
 *
 * @example
 * const error = new SlideParseError(
 *   'Missing required field: title',
 *   '/slides/01-intro.md',
 *   new Error('Validation failed')
 * )
 * console.log(formatSlideError(error))
 * // Error parsing slide: /slides/01-intro.md
 * //   Missing required field: title
 * //   Caused by: Validation failed
 */
export function formatSlideError(error: SlideParseError): string {
  let msg = `Error parsing slide: ${error.filePath}\n`
  msg += `  ${error.message}\n`

  if (error.cause) {
    msg += `  Caused by: ${error.cause.message}\n`
  }

  return msg
}
