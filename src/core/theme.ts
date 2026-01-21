import { parse as parseYaml } from 'yaml'
import deepmerge from 'deepmerge'
import gradient from 'gradient-string'
import type { Theme, PartialTheme } from '../schemas/theme'
import { ThemeSchema } from '../schemas/theme'
import { safeParse, ValidationError } from '../schemas/validation'

/**
 * Error class for theme-related failures.
 * Includes optional source information (theme name and file path) for better debugging.
 */
export class ThemeError extends Error {
  /**
   * @param message - The error message
   * @param themeName - Optional name of the theme that caused the error
   * @param path - Optional path to the theme file or package
   */
  constructor(
    message: string,
    public readonly themeName?: string,
    public readonly path?: string
  ) {
    super(message)
    this.name = 'ThemeError'
  }
}

/**
 * Format any error into a user-friendly ThemeError.
 * Handles ValidationError, generic Error, and unknown error types.
 *
 * @param error - The error to format
 * @param source - Description of the theme source (e.g., file path or package name)
 * @returns A ThemeError with a user-friendly message
 *
 * @example
 * try {
 *   await loadThemeFromFile('./theme.yml')
 * } catch (error) {
 *   throw formatThemeError(error, './theme.yml')
 * }
 */
export function formatThemeError(error: unknown, source: string): ThemeError {
  if (error instanceof ValidationError) {
    return new ThemeError(
      `Invalid theme from ${source}:\n${error.message}`,
      undefined,
      source
    )
  }

  if (error instanceof Error) {
    return new ThemeError(
      `Failed to load theme from ${source}: ${error.message}`,
      undefined,
      source
    )
  }

  return new ThemeError(`Unknown error loading theme from ${source}`)
}

/**
 * Theme object with extension capability.
 * Extends the base Theme type with an extend() method that allows
 * Tailwind-style theme customization.
 */
export interface ThemeObject extends Theme {
  /**
   * Create a new theme by merging overrides into this theme.
   * Uses deep merge with array replacement strategy.
   *
   * @param overrides - Partial theme object with values to override
   * @returns A new ThemeObject with the merged values
   *
   * @example
   * const custom = matrix.extend({
   *   colors: { primary: '#ff0066' }
   * })
   *
   * @example
   * // Chained extensions
   * const custom = matrix
   *   .extend({ colors: { primary: '#ff0066' } })
   *   .extend({ animations: { revealSpeed: 0.5 } })
   */
  extend(overrides: PartialTheme): ThemeObject
}

/**
 * Theme package structure for npm packages or local theme files.
 * Contains the raw YAML source, parsed theme, and package metadata.
 */
export interface ThemePackage {
  /** Raw YAML content of the theme file */
  yaml: string

  /** Parsed and validated theme object */
  theme: ThemeObject

  /** Package metadata */
  meta: {
    /** Package or theme name */
    name: string
    /** Package version */
    version: string
    /** Path to the theme file or package */
    path: string
  }
}

/**
 * Create a ThemeObject from a validated Theme.
 * Internal helper that adds the extend() method to a Theme.
 *
 * @param validated - A validated Theme object
 * @returns A ThemeObject with extension capability
 */
function createThemeFromMerge(base: Theme, overrides: PartialTheme): ThemeObject {
  // Deep merge, with overrides taking precedence
  const merged = deepmerge(base, overrides, {
    // Arrays should be replaced, not concatenated
    arrayMerge: (_, source) => source,
  }) as Theme

  // Re-validate the merged result
  const validated = safeParse(ThemeSchema, merged, 'merged theme')

  return {
    ...validated,
    extend(newOverrides: PartialTheme): ThemeObject {
      return createThemeFromMerge(validated, newOverrides)
    },
  }
}

/**
 * Create a theme from a YAML string.
 * Parses the YAML, validates it against ThemeSchema, and returns a ThemeObject
 * with extension capability.
 *
 * @param yaml - The YAML string containing the theme definition
 * @returns A validated ThemeObject with extend() method
 * @throws {Error} If the YAML syntax is invalid
 * @throws {ValidationError} If the parsed data doesn't match ThemeSchema
 *
 * @example
 * const theme = createTheme(`
 * name: custom
 * colors:
 *   primary: "#ff0066"
 *   accent: "#00ff66"
 *   background: "#000000"
 *   text: "#ffffff"
 *   muted: "#666666"
 * gradients:
 *   main:
 *     - "#ff0066"
 *     - "#00ff66"
 * glyphs: "0123456789ABCDEF"
 * animations:
 *   revealSpeed: 1.0
 *   matrixDensity: 30
 *   glitchIterations: 3
 *   lineDelay: 20
 *   matrixInterval: 100
 * `)
 */
export function createTheme(yaml: string): ThemeObject {
  const parsed = parseYaml(yaml)
  const validated = safeParse(ThemeSchema, parsed, 'theme')

  return {
    ...validated,
    extend(overrides: PartialTheme): ThemeObject {
      return createThemeFromMerge(validated, overrides)
    },
  }
}

/**
 * Load a theme from a YAML file on the filesystem.
 * Reads the file contents and passes them to createTheme for parsing and validation.
 *
 * @param path - The filesystem path to the YAML theme file
 * @returns A validated ThemeObject with extend() method
 * @throws {Error} If the file cannot be read (e.g., file not found, permission denied)
 * @throws {Error} If the YAML syntax is invalid
 * @throws {ValidationError} If the parsed data doesn't match ThemeSchema
 *
 * @example
 * const theme = await loadThemeFromFile('./themes/matrix.yml')
 * const customTheme = theme.extend({ colors: { primary: '#ff0066' } })
 */
