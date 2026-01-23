import { join } from 'path'
import { pathToFileURL } from 'url'
import fg from 'fast-glob'
import { access } from 'fs/promises'
import type { DeckConfig } from '../schemas/config.js'
import type { Slide } from '../schemas/slide.js'
import { DeckConfigSchema } from '../schemas/config.js'
import { safeParse } from '../schemas/validation.js'
import { DEFAULT_THEME } from '../schemas/theme.js'
import { parseSlide } from './slide.js'

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
 * Load deck configuration from deck.config.js or deck.config.ts in slides directory.
 *
 * Looks for a deck.config.js (preferred) or deck.config.ts file in the specified directory.
 * If found, dynamically imports and validates it against DeckConfigSchema.
 * If not found, returns a default config with the DEFAULT_THEME.
 *
 * @param slidesDir - Directory to search for deck config file
 * @returns Validated DeckConfig object
 * @throws {ValidationError} If config file exists but fails validation
 */
export async function loadDeckConfig(slidesDir: string): Promise<DeckConfig> {
  // Try .js first (preferred for Node.js compatibility), then .ts (for dev with tsx)
  const configPaths = [
    { path: join(slidesDir, 'deck.config.js'), name: 'deck.config.js' },
    { path: join(slidesDir, 'deck.config.ts'), name: 'deck.config.ts' },
  ]

  let configPath: string | null = null
  let configName = 'deck.config.js'

  // Find which config file exists
  for (const config of configPaths) {
    try {
      await access(config.path)
      configPath = config.path
      configName = config.name
      break
    } catch {
      // File doesn't exist, try next
      continue
    }
  }

  // No config file found
  if (!configPath) {
    return {
      theme: DEFAULT_THEME,
    }
  }

  try {
    // Dynamic import of config
    // Convert file path to file:// URL for ES module imports
    const fileUrl = pathToFileURL(configPath).href

    // Add cache buster to prevent module caching in tests only
    // In production, we want normal module caching behavior
    const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
    const cacheBuster = isTest ? `?t=${Date.now()}-${Math.random()}` : ''
    const configModule = await import(fileUrl + cacheBuster)

    if (!configModule.default) {
      throw new Error(`${configName} must export default config`)
    }

    // Validate config against schema
    const config = safeParse(DeckConfigSchema, configModule.default, configName)

    // Resolve theme from preset or use DEFAULT_THEME
    if (!config.theme) {
      // Map of available theme presets
      const themePresets: Record<string, typeof DEFAULT_THEME> = {
        matrix: DEFAULT_THEME,
      }

      // Use themePreset if specified, otherwise default to 'matrix'
      const presetName = config.themePreset || 'matrix'
      config.theme = themePresets[presetName] || DEFAULT_THEME
    }

    return config
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
