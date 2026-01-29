/**
 * Tests for CLI error handling
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError } from '../errors.js';
import { ValidationError } from '../../schemas/validation.js';
import { SlideParseError } from '../../core/slide.js';
import { DeckLoadError } from '../../core/deck-loader.js';
import { ThemeError } from '../../core/theme.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  log: {
    error: vi.fn(),
    message: vi.fn(),
    info: vi.fn(),
  },
  cancel: vi.fn(),
}));

import { log } from '@clack/prompts';

describe('handleError', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(
      (() => {}) as never,
    );
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    originalDebug = process.env.DEBUG;
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.DEBUG = originalDebug;
  });

  test('handles ValidationError', () => {
    const error = new ValidationError('Invalid theme configuration');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Invalid theme configuration');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles SlideParseError', () => {
    const cause = new Error('Missing title field');
    const error = new SlideParseError('Invalid frontmatter', 'slides/01.md', cause);

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Slide error in slides/01.md');
    expect(log.message).toHaveBeenCalledWith('  Invalid frontmatter');
    expect(log.message).toHaveBeenCalledWith('  → Missing title field');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles SlideParseError without cause', () => {
    const error = new SlideParseError('Invalid frontmatter', 'slides/02.md');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Slide error in slides/02.md');
    expect(log.message).toHaveBeenCalledWith('  Invalid frontmatter');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles DeckLoadError', () => {
    const error = new DeckLoadError('No slides found', './slides');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Failed to load deck from ./slides');
    expect(log.message).toHaveBeenCalledWith('  No slides found');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ThemeError', () => {
    const error = new ThemeError('Invalid color format', 'custom-theme');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Theme error');
    expect(log.message).toHaveBeenCalledWith('  Invalid color format');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ENOENT errors', () => {
    const error = new Error('ENOENT: no such file or directory');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('File not found');
    expect(log.message).toHaveBeenCalledWith('  ENOENT: no such file or directory');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ffmpeg errors', () => {
    const error = new Error('ffmpeg not found in PATH');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('ffmpeg not found');
    expect(log.message).toHaveBeenCalledWith('  ffmpeg not found in PATH');
    expect(log.info).toHaveBeenCalledWith('Installation:');
    expect(log.message).toHaveBeenCalledWith('  macOS:  brew install ffmpeg');
    expect(log.message).toHaveBeenCalledWith('  Ubuntu: sudo apt install ffmpeg');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles generic errors', () => {
    const error = new Error('Something went wrong');

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Something went wrong');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('shows stack trace when DEBUG is set', () => {
    process.env.DEBUG = '1';
    const error = new Error('Debug error');
    error.stack = 'Error: Debug error\n  at test.ts:10:20';

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('at test.ts'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('hides stack trace when DEBUG is not set', () => {
    delete process.env.DEBUG;
    const error = new Error('Regular error');
    error.stack = 'Error: Regular error\n  at test.ts:10:20';

    handleError(error);

    // Should show error message via log.error
    expect(log.error).toHaveBeenCalledWith('Regular error');

    // Should NOT show stack trace
    const calls = consoleErrorSpy.mock.calls;
    const hasStackTrace = calls.some((call) =>
      call.some((arg) => String(arg).includes('at test.ts')),
    );
    expect(hasStackTrace).toBe(false);

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles unknown errors', () => {
    const error = 'string error';

    handleError(error);

    expect(log.error).toHaveBeenCalledWith('Unknown error occurred');
    expect(consoleErrorSpy).toHaveBeenCalledWith('string error');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('exits with code 1 for all errors', () => {
    const errors = [
      new ValidationError('test'),
      new SlideParseError('test', 'test.md'),
      new DeckLoadError('test', './slides'),
      new ThemeError('test', 'theme'),
      new Error('ENOENT'),
      new Error('ffmpeg'),
      new Error('generic'),
      'unknown',
    ];

    for (const error of errors) {
      processExitSpy.mockClear();
      handleError(error);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    }
  });
});
