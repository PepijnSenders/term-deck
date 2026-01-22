/**
 * Export Data Structures
 *
 * This module defines the core interfaces and types for exporting presentations
 * to video (MP4) or GIF formats.
 */

import { writeFile, unlink } from 'fs/promises';
import { execa } from 'execa';

/**
 * Export options
 */
export interface ExportOptions {
  /** Output file path (.mp4 or .gif) */
  output: string
  /** Terminal width in characters */
  width?: number
  /** Terminal height in characters */
  height?: number
  /** Frames per second */
  fps?: number
  /** Time per slide in seconds (for auto-advance) */
  slideTime?: number
  /** Quality (1-100, only for video) */
  quality?: number
}

/**
 * Export format
 */
export type ExportFormat = 'mp4' | 'gif'

/**
 * Asciicast v2 format header
 * https://docs.asciinema.org/manual/asciicast/v2/
 */
export interface AsciicastHeader {
  version: 2
  width: number
  height: number
  timestamp?: number
  env?: Record<string, string>
}

/**
 * Asciicast frame: [time, stream, data]
 * time: timestamp in seconds
 * stream: 'o' for stdout, 'i' for stdin
 * data: the text content
 */
export type AsciicastFrame = [number, 'o' | 'i', string]

/**
 * Recording session state
 */
export interface RecordingSession {
  tempDir: string
  frameCount: number
  width: number
  height: number
  fps: number
}

/**
 * Virtual terminal buffer for capturing frames
 *
 * We render to a string buffer and convert to images
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
   * Set character at position
   */
  setChar(x: number, y: number, char: string, color: string = '#ffffff'): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.buffer[y][x] = char
      this.colors[y][x] = color
    }
  }

  /**
   * Clear the buffer
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
   * Get buffer as string (for debugging)
   */
  toString(): string {
    return this.buffer.map((row) => row.join('')).join('\n')
  }

  /**
   * Convert buffer to PNG image data
   */
  async toPng(): Promise<Uint8Array> {
    // Use canvas or similar to render text to image
    return renderTerminalToPng(this.buffer, this.colors, this.width, this.height)
  }
}

// Character dimensions in pixels (monospace font)
const CHAR_WIDTH = 10
const CHAR_HEIGHT = 20

/**
 * Render terminal buffer to PNG
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

/**
 * Capture blessed screen content to virtual terminal
 *
 * This parses the blessed screen's internal buffer
 */
export function captureScreen(
  screen: any, // neo-blessed screen type
  vt: VirtualTerminal
): void {
  // blessed stores screen content in screen.lines
  // Each line is an array of cells with char, fg, bg

  const lines = screen.lines || []

  for (let y = 0; y < Math.min(lines.length, vt.height); y++) {
    const line = lines[y]
    if (!line) continue

    for (let x = 0; x < Math.min(line.length, vt.width); x++) {
      const cell = line[x]
      if (!cell) continue

      // Cell format: [char, attr] or just char
      const char = Array.isArray(cell) ? cell[0] : cell
      const attr = Array.isArray(cell) ? cell[1] : null

      // Extract color from attr (blessed-specific format)
      const color = extractColor(attr) || '#ffffff'

      vt.setChar(x, y, char || ' ', color)
    }
  }
}

/**
 * Capture blessed screen content as ANSI escape sequence string
 *
 * This generates a string with ANSI color codes that can be played back
 * in a terminal or saved to an asciicast file.
 *
 * @param screen - The neo-blessed screen to capture
 * @returns ANSI-encoded string representation of the screen
 */
export function captureScreenAsAnsi(screen: any): string {
  // blessed can output its content with ANSI codes
  // We need to convert the internal buffer to ANSI escape sequences

  const lines = screen.lines || []
  const output: string[] = []

  // Clear screen and reset cursor
  output.push('\x1b[2J\x1b[H')

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y]
    if (!line) {
      output.push('\n')
      continue
    }

    let lineStr = ''
    let lastColor: string | null = null

    for (let x = 0; x < line.length; x++) {
      const cell = line[x]
      if (!cell) {
        lineStr += ' '
        continue
      }

      // Cell format: [char, attr] or just char
      const char = Array.isArray(cell) ? cell[0] : cell
      const attr = Array.isArray(cell) ? cell[1] : null

      // Extract color
      const color = extractColor(attr)

      // Apply color if changed
      if (color && color !== lastColor) {
        // Convert hex to ANSI 256-color code
        lineStr += hexToAnsi256(color)
        lastColor = color
      }

      lineStr += char || ' '
    }

    // Reset color at end of line
    if (lastColor) {
      lineStr += '\x1b[0m'
    }

    output.push(lineStr)
    if (y < lines.length - 1) {
      output.push('\n')
    }
  }

  return output.join('')
}

/**
 * Convert hex color to ANSI 256-color escape sequence
 */