export async function loadThemeFromFile(path: string): Promise<ThemeObject> {
  const file = Bun.file(path)
  const exists = await file.exists()

  if (!exists) {
    throw new Error(`Theme file not found: ${path}`)
  }

  const content = await file.text()
  return createTheme(content)
}

/**
 * Load a theme from an npm package.
 * Packages must export a default ThemeObject.
 *
 * @param name - The npm package name (e.g., '@term-deck/theme-retro')
 * @returns A validated ThemeObject with extend() method
 * @throws {Error} If the package doesn't export a default theme
 * @throws {Error} If the package is not installed (with helpful install message)
 * @throws {ValidationError} If the exported theme doesn't match ThemeSchema
 *
 * @example
 * const theme = await loadThemeFromPackage('@term-deck/theme-retro')
 * const customTheme = theme.extend({ colors: { primary: '#ff0066' } })
 */
export async function loadThemeFromPackage(name: string): Promise<ThemeObject> {
  try {
    // Dynamic import of npm package
    const pkg = await import(name)

    if (!pkg.default) {
      throw new Error(`Theme package "${name}" must export a default theme`)
    }

    // Validate the exported theme
    const validated = safeParse(ThemeSchema, pkg.default, `theme from ${name}`)

    return {
      ...validated,
      extend(overrides: PartialTheme): ThemeObject {
        return createThemeFromMerge(validated, overrides)
      },
    }
  } catch (error) {
    // Handle module not found with helpful message
    // Bun's module resolution errors are not instanceof Error but have message/code properties
    const err = error as { message?: string; code?: string }
    const isModuleNotFound =
      err.message?.includes('Cannot find package') ||
      err.message?.includes('Cannot find module') ||
      err.code === 'MODULE_NOT_FOUND' ||
      err.code === 'ERR_MODULE_NOT_FOUND'

    if (isModuleNotFound) {
      throw new Error(
        `Theme package "${name}" not found. Install it with: bun add ${name}`
      )
    }
    throw error
  }
}

/**
 * Function type for applying a gradient to text.
 * Returns ANSI-colored text with the gradient applied.
 */
export interface GradientFunction {
  (text: string): string
}

/**
 * Create gradient functions from theme gradients.
 * Returns an object mapping gradient names to gradient functions that can be
 * applied to text to produce ANSI-colored output.
 *
 * @param theme - The theme containing gradient definitions
 * @returns Record mapping gradient names to gradient functions
 *
 * @example
 * const gradients = createGradients(theme)
 * const styledText = gradients.fire('Hello World')
 */
export function createGradients(theme: Theme): Record<string, GradientFunction> {
  const gradients: Record<string, GradientFunction> = {}

  for (const [name, colors] of Object.entries(theme.gradients)) {
    gradients[name] = gradient(colors)
  }

  return gradients
}

/**
 * Apply a gradient to text by name.
 * Looks up the gradient in the theme and applies it to the text.
 * Falls back gracefully if the gradient doesn't exist.
 *
 * @param text - The text to apply the gradient to
 * @param gradientName - The name of the gradient to use
 * @param theme - The theme containing gradient definitions
 * @returns The text with gradient applied, or unstyled text if gradient not found
 *
 * @example
 * const styledText = applyGradient('Hello World', 'fire', theme)
 */
export function applyGradient(
  text: string,
  gradientName: string,
  theme: Theme
): string {
  const colors = theme.gradients[gradientName]

  if (!colors) {
    // Fall back gracefully - return unstyled text
    return text
  }

  return gradient(colors)(text)
}

/**
 * Built-in color mappings for color tokens in slide content.
 * These are fixed colors that don't change with the theme.
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
 * Theme colors (PRIMARY, ACCENT, etc.) are resolved from the theme.
 * Built-in colors (GREEN, ORANGE, etc.) use fixed values.
 *
 * @param token - The color token to resolve (e.g., 'PRIMARY', 'GREEN')
 * @param theme - The theme to resolve theme-specific tokens from
 * @returns The hex color value
 *
 * @example
 * const color = resolveColorToken('PRIMARY', theme) // '#00cc66'
 * const color = resolveColorToken('GREEN', theme)   // '#00cc66'
 */
export function resolveColorToken(token: string, theme: Theme): string {
  // Check theme colors first
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

  // Fall back to built-in colors
  return BUILTIN_COLORS[token] ?? theme.colors.text
}

/**
 * Convert color tokens in content to blessed tags.
 * Transforms tokens like {GREEN} to blessed color tags like {#00cc66-fg}.
 * Preserves closing tags {/} as-is.
 *
 * @param content - The content with color tokens
 * @param theme - The theme to resolve theme-specific tokens from
 * @returns Content with color tokens converted to blessed tags
 *
 * @example
 * const content = '{GREEN}Hello{/} {ORANGE}World{/}'
 * const result = colorTokensToBlessedTags(content, theme)
 * // '{#00cc66-fg}Hello{/} {#ff6600-fg}World{/}'
 */
export function colorTokensToBlessedTags(content: string, theme: Theme): string {
  return content.replace(
    /\{(GREEN|ORANGE|CYAN|PINK|WHITE|GRAY|PRIMARY|SECONDARY|ACCENT|MUTED|TEXT|BACKGROUND|\/)\}/g,
    (_, token) => {
      if (token === '/') {
        return '{/}' // Close tag
      }
      const color = resolveColorToken(token, theme)
      return `{${color}-fg}`
    }
  )
}
