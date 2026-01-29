import { access } from 'fs/promises';
import { createWriteStream, type WriteStream } from 'node:fs';
import type { Slide } from '../schemas/slide.js';

/**
 * Notes window state (separate terminal)
 *
 * Uses direct TTY output instead of blessed for reliability.
 * Shows current slide notes, slide number, and preview of next slide.
 */
export interface NotesWindow {
  output: WriteStream;
  tty: string;
}

// ANSI escape codes for styling
const ANSI = {
  CLEAR: '\x1b[2J\x1b[H',      // Clear screen and move cursor to top
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  CYAN: '\x1b[36m',
  YELLOW: '\x1b[33m',
  WHITE: '\x1b[37m',
  GRAY: '\x1b[90m',
  BG_DARK: '\x1b[48;5;234m',
};

/**
 * Get error message for missing TTY
 */
function getMissingTtyError(): string {
  return (
    'The --notes flag requires --notes-tty to specify which terminal to use.\n\n' +
    'How to use presenter notes:\n' +
    '  1. Open a second terminal window\n' +
    '  2. In that terminal, run: tty\n' +
    '  3. Copy the path shown (e.g., /dev/ttys001)\n' +
    '  4. Run: term-deck present . --notes --notes-tty /dev/ttys001\n\n' +
    'The notes will appear in the second terminal while you present in the first.'
  );
}

/**
 * Create notes window on a separate TTY
 *
 * Creates a simple output stream to a different TTY for displaying presenter notes.
 * Uses direct ANSI output for maximum compatibility.
 *
 * @param ttyPath - TTY device path (e.g., '/dev/ttys001') - REQUIRED
 * @returns Promise resolving to the created notes window
 * @throws Error if ttyPath is not provided or TTY cannot be opened
 */
export async function createNotesWindow(ttyPath?: string): Promise<NotesWindow> {
  if (!ttyPath) {
    throw new Error(getMissingTtyError());
  }

  // Verify TTY exists
  try {
    await access(ttyPath);
  } catch {
    throw new Error(`TTY not found: ${ttyPath}\n\nMake sure the path is correct and the terminal is open.`);
  }

  // Create output stream for the TTY
  const output = createWriteStream(ttyPath);

  // Wait for stream to be ready
  await new Promise<void>((resolve, reject) => {
    output.once('open', () => resolve());
    output.once('error', reject);
  });

  // Clear the notes terminal and show initial message
  output.write(ANSI.CLEAR);
  output.write(`${ANSI.BG_DARK}${ANSI.GREEN}${ANSI.BOLD}term-deck notes${ANSI.RESET}\n\n`);
  output.write(`${ANSI.GRAY}Waiting for presentation to start...${ANSI.RESET}\n`);

  return {
    output,
    tty: ttyPath,
  };
}

/**
 * Update notes window content for current slide
 *
 * Updates the notes window to display:
 * - Current slide number and title
 * - Presenter notes (or "No notes" if none exist)
 * - Preview of next slide title (or "Last slide" if at end)
 *
 * @param notesWindow - The notes window to update
 * @param currentSlide - The current slide being displayed
 * @param nextSlide - The next slide (if any)
 * @param currentIndex - Current slide index (0-based)
 * @param totalSlides - Total number of slides in the deck
 */
export function updateNotesWindow(
  notesWindow: NotesWindow,
  currentSlide: Slide,
  nextSlide: Slide | undefined,
  currentIndex: number,
  totalSlides: number
): void {
  const { output } = notesWindow;
  const divider = '─'.repeat(50);

  // Clear screen and move cursor to top
  output.write(ANSI.CLEAR);

  // Header
  output.write(`${ANSI.GREEN}${ANSI.BOLD}term-deck notes${ANSI.RESET}\n\n`);
  output.write(`${ANSI.CYAN}${ANSI.BOLD}Slide ${currentIndex + 1} of ${totalSlides}${ANSI.RESET}\n`);
  output.write(`${ANSI.GRAY}${currentSlide.frontmatter.title}${ANSI.RESET}\n`);
  output.write('\n');
  output.write(`${ANSI.GRAY}${divider}${ANSI.RESET}\n`);
  output.write('\n');

  // Notes
  if (currentSlide.notes) {
    output.write(`${ANSI.YELLOW}${ANSI.BOLD}PRESENTER NOTES:${ANSI.RESET}\n\n`);
    output.write(`${ANSI.WHITE}${currentSlide.notes}${ANSI.RESET}\n`);
  } else {
    output.write(`${ANSI.GRAY}No notes for this slide${ANSI.RESET}\n`);
  }

  output.write('\n');
  output.write(`${ANSI.GRAY}${divider}${ANSI.RESET}\n`);
  output.write('\n');

  // Next slide preview
  if (nextSlide) {
    output.write(`${ANSI.CYAN}${ANSI.BOLD}NEXT:${ANSI.RESET} ${ANSI.WHITE}"${nextSlide.frontmatter.title}"${ANSI.RESET}\n`);
  } else {
    output.write(`${ANSI.GRAY}Last slide${ANSI.RESET}\n`);
  }
}

/**
 * Destroy notes window and free resources
 *
 * @param notesWindow - The notes window to destroy
 */
export function destroyNotesWindow(notesWindow: NotesWindow): void {
  try {
    // Clear the notes terminal
    notesWindow.output.write(ANSI.CLEAR);
    notesWindow.output.write(`${ANSI.GRAY}Presentation ended.${ANSI.RESET}\n`);
    notesWindow.output.end();
  } catch {
    // Ignore errors during cleanup
  }
}
