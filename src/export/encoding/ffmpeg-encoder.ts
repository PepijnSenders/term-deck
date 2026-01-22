/**
 * FFmpeg Video Encoder
 *
 * This module handles video encoding using ffmpeg. It supports both MP4 and GIF formats,
 * with configurable quality settings and optimized encoding parameters.
 *
 * Responsibilities:
 * - Check ffmpeg availability
 * - Encode frame sequences to MP4 format
 * - Encode frame sequences to GIF format with palette optimization
 */

import { execa } from 'execa';
import { writeFile, unlink } from 'fs/promises';

/**
 * Export format types
 */
export type ExportFormat = 'mp4' | 'gif';

/**
 * Encoding options for video export
 */
export interface EncodingOptions {
  /** Input frame pattern (e.g., '/tmp/frames/frame_%06d.png') */
  inputPattern: string;
  /** Output file path */
  output: string;
  /** Format to encode to */
  format: ExportFormat;
  /** Frames per second */
  fps: number;
  /** Quality setting (1-100, only used for MP4) */
  quality?: number;
}

/**
 * Check if ffmpeg is available on the system
 *
 * @throws Error with installation instructions if ffmpeg is not found
 */
export async function checkFfmpeg(): Promise<void> {
  try {
    await execa('which', ['ffmpeg']);
  } catch {
    throw new Error(
      'ffmpeg not found. Install it with:\n' +
      '  macOS: brew install ffmpeg\n' +
      '  Ubuntu: sudo apt install ffmpeg'
    );
  }
}

/**
 * Detect export format from filename extension
 *
 * @param output - The output file path
 * @returns The export format ('mp4' or 'gif')
 * @throws Error if the file extension is not .mp4 or .gif
 */
export function detectFormat(output: string): ExportFormat {
  if (output.endsWith('.gif')) return 'gif';
  if (output.endsWith('.mp4')) return 'mp4';

  throw new Error(
    `Unknown output format for ${output}. Use .mp4 or .gif extension.`
  );
}

/**
 * Encode frame sequence to video using ffmpeg
 *
 * Routes to the appropriate encoder based on the format.
 *
 * @param options - Encoding options including input pattern, output path, format, and quality
 */
export async function encodeVideo(options: EncodingOptions): Promise<void> {
  const { inputPattern, output, format, fps, quality } = options;

  if (format === 'mp4') {
    await encodeMp4(inputPattern, output, fps, quality ?? 80);
  } else {
    await encodeGif(inputPattern, output, fps);
  }
}

/**
 * Encode frame sequence to MP4 format
 *
 * Uses H.264 codec with CRF (Constant Rate Factor) quality control.
 * CRF ranges from 0 (lossless) to 51 (worst quality).
 * Quality parameter (1-100) is mapped to CRF (18-51) where higher quality = lower CRF.
 *
 * @param input - Input frame pattern (e.g., 'frame_%06d.png')
 * @param output - Output MP4 file path
 * @param fps - Frames per second
 * @param quality - Quality setting (1-100), defaults to 80
 */
async function encodeMp4(
  input: string,
  output: string,
  fps: number,
  quality: number
): Promise<void> {
  // CRF: 0 = lossless, 51 = worst. ~18-23 is good quality
  // Map quality (1-100) to CRF (51-18)
  const crf = Math.round(51 - (quality / 100) * 33);

  await execa('ffmpeg', [
    '-y', // Overwrite output file
    '-framerate', fps.toString(),
    '-i', input,
    '-c:v', 'libx264', // H.264 codec
    '-crf', crf.toString(),
    '-pix_fmt', 'yuv420p', // Pixel format for compatibility
    output
  ]);
}

/**
 * Encode frame sequence to GIF format
 *
 * Uses two-pass encoding for better quality:
 * 1. Generate optimized color palette from input frames
 * 2. Encode using the generated palette with dithering
 *
 * This approach produces much better quality GIFs than single-pass encoding.
 *
 * @param input - Input frame pattern (e.g., 'frame_%06d.png')
 * @param output - Output GIF file path
 * @param fps - Frames per second
 */
async function encodeGif(
  input: string,
  output: string,
  fps: number
): Promise<void> {
  const { tmpdir } = await import('os');
  const { join } = await import('path');

  // Two-pass encoding for better quality GIF
  const paletteFile = join(tmpdir(), `palette-${Date.now()}.png`);

  try {
    // Pass 1: Generate palette with diff stats mode for better color selection
    await execa('ffmpeg', [
      '-y',
      '-framerate', fps.toString(),
      '-i', input,
      '-vf', `fps=${fps},scale=-1:-1:flags=lanczos,palettegen=stats_mode=diff`,
      paletteFile
    ]);

    // Pass 2: Encode with palette using Bayer dithering
    await execa('ffmpeg', [
      '-y',
      '-framerate', fps.toString(),
      '-i', input,
      '-i', paletteFile,
      '-lavfi', `fps=${fps},scale=-1:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      output
    ]);
  } finally {
    // Cleanup palette file
    try {
      await unlink(paletteFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}
