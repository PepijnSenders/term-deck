/**
 * CLI Error Handling
 *
 * Provides user-friendly error messages for various error types
 * that can occur during CLI operations.
 */

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
export function handleError(error: unknown): never {
  if (error instanceof ValidationError) {
    console.error(`\n${error.message}`);
    process.exit(1);
  }

  if (error instanceof SlideParseError) {
    console.error(`\nSlide error in ${error.filePath}:`);
    console.error(`  ${error.message}`);
    if (error.cause) {
      const causeMessage = error.cause instanceof Error ? error.cause.message : String(error.cause);
      console.error(`  Caused by: ${causeMessage}`);
    }
    process.exit(1);
  }

  if (error instanceof DeckLoadError) {
    console.error(`\nFailed to load deck from ${error.slidesDir}:`);
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  if (error instanceof ThemeError) {
    console.error('\nTheme error:');
    console.error(`  ${error.message}`);
    process.exit(1);
  }

  if (error instanceof Error) {
    // Check for common issues
    if (error.message.includes('ENOENT')) {
      console.error('\nFile or directory not found.');
      console.error(`  ${error.message}`);
      process.exit(1);
    }

    if (error.message.includes('ffmpeg')) {
      console.error('\nffmpeg error:');
      console.error(`  ${error.message}`);
      console.error('\nMake sure ffmpeg is installed:');
      console.error('  macOS: brew install ffmpeg');
      console.error('  Ubuntu: sudo apt install ffmpeg');
      process.exit(1);
    }

    // Generic error
    console.error(`\nError: ${error.message}`);

    if (process.env.DEBUG) {
      console.error(error.stack);
    }

    process.exit(1);
  }

  // Unknown error
  console.error('\nUnknown error occurred');
  console.error(error);
  process.exit(1);
}