function hexToAnsi256(hex: string): string {
  // Parse hex color
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  // Convert to 256-color palette
  // Use 216-color cube (16-231)
  const rIndex = Math.round(r / 51)
  const gIndex = Math.round(g / 51)
  const bIndex = Math.round(b / 51)

  const colorCode = 16 + (rIndex * 36) + (gIndex * 6) + bIndex

  // Return ANSI escape sequence for foreground color
  return `\x1b[38;5;${colorCode}m`
}

/**
 * Extract hex color from blessed attribute
 */
function extractColor(attr: any): string | null {
  if (!attr) return null

  // blessed stores fg color in attr.fg
  if (typeof attr === 'object' && attr.fg !== undefined) {
    // Could be number (256 color) or string (hex)
    if (typeof attr.fg === 'string' && attr.fg.startsWith('#')) {
      return attr.fg
    }
    // Convert 256 color to hex
    if (typeof attr.fg === 'number') {
      return ansi256ToHex(attr.fg)
    }
  }

  return null
}

/**
 * Convert ANSI 256 color to hex
 */
export function ansi256ToHex(code: number): string {
  // Standard 16 colors
  const standard16 = [
    '#000000', '#800000', '#008000', '#808000',
    '#000080', '#800080', '#008080', '#c0c0c0',
    '#808080', '#ff0000', '#00ff00', '#ffff00',
    '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
  ]

  if (code < 16) {
    return standard16[code]
  }

  // 216 color cube (16-231)
  if (code < 232) {
    const n = code - 16
    const r = Math.floor(n / 36) * 51
    const g = Math.floor((n % 36) / 6) * 51
    const b = (n % 6) * 51
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Grayscale (232-255)
  const gray = (code - 232) * 10 + 8
  const hex = gray.toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

/**
 * Create a new recording session
 */
export async function createRecordingSession(
  options: ExportOptions
): Promise<RecordingSession> {
  const { tmpdir } = await import('os')
  const { join } = await import('path')
  const { mkdir } = await import('fs/promises')

  // Create temp directory for frames
  const tempDir = join(tmpdir(), `term-deck-export-${Date.now()}`)
  await mkdir(tempDir, { recursive: true })

  return {
    tempDir,
    frameCount: 0,
    width: options.width ?? 120,
    height: options.height ?? 40,
    fps: options.fps ?? 30,
  }
}

/**
 * Save a frame to the recording session
 */
export async function saveFrame(
  session: RecordingSession,
  png: Uint8Array
): Promise<void> {
  const { join } = await import('path')

  const frameNum = session.frameCount.toString().padStart(6, '0')
  const framePath = join(session.tempDir, `frame_${frameNum}.png`)

  await writeFile(framePath, png)
  session.frameCount++
}

/**
 * Cleanup recording session
 */
export async function cleanupSession(session: RecordingSession): Promise<void> {
  const { rm } = await import('fs/promises')
  await rm(session.tempDir, { recursive: true, force: true })
}

/**
 * Check if ffmpeg is available
 *
 * Throws an error with installation instructions if ffmpeg is not found
 */
export async function checkFfmpeg(): Promise<void> {
  try {
    await execa('which', ['ffmpeg'])
  } catch {
    throw new Error(
      'ffmpeg not found. Install it with:\n' +
      '  macOS: brew install ffmpeg\n' +
      '  Ubuntu: sudo apt install ffmpeg'
    )
  }
}

/**
 * Detect export format from filename
 *
 * Checks the file extension and returns the corresponding export format.
 * Throws an error if the extension is not recognized.
 *
 * @param output - The output file path
 * @returns The export format ('mp4' or 'gif')
 * @throws Error if the file extension is not .mp4 or .gif
 */
export function detectFormat(output: string): ExportFormat {
  if (output.endsWith('.gif')) return 'gif'
  if (output.endsWith('.mp4')) return 'mp4'

  throw new Error(
    `Unknown output format for ${output}. Use .mp4 or .gif extension.`
  )
}

/**
 * Encode frames to video using ffmpeg
 */
async function encodeVideo(
  session: RecordingSession,
  output: string,
  format: ExportFormat,
  quality?: number
): Promise<void> {
  const { join } = await import('path')
  const inputPattern = join(session.tempDir, 'frame_%06d.png')

  if (format === 'mp4') {
    await encodeMp4(inputPattern, output, session.fps, quality ?? 80)
  } else {
    await encodeGif(inputPattern, output, session.fps)
  }
}

/**
 * Encode to MP4
 */
async function encodeMp4(
  input: string,
  output: string,
  fps: number,
  quality: number
): Promise<void> {
  // CRF: 0 = lossless, 51 = worst. ~18-23 is good quality
  const crf = Math.round(51 - (quality / 100) * 33)

  await execa('ffmpeg', [
    '-y',
    '-framerate', fps.toString(),
    '-i', input,
    '-c:v', 'libx264',
    '-crf', crf.toString(),
    '-pix_fmt', 'yuv420p',
    output
  ])
}

/**
 * Encode to GIF
 */
async function encodeGif(
  input: string,
  output: string,
  fps: number
): Promise<void> {
  const { tmpdir } = await import('os')
  const { join } = await import('path')

  // Two-pass encoding for better quality GIF
  const paletteFile = join(tmpdir(), `palette-${Date.now()}.png`)

  try {
    // Pass 1: Generate palette
    await execa('ffmpeg', [
      '-y',
      '-framerate', fps.toString(),
      '-i', input,
      '-vf', `fps=${fps},scale=-1:-1:flags=lanczos,palettegen=stats_mode=diff`,
      paletteFile
    ])

    // Pass 2: Encode with palette
    await execa('ffmpeg', [
      '-y',
      '-framerate', fps.toString(),
      '-i', input,
      '-i', paletteFile,
      '-lavfi', `fps=${fps},scale=-1:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      output
    ])
  } finally {
    // Cleanup palette
    try {
      await unlink(paletteFile)
    } catch {
      // Ignore
    }
  }
}

/**
 * Export a presentation to video
 */
export async function exportPresentation(
  slidesDir: string,
  options: ExportOptions
): Promise<void> {
  // Check ffmpeg is available
  await checkFfmpeg()

  // Detect format from output extension
  const format = detectFormat(options.output)

  // Load deck
  const { loadDeck } = await import('../core/slide.js')
  const deck = await loadDeck(slidesDir)

  if (deck.slides.length === 0) {
    throw new Error(`No slides found in ${slidesDir}`)
  }

  // Create recording session
  const session = await createRecordingSession(options)

  // Create virtual terminal
  const vt = new VirtualTerminal(session.width, session.height)

  // Create renderer (headless mode)
  const { createRenderer, destroyRenderer, renderSlide } = await import('../renderer/screen.js')
  const renderer = createRenderer(deck.config.theme)

  // Override screen dimensions
  ;(renderer.screen as any).width = session.width
  ;(renderer.screen as any).height = session.height

  const slideTime = options.slideTime ?? 3 // seconds per slide
  const framesPerSlide = session.fps * slideTime

  console.log(`Exporting ${deck.slides.length} slides...`)

  try {
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i]
      console.log(`  Slide ${i + 1}/${deck.slides.length}: ${slide.frontmatter.title}`)

      // Render slide
      await renderSlide(renderer, slide)

      // Capture frames for this slide
      for (let f = 0; f < framesPerSlide; f++) {
        // Update matrix rain
        renderer.screen.render()

        // Capture to virtual terminal
        captureScreen(renderer.screen, vt)

        // Save frame
        const png = await vt.toPng()
        await saveFrame(session, png)
      }
    }

    // Encode video
    console.log('Encoding video...')
    await encodeVideo(session, options.output, format, options.quality)

    console.log(`Exported to ${options.output}`)
  } finally {
    // Cleanup
    destroyRenderer(renderer)
    await cleanupSession(session)
  }
}

/**
 * Record presentation as ANSI text file (asciicast format)
 *
 * This is an alternative to the video export that doesn't require ffmpeg or canvas.
 * The output can be played back with asciinema: `asciinema play output.cast`
 *
 * @param slidesDir - Directory containing slide markdown files
 * @param output - Output file path (e.g., 'presentation.cast')
 * @param options - Recording options
 */
export async function recordAnsi(
  slidesDir: string,
  output: string,
  options: { slideTime?: number; width?: number; height?: number } = {}
): Promise<void> {
  // Load deck
  const { loadDeck } = await import('../core/slide.js')
  const deck = await loadDeck(slidesDir)

  if (deck.slides.length === 0) {
    throw new Error(`No slides found in ${slidesDir}`)
  }

  // Create renderer (headless mode)
  const { createRenderer, destroyRenderer, renderSlide } = await import('../renderer/screen.js')
  const renderer = createRenderer(deck.config.theme)

  // Override screen dimensions if specified
  const width = options.width ?? 120
  const height = options.height ?? 40
  ;(renderer.screen as any).width = width
  ;(renderer.screen as any).height = height

  const slideTime = options.slideTime ?? 3
  const frames: AsciicastFrame[] = []
  let currentTime = 0

  console.log(`Recording ${deck.slides.length} slides to asciicast format...`)

  try {
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i]
      console.log(`  Slide ${i + 1}/${deck.slides.length}: ${slide.frontmatter.title}`)

      // Render slide
      await renderSlide(renderer, slide)

      // Capture screen as ANSI string
      const content = captureScreenAsAnsi(renderer.screen)

      // Add frame
      frames.push([currentTime, 'o', content])
      currentTime += slideTime
    }

    // Write asciicast file
    const header: AsciicastHeader = {
      version: 2,
      width,
      height,
      timestamp: Math.floor(Date.now() / 1000),
      env: { TERM: 'xterm-256color' },
    }

    const lines = [JSON.stringify(header)]
    for (const frame of frames) {
      lines.push(JSON.stringify(frame))
    }

    await writeFile(output, lines.join('\n') + '\n')

    console.log(`Recorded to ${output}`)
    console.log(`Play with: asciinema play ${output}`)
  } finally {
    destroyRenderer(renderer)
  }
}
