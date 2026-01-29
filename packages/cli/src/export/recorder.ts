/**
 * Export API
 *
 * This module provides a unified public API for exporting presentations
 * to various formats (video, GIF, asciicast). It re-exports functionality
 * from focused sub-modules.
 *
 * For video/GIF export:
 * @see {presentation-exporter}
 *
 * For ANSI/asciicast export:
 * @see {ansi-recorder}
 *
 * For session management:
 * @see {recording-session}
 */

// Type definitions
export type {
  ExportOptions,
  ExportFormat,
  AsciicastHeader,
  AsciicastFrame,
} from './types.js';

// Recording session management
export type { RecordingSession } from './recording-session.js';
export {
  createRecordingSession,
  saveFrame,
  cleanupSession,
} from './recording-session.js';

// Video/GIF export
export { exportPresentation } from './presentation-exporter.js';

// ANSI recording
export type { AnsiRecordOptions } from './ansi-recorder.js';
export { recordAnsi } from './ansi-recorder.js';

// FFmpeg utilities (re-exported for convenience)
export { checkFfmpeg, detectFormat } from './encoding/ffmpeg-encoder.js';
