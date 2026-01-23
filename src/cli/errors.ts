/**
 * CLI Error Handling
 *
 * Provides user-friendly error messages for various error types
 * that can occur during CLI operations.
 */

import { log, cancel } from '@clack/prompts';
import { ValidationError } from '../schemas/validation.js';
import { SlideParseError } from '../core/slide.js';
import { DeckLoadError } from '../core/deck-loader.js';
import { ThemeError } from '../core/theme.js';

/**
 * Handle CLI errors with user-friendly messages
 *
 * Converts various error types into readable console output
 * and exits with appropriate status code.
 */
export function handleError(errorObj: unknown): never {
  if (errorObj instanceof ValidationError) {
    log.error(errorObj.message);
    process.exit(1);
  }

  if (errorObj instanceof SlideParseError) {
    log.error(`Slide error in ${errorObj.filePath}`);
    log.message(`  ${errorObj.message}`);
    if (errorObj.cause) {
      const causeMessage = errorObj.cause instanceof Error
        ? errorObj.cause.message
        : String(errorObj.cause);
      log.message(`  → ${causeMessage}`);
    }
    process.exit(1);
  }

  if (errorObj instanceof DeckLoadError) {
    log.error(`Failed to load deck from ${errorObj.slidesDir}`);
    log.message(`  ${errorObj.message}`);
    process.exit(1);
  }

  if (errorObj instanceof ThemeError) {
    log.error('Theme error');
    log.message(`  ${errorObj.message}`);
    process.exit(1);
  }

  if (errorObj instanceof Error) {
    if (errorObj.message.includes('ENOENT')) {
      log.error('File not found');
      log.message(`  ${errorObj.message}`);
      process.exit(1);
    }

    if (errorObj.message.includes('ffmpeg')) {
      log.error('ffmpeg not found');
      log.message(`  ${errorObj.message}`);
      log.info('Installation:');
      log.message('  macOS:  brew install ffmpeg');
      log.message('  Ubuntu: sudo apt install ffmpeg');
      process.exit(1);
    }

    log.error(errorObj.message);
    if (process.env.DEBUG) {
      console.error('\n' + errorObj.stack);
    }
    process.exit(1);
  }

  log.error('Unknown error occurred');
  console.error(String(errorObj));
  process.exit(1);
}
