import blessed from '../compat/blessed-loader.js';
import type { Deck } from '../core/slide.js';
import type { Renderer } from '../renderer/screen.js';
import { loadDeck } from '../core/slide.js';
import { createRenderer, destroyRenderer, renderSlide, clearWindows } from '../renderer/screen.js';

/**
 * Presenter state
 *
 * Manages the state of the active presentation including:
 * - The loaded deck with slides and configuration
 * - The renderer instance for displaying slides
 * - Current slide index
 * - Animation state to prevent concurrent navigation
 * - Optional notes window for presenter mode
 * - Optional auto-advance timer
 * - Optional progress bar
 */
export interface Presenter {
  deck: Deck;
  renderer: Renderer;
  currentSlide: number;
  isAnimating: boolean;
  notesWindow: NotesWindow | null;
  autoAdvanceTimer: NodeJS.Timer | null;
  progressBar: blessed.Widgets.ProgressBarElement | null;
}

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
 * Presentation options
 *
 * Configuration options for starting a presentation:
 * - startSlide: Index of slide to start from (defaults to 0)
 * - showNotes: Whether to open a notes window on separate TTY
 * - notesTty: Specific TTY device path for notes (optional, will auto-detect if not provided)
 * - loop: Whether to loop back to first slide after reaching the end
 */
export interface PresentOptions {
  startSlide?: number;
  showNotes?: boolean;
  notesTty?: string;
  loop?: boolean;
}

/**
 * Start a presentation
 *
 * Loads the deck, creates the renderer, sets up keyboard controls,
 * and enters the main presentation loop.
 *
 * @param slidesDir - Directory containing markdown slides and deck.config.ts
 * @param options - Presentation options (startSlide, showNotes, notesTty, loop)
 * @returns Promise that resolves when the presentation ends (user quits)
 *
 * @example
 * ```typescript
 * await present('./slides', { startSlide: 0, showNotes: true });
 * ```
 */
export async function present(
  slidesDir: string,
  options: PresentOptions = {}
): Promise<void> {
  // Load deck
  const deck = await loadDeck(slidesDir);

  if (deck.slides.length === 0) {
    throw new Error(`No slides found in ${slidesDir}`);
  }

  // Create renderer
  const renderer = createRenderer(deck.config.theme);

  // Create presenter state
  const presenter: Presenter = {
    deck,
    renderer,
    currentSlide: options.startSlide ?? deck.config.settings?.startSlide ?? 0,
    isAnimating: false,
    notesWindow: null,
    autoAdvanceTimer: null,
    progressBar: null,
  };

  // Setup notes window if requested
  if (options.showNotes) {
    presenter.notesWindow = await createNotesWindow(options.notesTty);
  }

  // Setup progress bar if enabled
  if (deck.config.settings?.showProgress) {
    presenter.progressBar = createProgressBar(presenter);
  }

  // Setup keyboard controls
  setupControls(presenter);

  // Show first slide
  await showSlide(presenter, presenter.currentSlide);

  // Update progress bar
  if (presenter.progressBar) {
    updateProgress(presenter.progressBar, presenter.currentSlide, deck.slides.length);
  }

  // Start auto-advance if configured
  presenter.autoAdvanceTimer = startAutoAdvance(presenter);

  // Keep process alive until quit
  await new Promise<void>((resolve) => {
    renderer.screen.key(['q', 'C-c', 'escape'], () => {
      cleanup(presenter);
      resolve();
    });
  });
}

/**
 * Cleanup resources
 *
 * Destroys the notes window (if present), stops auto-advance timer,
 * and destroys the main renderer, freeing all resources and restoring the terminal.
 *
 * @param presenter - The presenter state to clean up
 */
function cleanup(presenter: Presenter): void {
  stopAutoAdvance(presenter.autoAdvanceTimer);
  if (presenter.notesWindow) {
    presenter.notesWindow.screen.destroy();
  }
  destroyRenderer(presenter.renderer);
}

/**
 * Show a specific slide (placeholder for task 5.4)
 */
async function showSlide(presenter: Presenter, index: number): Promise<void> {
  if (presenter.isAnimating) return;
  if (index < 0 || index >= presenter.deck.slides.length) return;

  presenter.isAnimating = true;
  presenter.currentSlide = index;

  const slide = presenter.deck.slides[index];

  // Render slide
  await renderSlide(presenter.renderer, slide);
  presenter.renderer.screen.render();

  // Update notes window
  if (presenter.notesWindow) {
    updateNotesWindow(presenter);
  }

  // Update progress bar
  if (presenter.progressBar) {
    updateProgress(presenter.progressBar, presenter.currentSlide, presenter.deck.slides.length);
  }

  presenter.isAnimating = false;
}

/**
 * Go to next slide
 *
 * Advances to the next slide in the deck. If at the last slide:
 * - If loop is enabled, wraps to first slide
 * - If loop is disabled, stays on last slide
 *
 * @param presenter - The presenter state
 */
