/**
 * Presentation Video Exporter
 *
 * This module handles exporting presentations to video (MP4) or GIF formats.
 * It orchestrates the rendering, frame capture, and video encoding process.
 */

import { join } from 'path';
import { loadDeck } from '../core/deck-loader.js';
import { createRenderer, destroyRenderer, renderSlide } from '../renderer/screen.js';
import { setScreenDimensions } from '../renderer/types/screen.js';
import { VirtualTerminal } from './utils/virtual-terminal.js';
import { captureScreen } from './capture/screen-capture.js';
import { checkFfmpeg, detectFormat, encodeVideo } from './encoding/ffmpeg-encoder.js';
import { createRecordingSession, saveFrame, cleanupSession } from './recording-session.js';
import type { ExportOptions, ExportFormat } from './types.js';

/**
 * Encode recorded frames to video using ffmpeg
 *
 * @param tempDir - Directory containing frame images
 * @param output - Output file path
 * @param format - Export format (mp4 or gif)
 * @param fps - Frames per second
 * @param quality - Video quality (1-100)
 */
async function encodeFramesToVideo(
  tempDir: string,
  output: string,
  format: ExportFormat,
  fps: number,
  quality?: number
): Promise<void> {
  const inputPattern = join(tempDir, 'frame_%06d.png');

  await encodeVideo({
    inputPattern,
    output,
    format,
    fps,
    quality
  });
}

/**
 * Export a presentation to video or GIF format
 *
 * @param slidesDir - Directory containing slide markdown files
 * @param options - Export options (output path, dimensions, fps, etc.)
 */
export async function exportPresentation(
  slidesDir: string,
  options: ExportOptions
): Promise<void> {
  // Check ffmpeg is available
  await checkFfmpeg();

  // Detect format from output extension
  const format = detectFormat(options.output);

  // Load deck
  const deck = await loadDeck(slidesDir);

  if (deck.slides.length === 0) {
    throw new Error(`No slides found in ${slidesDir}`);
  }

  // Create recording session
  const session = await createRecordingSession(options);

  // Create virtual terminal for rendering
  const vt = new VirtualTerminal(session.width, session.height);

  // Create renderer (headless mode)
  const renderer = createRenderer(deck.config.theme);

  // Set screen dimensions for export
  setScreenDimensions(renderer.screen, session.width, session.height);

  const slideTime = options.slideTime ?? 3; // seconds per slide
  const framesPerSlide = session.fps * slideTime;

  console.log(`Exporting ${deck.slides.length} slides...`);

  try {
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      console.log(`  Slide ${i + 1}/${deck.slides.length}: ${slide.frontmatter.title}`);

      // Render slide
      await renderSlide(renderer, slide);

      // Capture frames for this slide
      for (let f = 0; f < framesPerSlide; f++) {
        // Update screen (needed for animations like matrix rain)
        renderer.screen.render();

        // Capture to virtual terminal
        captureScreen(renderer.screen, vt);

        // Save frame as PNG
        const png = await vt.toPng();
        await saveFrame(session, png);
      }
    }

    // Encode video
    console.log('Encoding video...');
    await encodeFramesToVideo(
      session.tempDir,
      options.output,
      format,
      session.fps,
      options.quality
    );

    console.log(`Exported to ${options.output}`);
  } finally {
    // Cleanup
    destroyRenderer(renderer);
    await cleanupSession(session);
  }
}
