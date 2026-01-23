/**
 * ANSI Recording Module
 *
 * This module handles recording presentations as ANSI text files using the
 * asciicast v2 format. This format doesn't require ffmpeg or canvas and can
 * be played back with asciinema.
 *
 * @see https://docs.asciinema.org/manual/asciicast/v2/
 */

import { writeFile } from 'fs/promises';
import { intro, outro, log, spinner } from '@clack/prompts';
import { loadDeck } from '../core/deck-loader.js';
import { createRenderer, destroyRenderer, renderSlide } from '../renderer/screen.js';
import { setScreenDimensions } from '../renderer/types/screen.js';
import { captureScreenAsAnsi } from './capture/screen-capture.js';
import type { AsciicastHeader, AsciicastFrame } from './types.js';

/**
 * Options for ANSI recording
 */
export interface AnsiRecordOptions {
  /** Time per slide in seconds */
  slideTime?: number
  /** Terminal width in characters */
  width?: number
  /** Terminal height in characters */
  height?: number
}

/**
 * Record presentation as ANSI text file (asciicast format)
 *
 * This is an alternative to video export that doesn't require ffmpeg or canvas.
 * The output can be played back with asciinema: `asciinema play output.cast`
 *
 * @param slidesDir - Directory containing slide markdown files
 * @param output - Output file path (e.g., 'presentation.cast')
 * @param options - Recording options (dimensions and timing)
 */
export async function recordAnsi(
  slidesDir: string,
  output: string,
  options: AnsiRecordOptions = {}
): Promise<void> {
  intro('term-deck record');

  // Load deck
  const deck = await loadDeck(slidesDir);

  if (deck.slides.length === 0) {
    log.error(`No slides found in ${slidesDir}`);
    process.exit(1);
  }

  // Create renderer (headless mode)
  const renderer = createRenderer(deck.config.theme);

  // Set screen dimensions if specified
  const width = options.width ?? 120;
  const height = options.height ?? 40;
  setScreenDimensions(renderer.screen, width, height);

  const slideTime = options.slideTime ?? 3;
  const frames: AsciicastFrame[] = [];
  let currentTime = 0;

  const s = spinner();
  s.start(`Recording ${deck.slides.length} slides`);

  try {
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      s.message(`Slide ${i + 1}/${deck.slides.length}: ${slide.frontmatter.title}`);

      // Render slide
      await renderSlide(renderer, slide);

      // Capture screen as ANSI string
      const content = captureScreenAsAnsi(renderer.screen);

      // Add frame with timestamp
      frames.push([currentTime, 'o', content]);
      currentTime += slideTime;
    }

    s.stop('Recording complete');

    // Write asciicast file
    const header: AsciicastHeader = {
      version: 2,
      width,
      height,
      timestamp: Math.floor(Date.now() / 1000),
      env: { TERM: 'xterm-256color' },
    };

    // Format: header on first line, then one frame per line
    const lines = [JSON.stringify(header)];
    for (const frame of frames) {
      lines.push(JSON.stringify(frame));
    }

    await writeFile(output, lines.join('\n') + '\n');

    log.success(`Recorded to ${output}`);
    outro(`Play with: asciinema play ${output}`);
  } finally {
    destroyRenderer(renderer);
  }
}