export async function nextSlide(presenter: Presenter): Promise<void> {
  const nextIndex = presenter.currentSlide + 1;
  const { slides } = presenter.deck;
  const loop = presenter.deck.config.settings?.loop ?? false;

  if (nextIndex >= slides.length) {
    if (loop) {
      await showSlide(presenter, 0);
    }
    return;
  }

  await showSlide(presenter, nextIndex);
}

/**
 * Go to previous slide
 *
 * Goes back to the previous slide in the deck. If at the first slide:
 * - If loop is enabled, wraps to last slide
 * - If loop is disabled, stays on first slide
 *
 * To maintain the stacked window effect, this function clears all windows
 * and re-renders all slides from 0 up to the target slide.
 *
 * @param presenter - The presenter state
 */
export async function prevSlide(presenter: Presenter): Promise<void> {
  const prevIndex = presenter.currentSlide - 1;
  const { slides } = presenter.deck;
  const loop = presenter.deck.config.settings?.loop ?? false;

  if (prevIndex < 0) {
    if (loop) {
      // Clear and re-render all slides up to the last one
      clearWindows(presenter.renderer);
      for (let i = 0; i < slides.length; i++) {
        await renderSlide(presenter.renderer, slides[i]);
      }
      presenter.currentSlide = slides.length - 1;

      // Update notes window
      if (presenter.notesWindow) {
        updateNotesWindow(presenter);
      }

      // Update progress bar
      if (presenter.progressBar) {
        updateProgress(presenter.progressBar, presenter.currentSlide, presenter.deck.slides.length);
      }

      presenter.renderer.screen.render();
    }
    // If not looping, stay at current slide (index 0)
    return;
  }

  // Clear windows and re-render from start up to prevIndex
  clearWindows(presenter.renderer);
  for (let i = 0; i <= prevIndex; i++) {
    await renderSlide(presenter.renderer, slides[i]);
  }

  presenter.currentSlide = prevIndex;

  // Update notes window
  if (presenter.notesWindow) {
    updateNotesWindow(presenter);
  }

  // Update progress bar
  if (presenter.progressBar) {
    updateProgress(presenter.progressBar, presenter.currentSlide, presenter.deck.slides.length);
  }

  // Render screen to display changes
  presenter.renderer.screen.render();
}

/**
 * Jump to a specific slide by index
 *
 * Jumps directly to the specified slide index. To maintain the stacked window
 * effect, this function clears all windows and re-renders all slides from 0
 * up to the target slide.
 *
 * Invalid indices (negative or beyond deck length) are ignored.
 *
 * @param presenter - The presenter state
 * @param index - The slide index to jump to (0-based)
 */
export async function jumpToSlide(presenter: Presenter, index: number): Promise<void> {
  // Check bounds - ignore invalid indices
  if (index < 0 || index >= presenter.deck.slides.length) return;

  // Clear all windows to prepare for re-rendering
  clearWindows(presenter.renderer);

  // Re-render slides 0 through target index to preserve stacking
  for (let i = 0; i <= index; i++) {
    await renderSlide(presenter.renderer, presenter.deck.slides[i]);
  }

  // Update current slide
  presenter.currentSlide = index;

  // Update notes window if present
  if (presenter.notesWindow) {
    updateNotesWindow(presenter);
  }

  // Update progress bar
  if (presenter.progressBar) {
    updateProgress(presenter.progressBar, presenter.currentSlide, presenter.deck.slides.length);
  }

  // Render screen to display changes
  presenter.renderer.screen.render();
}

/**
 * Setup keyboard event handlers
 *
 * Registers all keyboard controls for the presentation:
 * - Next slide: Space, Enter, Right, n
 * - Previous slide: Left, Backspace, p
 * - Jump to slide: 0-9
 * - Show slide list: l
 * - Toggle notes visibility: N
 * - Quit: q, Ctrl+C, Escape (handled in present() function)
 *
 * @param presenter - The presenter state
 */
function setupControls(presenter: Presenter): void {
  const { screen } = presenter.renderer;

  // Next slide: Space, Enter, Right, n
  screen.key(['space', 'enter', 'right', 'n'], () => {
    nextSlide(presenter);
  });

  // Previous slide: Left, Backspace, p
  screen.key(['left', 'backspace', 'p'], () => {
    prevSlide(presenter);
  });

  // Jump to slide: 0-9
  screen.key(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], (ch) => {
    const index = parseInt(ch, 10);
    jumpToSlide(presenter, index);
  });

  // Show slide list: l
  screen.key(['l'], () => {
    showSlideList(presenter);
  });

  // Toggle notes visibility: N (only if notes window exists)
  screen.key(['N'], () => {
    if (presenter.notesWindow) {
      toggleNotesVisibility(presenter.notesWindow);
    }
  });

  // Note: quit keys (q, Ctrl+C, Escape) are handled in the present() function
}

/**
 * Show slide list overlay
 *
 * Displays an overlay showing all slides in the deck with the current slide marked.
 * User can press Escape, l, or q to close, or press a number key to jump to that slide.
 *
 * @param presenter - The presenter state
 */
