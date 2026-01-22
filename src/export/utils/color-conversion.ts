/**
 * Color Conversion Utilities
 *
 * Utilities for converting between hex colors, ANSI 256-color codes,
 * and extracting colors from blessed cell attributes.
 */

/**
 * Convert hex color to ANSI 256-color escape sequence
 *
 * @param hex - Hex color string (e.g., '#ff0000')
 * @returns ANSI escape sequence for foreground color
 */
export function hexToAnsi256(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  const rIndex = Math.round(r / 51)
  const gIndex = Math.round(g / 51)
  const bIndex = Math.round(b / 51)

  const colorCode = 16 + (rIndex * 36) + (gIndex * 6) + bIndex

  return `\x1b[38;5;${colorCode}m`
}

/**
 * Convert ANSI 256 color code to hex
 *
 * @param code - ANSI 256-color code (0-255)
 * @returns Hex color string
 */
export function ansi256ToHex(code: number): string {
  const standard16 = [
    '#000000', '#800000', '#008000', '#808000',
    '#000080', '#800080', '#008080', '#c0c0c0',
    '#808080', '#ff0000', '#00ff00', '#ffff00',
    '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
  ]

  if (code < 16) {
    return standard16[code]
  }

  if (code < 232) {
    const n = code - 16
    const r = Math.floor(n / 36) * 51
    const g = Math.floor((n % 36) / 6) * 51
    const b = (n % 6) * 51
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  const gray = (code - 232) * 10 + 8
  const hex = gray.toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

/**
 * Extract hex color from blessed attribute
 *
 * @param attr - Blessed cell attribute object
 * @returns Hex color string or null if not found
 */
export function extractColor(attr: any): string | null {
  if (!attr) return null

  if (typeof attr === 'object' && attr.fg !== undefined) {
    if (typeof attr.fg === 'string' && attr.fg.startsWith('#')) {
      return attr.fg
    }
    if (typeof attr.fg === 'number') {
      return ansi256ToHex(attr.fg)
    }
  }

  return null
}
