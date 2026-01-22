/**
 * Export Data Structures
 *
 * This module defines the core interfaces and types for exporting presentations
 * to video (MP4) or GIF formats.
 */

import { writeFile } from 'fs/promises';
import { hexToAnsi256, extractColor } from './utils/color-conversion.js';
import { VirtualTerminal } from './utils/virtual-terminal.js';
import { checkFfmpeg, detectFormat, encodeVideo, type ExportFormat } from './encoding/ffmpeg-encoder.js';

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
 * Re-exported from ffmpeg-encoder for backwards compatibility
 */
export type { ExportFormat } from './encoding/ffmpeg-encoder.js';

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
 * Re-exported from ffmpeg-encoder for backwards compatibility
 */
export { checkFfmpeg } from './encoding/ffmpeg-encoder.js';

/**
 * Detect export format from filename
 * Re-exported from ffmpeg-encoder for backwards compatibility
 */
export { detectFormat } from './encoding/ffmpeg-encoder.js';

/**
 * Encode frames to video using ffmpeg
 *
 * Delegates to the ffmpeg-encoder module to handle the actual encoding.
 */
async function encodeToVideo(
  session: RecordingSession,
  output: string,
  format: ExportFormat,
  quality?: number
): Promise<void> {
  const { join } = await import('path');
  const inputPattern = join(session.tempDir, 'frame_%06d.png');

  await encodeVideo({
    inputPattern,
    output,
    format,
    fps: session.fps,
    quality
  });
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
    await encodeToVideo(session, options.output, format, options.quality)

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