function showSlideList(presenter: Presenter): void {
  const { screen } = presenter.renderer;
  const { slides } = presenter.deck;

  // Build list content with current slide marker
  const listContent = slides
    .map((slide, i) => {
      const marker = i === presenter.currentSlide ? '▶ ' : '  ';
      return `${marker}${i}: ${slide.frontmatter.title}`;
    })
    .join('\n');

  // Create overlay box centered on screen
  const listBox = screen.box({
    top: 'center',
    left: 'center',
    width: 50,
    height: Math.min(slides.length + 4, 20),
    border: { type: 'line' },
    label: ' SLIDES (press number or Esc) ',
    style: {
      fg: '#ffffff',
      bg: '#0a0a0a',
      border: { fg: '#ffcc00' },
    },
    padding: 1,
    tags: true,
    content: listContent,
  });

  screen.append(listBox);

  screen.render();

  // Close list helper
  const closeList = () => {
    listBox.destroy();
    screen.render();
  };

  // Close on Escape, l, or q
  screen.onceKey(['escape', 'l', 'q'], closeList);

  // Number keys jump to slide and close
  screen.onceKey(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], (ch) => {
    closeList();
    jumpToSlide(presenter, parseInt(ch ?? '0', 10));
  });
}

/**
 * Toggle notes window visibility
 *
 * Toggles the visibility of the notes window between shown and hidden.
 *
 * @param notesWindow - The notes window to toggle
 */
function toggleNotesVisibility(notesWindow: NotesWindow): void {
  const { contentBox, screen } = notesWindow;
  contentBox.toggle();
  screen.render();
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
  // On macOS, try common TTY paths
  const candidates = [
    '/dev/ttys001',
    '/dev/ttys002',
    '/dev/ttys003',
    '/dev/pts/1',
    '/dev/pts/2',
  ];

  for (const tty of candidates) {
    try {
      const file = Bun.file(tty);
      if (await file.exists()) {
        return tty;
      }
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
async function createNotesWindow(ttyPath?: string): Promise<NotesWindow> {
  const blessed = (await import('../compat/blessed-loader.js')).default;
  const { openSync } = await import('node:fs');

  // If no TTY specified, try to find one
  const tty = ttyPath ?? await findAvailableTty();

  // Create screen on the specified TTY
  const screen = blessed.screen({
    smartCSR: true,
    title: 'term-deck notes',
    fullUnicode: true,
    input: openSync(tty, 'r'),
    output: openSync(tty, 'w'),
  });

  // Create content box
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
 * @param presenter - The presenter state
 */
function updateNotesWindow(presenter: Presenter): void {
  if (!presenter.notesWindow) return;

  const { contentBox, screen } = presenter.notesWindow;
  const { slides } = presenter.deck;
  const currentIndex = presenter.currentSlide;
  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1];

  // Build notes content
  let content = '';

  // Header
  content += `{bold}Slide ${currentIndex + 1} of ${slides.length}{/bold}\n`;
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
 * Start auto-advance timer
 *
 * Automatically advances to the next slide at a specified interval.
 * Respects the isAnimating flag to avoid advancing during animations.
 * Returns null if auto-advance is disabled (interval <= 0).
 *
 * @param presenter - The presenter state
 * @returns Timer object if auto-advance is enabled, null otherwise
 */
function startAutoAdvance(presenter: Presenter): NodeJS.Timer | null {
  const interval = presenter.deck.config.settings?.autoAdvance;

  // Auto-advance disabled if interval is undefined, 0, or negative
  if (!interval || interval <= 0) {
    return null;
  }

  // Start interval timer
  return setInterval(() => {
    // Only advance if not currently animating
    if (!presenter.isAnimating) {
      nextSlide(presenter);
    }
  }, interval);
}

/**
 * Stop auto-advance timer
 *
 * Clears the auto-advance interval timer if it exists.
 *
 * @param timer - The timer to stop (can be null)
 */
function stopAutoAdvance(timer: NodeJS.Timer | null): void {
  if (timer) {
    clearInterval(timer);
  }
}

/**
 * Create progress bar at bottom of screen
 *
 * Creates a horizontal progress bar that shows presentation progress.
 * The bar is positioned at the bottom of the screen and fills from left
 * to right as the presentation advances.
 *
 * @param presenter - The presenter state
 * @returns Progress bar element
 */
function createProgressBar(presenter: Presenter): blessed.Widgets.ProgressBarElement {
  const { screen } = presenter.renderer;

  const progressBar = blessed.progressbar({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      bg: '#333333',
      bar: { bg: '#00cc66' },
    },
    filled: 0,
  });

  screen.append(progressBar);

  return progressBar;
}

/**
 * Update progress bar
 *
 * Updates the progress bar to reflect the current slide position.
 * Progress is calculated as (current + 1) / total * 100.
 *
 * @param progressBar - The progress bar element to update
 * @param current - Current slide index (0-based)
 * @param total - Total number of slides
 */
function updateProgress(
  progressBar: blessed.Widgets.ProgressBarElement,
  current: number,
  total: number
): void {
  const progress = ((current + 1) / total) * 100;
  progressBar.setProgress(progress);
}
