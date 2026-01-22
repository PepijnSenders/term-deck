import matter from 'gray-matter'
import { join } from 'path'
import fg from 'fast-glob'
import { readFile, access } from 'fs/promises'
import type { Slide } from '../schemas/slide.js'
import type { DeckConfig } from '../schemas/config.js'
import { SlideFrontmatterSchema, SlideSchema } from '../schemas/slide.js'
import { DeckConfigSchema } from '../schemas/config.js'
import { safeParse } from '../schemas/validation.js'
import { DEFAULT_THEME } from '../schemas/theme.js'

// Re-export for backwards compatibility
export { processSlideContent, normalizeBigText } from './content-processor.js'

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
