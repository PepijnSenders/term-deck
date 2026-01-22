import gradient from 'gradient-string'
import type { Theme } from '../schemas/theme'

/**
 * Function type for applying a gradient to text.
 * Returns ANSI-colored text with the gradient applied.
 */
export interface GradientFunction {
  (text: string): string
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
