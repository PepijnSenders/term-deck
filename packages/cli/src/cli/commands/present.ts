/**
 * Present Command
 *
 * Starts a presentation with the given options.
 */

import { Command } from 'commander';
import { present } from '../../presenter/main.js';
import { handleError } from '../errors.js';

export const presentCommand = new Command('present')
  .description('Start a presentation')
  .argument('<dir>', 'Slides directory')
  .option('-s, --start <n>', 'Start at slide number', '0')
  .option('-n, --notes', 'Show presenter notes in separate terminal')
  .option('--notes-tty <path>', 'TTY device for notes window (e.g., /dev/ttys001)')
  .option('-l, --loop', 'Loop back to first slide after last')
  .action(async (dir, options) => {
    try {
      await present(dir, {
        startSlide: Number.parseInt(options.start, 10),
        showNotes: options.notes,
        notesTty: options.notesTty,
        loop: options.loop,
      });
    } catch (error) {
      handleError(error);
    }
  });
