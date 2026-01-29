import type { Theme } from '@/schemas/theme'

/**
 * Get CSS gradient for a named gradient.
 */
export function getGradientCSS(gradientName: string, theme: Theme): string {
  const colors = theme.gradients[gradientName]

  if (!colors || colors.length < 2) {
    return theme.colors.primary
  }

  return `linear-gradient(90deg, ${colors.join(', ')})`
}

/**
 * Get all gradient names from a theme.
 */
export function getGradientNames(theme: Theme): string[] {
  return Object.keys(theme.gradients)
}
