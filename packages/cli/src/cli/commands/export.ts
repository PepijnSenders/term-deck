/**
 * Export Command
 *
 * Exports a presentation to GIF or MP4 format.
 */

import { Command } from 'commander';
import { exportPresentation } from '../../export/recorder.js';
import { handleError } from '../errors.js';

export const exportCommand = new Command('export')
  .description('Export presentation to GIF or MP4')
  .argument('<dir>', 'Slides directory')
  .requiredOption('-o, --output <file>', 'Output file (.mp4 or .gif)')
  .option('-w, --width <n>', 'Terminal width in characters', '120')
  .option('-h, --height <n>', 'Terminal height in characters', '40')
  .option('--fps <n>', 'Frames per second', '30')
  .option('-t, --slide-time <n>', 'Seconds per slide', '3')
  .option('-q, --quality <n>', 'Quality 1-100 (video only)', '80')
  .action(async (dir, options) => {
    try {
      await exportPresentation(dir, {
        output: options.output,
        width: Number.parseInt(options.width, 10),
        height: Number.parseInt(options.height, 10),
        fps: Number.parseInt(options.fps, 10),
        slideTime: Number.parseFloat(options.slideTime),
        quality: Number.parseInt(options.quality, 10),
      });
    } catch (error) {
      handleError(error);
    }
  });
