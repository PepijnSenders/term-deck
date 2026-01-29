import { parse as parseYaml } from 'yaml'
import deepmerge from 'deepmerge'
import type { Theme, PartialTheme } from '../schemas/theme'
import { ThemeSchema } from '../schemas/theme'
import { safeParse } from '../schemas/validation'

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
 * Create a ThemeObject from validated Theme and overrides.
 * Internal helper that merges themes and adds the extend() method.
 *
 * @param base - A validated Theme object
 * @param overrides - Partial theme with values to override
 * @returns A ThemeObject with extension capability
 */
export function createThemeFromMerge(base: Theme, overrides: PartialTheme): ThemeObject {
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

// Re-export commonly used functions for convenience
export { ThemeError, formatThemeError } from './theme-errors'
export {
  createGradients,
  applyGradient,
  resolveColorToken,
  colorTokensToBlessedTags,
  BUILTIN_COLORS,
} from './theme-colors'
export type { GradientFunction } from './theme-colors'
