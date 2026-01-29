/**
 * Export Type Definitions
 *
 * This module defines the core interfaces and types for exporting presentations
 * to various formats (video, GIF, asciicast).
 */

/**
 * Export options for video/GIF generation
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
 * Asciicast v2 format header
 * @see https://docs.asciinema.org/manual/asciicast/v2/
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
 * - time: timestamp in seconds
 * - stream: 'o' for stdout, 'i' for stdin
 * - data: the text content
 */
export type AsciicastFrame = [number, 'o' | 'i', string]

/**
 * Export format type
 * Re-exported from ffmpeg-encoder
 */
export type { ExportFormat } from './encoding/ffmpeg-encoder.js';
