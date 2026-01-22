import matter from 'gray-matter'
import { readFile } from 'fs/promises'
import type { Slide } from '../schemas/slide.js'
import { SlideFrontmatterSchema, SlideSchema } from '../schemas/slide.js'
import { safeParse } from '../schemas/validation.js'

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
