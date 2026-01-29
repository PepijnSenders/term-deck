import { ValidationError } from '../schemas/validation'

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
