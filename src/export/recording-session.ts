/**
 * Recording Session Management
 *
 * This module manages the lifecycle of a recording session, including
 * temporary directory creation, frame storage, and cleanup.
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ExportOptions } from './types.js';

/**
 * Recording session state
 */
export interface RecordingSession {
  tempDir: string
  frameCount: number
  width: number
  height: number
  fps: number
}

/**
 * Create a new recording session
 *
 * @param options - Export options containing dimensions and fps
 * @returns A new recording session with temporary directory
 */
export async function createRecordingSession(
  options: ExportOptions
): Promise<RecordingSession> {
  // Create temp directory for frames
  const tempDir = join(tmpdir(), `term-deck-export-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  return {
    tempDir,
    frameCount: 0,
    width: options.width ?? 120,
    height: options.height ?? 40,
    fps: options.fps ?? 30,
  };
}

/**
 * Save a PNG frame to the recording session
 *
 * @param session - Active recording session
 * @param png - PNG image data as Uint8Array
 */
export async function saveFrame(
  session: RecordingSession,
  png: Uint8Array
): Promise<void> {
  const frameNum = session.frameCount.toString().padStart(6, '0');
  const framePath = join(session.tempDir, `frame_${frameNum}.png`);

  await writeFile(framePath, png);
  session.frameCount++;
}

/**
 * Cleanup recording session by removing temporary directory
 *
 * @param session - Recording session to cleanup
 */
export async function cleanupSession(session: RecordingSession): Promise<void> {
  await rm(session.tempDir, { recursive: true, force: true });
}
