import blessed from 'neo-blessed';
import { access } from 'fs/promises';
import type { Slide } from '../schemas/slide.js';

/**
 * Notes window state (separate terminal)
 *
 * Represents a secondary display on a different TTY for presenter notes.
 * Shows current slide notes, slide number, and preview of next slide.
 */
export interface NotesWindow {
  screen: blessed.Widgets.Screen;
  contentBox: blessed.Widgets.BoxElement;
  tty: string; // TTY device path (e.g., '/dev/tty2')
}

/**
 * Find an available TTY for notes window
 *
 * This is a best-effort approach - user should specify with --notes-tty.
 * Searches common TTY paths on macOS and Linux.
 *
 * @returns Promise resolving to an available TTY path
 * @throws Error if no available TTY is found
 */
async function findAvailableTty(): Promise<string> {
  const candidates = [
    '/dev/ttys001',
    '/dev/ttys002',
    '/dev/ttys003',
    '/dev/pts/1',
    '/dev/pts/2',
  ];

  for (const tty of candidates) {
    try {
      await access(tty);
      return tty;
    } catch {
      // Continue to next candidate
    }
  }

  throw new Error(
    'Could not find available TTY for notes window. ' +
    'Open a second terminal, run `tty`, and pass the path with --notes-tty'
  );
}

/**
 * Create notes window on a separate TTY
 *
 * Creates a blessed screen on a different TTY device for displaying presenter notes.
 * If no TTY is specified, attempts to find one automatically.
 *
 * Usage: Open a second terminal and run `tty` to get the device path,
 * then pass it with --notes-tty /dev/ttys001
 *
 * @param ttyPath - Optional TTY device path (e.g., '/dev/ttys001')
 * @returns Promise resolving to the created notes window
 *
 * @example
 * ```typescript
 * // With explicit TTY path
 * const notesWindow = await createNotesWindow('/dev/ttys001');
 *
 * // Auto-detect TTY
 * const notesWindow = await createNotesWindow();
 * ```
 */
export async function createNotesWindow(ttyPath?: string): Promise<NotesWindow> {
  const blessed = (await import('neo-blessed')).default;
  const { openSync } = await import('node:fs');

  const tty = ttyPath ?? await findAvailableTty();

  const screen = blessed.screen({
    smartCSR: true,
    title: 'term-deck notes',
    fullUnicode: true,
    input: openSync(tty, 'r'),
    output: openSync(tty, 'w'),
  });

  const contentBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    tags: true,
    padding: 2,
    style: {
      fg: '#ffffff',
      bg: '#1a1a1a',
    },
  });

  screen.append(contentBox);
  screen.render();

  return {
    screen,
    contentBox,
    tty,
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
  const { contentBox, screen } = notesWindow;

  let content = '';

  // Header
  content += `{bold}Slide ${currentIndex + 1} of ${totalSlides}{/bold}\n`;
  content += `{gray-fg}${currentSlide.frontmatter.title}{/}\n`;
  content += '\n';
  content += '─'.repeat(50) + '\n';
  content += '\n';

  // Notes
  if (currentSlide.notes) {
    content += '{bold}PRESENTER NOTES:{/bold}\n\n';
    content += currentSlide.notes + '\n';
  } else {
    content += '{gray-fg}No notes for this slide{/}\n';
  }

  content += '\n';
  content += '─'.repeat(50) + '\n';
  content += '\n';

  // Next slide preview
  if (nextSlide) {
    content += `{bold}NEXT:{/bold} "${nextSlide.frontmatter.title}"\n`;
  } else {
    content += '{gray-fg}Last slide{/}\n';
  }

  contentBox.setContent(content);
  screen.render();
}

/**
 * Toggle notes window visibility
 *
 * Toggles the visibility of the notes window between shown and hidden.
 *
 * @param notesWindow - The notes window to toggle
 */
export function toggleNotesVisibility(notesWindow: NotesWindow): void {
  const { contentBox, screen } = notesWindow;
  contentBox.toggle();
  screen.render();
}

/**
 * Destroy notes window and free resources
 *
 * @param notesWindow - The notes window to destroy
 */
export function destroyNotesWindow(notesWindow: NotesWindow): void {
  notesWindow.screen.destroy();
}
