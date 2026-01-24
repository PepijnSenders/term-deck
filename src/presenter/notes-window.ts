import blessed from 'neo-blessed';
import { access } from 'fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
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
 * Creates a blessed screen on a different TTY device for displaying presenter notes.
 * Requires the TTY path to be explicitly specified.
 *
 * Usage: Open a second terminal and run `tty` to get the device path,
 * then pass it with --notes-tty /dev/ttys001
 *
 * @param ttyPath - TTY device path (e.g., '/dev/ttys001') - REQUIRED
 * @returns Promise resolving to the created notes window
 * @throws Error if ttyPath is not provided or TTY cannot be opened
 *
 * @example
 * ```typescript
 * const notesWindow = await createNotesWindow('/dev/ttys001');
 * ```
 */
export async function createNotesWindow(ttyPath?: string): Promise<NotesWindow> {
  if (!ttyPath) {
    throw new Error(getMissingTtyError());
  }

  const blessed = (await import('neo-blessed')).default;

  // Verify TTY exists
  try {
    await access(ttyPath);
  } catch {
    throw new Error(`TTY not found: ${ttyPath}\n\nMake sure the path is correct and the terminal is open.`);
  }

  // Create proper streams for the TTY
  const input = createReadStream(ttyPath);
  const output = createWriteStream(ttyPath);

  // Wait for streams to be ready
  await new Promise<void>((resolve, reject) => {
    let ready = 0;
    const checkReady = () => {
      ready++;
      if (ready === 2) resolve();
    };
    input.once('open', checkReady);
    output.once('open', checkReady);
    input.once('error', reject);
    output.once('error', reject);
  });

  const screen = blessed.screen({
    smartCSR: true,
    title: 'term-deck notes',
    fullUnicode: true,
    input: input,
    output: output,
    terminal: 'xterm-256color',
    forceUnicode: true,
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
  try {
    // Check if screen and program are properly initialized before destroying
    if (notesWindow.screen && notesWindow.screen.program) {
      notesWindow.screen.destroy();
    }
  } catch {
    // Ignore errors during cleanup
  }
}
