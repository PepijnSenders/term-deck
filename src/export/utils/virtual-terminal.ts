/**
 * Virtual Terminal Buffer
 *
 * Provides an in-memory representation of a terminal screen with character
 * and color information. Used for capturing terminal output for export.
 */

/**
 * Virtual terminal buffer for capturing frames
 *
 * Maintains a 2D grid of characters and their colors, which can be
 * rendered to PNG images for video export.
 */
export class VirtualTerminal {
  private buffer: string[][]
  private colors: string[][]

  constructor(
    public width: number,
    public height: number
  ) {
    this.buffer = Array.from({ length: height }, () =>
      Array(width).fill(' ')
    )
    this.colors = Array.from({ length: height }, () =>
      Array(width).fill('#ffffff')
    )
  }

  /**
   * Set character at position with optional color
   */
  setChar(x: number, y: number, char: string, color: string = '#ffffff'): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.buffer[y][x] = char
      this.colors[y][x] = color
    }
  }

  /**
   * Clear the buffer to blank spaces
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.buffer[y][x] = ' '
        this.colors[y][x] = '#ffffff'
      }
    }
  }

  /**
   * Get buffer contents as plain text string
   */
  toString(): string {
    return this.buffer.map((row) => row.join('')).join('\n')
  }

  /**
   * Get the raw character buffer
   */
  getBuffer(): string[][] {
    return this.buffer
  }

  /**
   * Get the color buffer
   */
  getColors(): string[][] {
    return this.colors
  }

  /**
   * Convert buffer to PNG image data
   */
  async toPng(): Promise<Uint8Array> {
    return renderTerminalToPng(this.buffer, this.colors, this.width, this.height)
  }
}

// Character dimensions in pixels (monospace font)
const CHAR_WIDTH = 10
const CHAR_HEIGHT = 20

/**
 * Render terminal buffer to PNG using canvas
 *
 * @param buffer - 2D array of characters
 * @param colors - 2D array of hex color codes
 * @param width - Terminal width in characters
 * @param height - Terminal height in characters
 * @returns PNG image data as Uint8Array
 */
async function renderTerminalToPng(
  buffer: string[][],
  colors: string[][],
  width: number,
  height: number
): Promise<Uint8Array> {
  // Dynamic import to avoid bundling issues
  const { createCanvas } = await import('canvas')

  const canvas = createCanvas(width * CHAR_WIDTH, height * CHAR_HEIGHT)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Set font
  ctx.font = `${CHAR_HEIGHT - 4}px monospace`
  ctx.textBaseline = 'top'

  // Render each character
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = buffer[y][x]
      const color = colors[y][x]

      if (char !== ' ') {
        ctx.fillStyle = color
        ctx.fillText(char, x * CHAR_WIDTH, y * CHAR_HEIGHT + 2)
      }
    }
  }

  return canvas.toBuffer('image/png')
}
