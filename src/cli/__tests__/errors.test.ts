/**
 * Tests for CLI error handling
 */

import { describe, test, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';
import { handleError } from '../errors.js';
import { ValidationError } from '../../schemas/validation.js';
import { SlideParseError, DeckLoadError } from '../../core/slide.js';
import { ThemeError } from '../../core/theme.js';

describe('handleError', () => {
  let consoleErrorSpy: ReturnType<typeof spyOn>;
  let processExitSpy: ReturnType<typeof spyOn>;
  let originalDebug: string | undefined;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = spyOn(process, 'exit').mockImplementation(
      (() => {}) as never,
    );
    originalDebug = process.env.DEBUG;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    process.env.DEBUG = originalDebug;
  });

  test('handles ValidationError', () => {
    const error = new ValidationError('Invalid theme configuration');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid theme configuration'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles SlideParseError', () => {
    const cause = new Error('Missing title field');
    const error = new SlideParseError('Invalid frontmatter', 'slides/01.md', cause);

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('slides/01.md'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid frontmatter'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing title field'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles SlideParseError without cause', () => {
    const error = new SlideParseError('Invalid frontmatter', 'slides/02.md');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('slides/02.md'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles DeckLoadError', () => {
    const error = new DeckLoadError('No slides found', './slides');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('./slides'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No slides found'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ThemeError', () => {
    const error = new ThemeError('Invalid color format', 'custom-theme');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Theme error'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid color format'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ENOENT errors', () => {
    const error = new Error('ENOENT: no such file or directory');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('File or directory not found'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ffmpeg errors', () => {
    const error = new Error('ffmpeg not found in PATH');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('ffmpeg error'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Make sure ffmpeg is installed'),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('brew install ffmpeg'),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  test('handles generic errors', () => {
    const error = new Error('Something went wrong');

    handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Something went wrong'),
    );
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

    // Should show error message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Regular error'),
    );

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

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
    );
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
