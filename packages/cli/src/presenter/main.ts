import blessed from 'neo-blessed';
import { loadDeck } from '../core/deck-loader.js';
import { createRenderer, destroyRenderer } from '../renderer/screen.js';
import { createNotesWindow, destroyNotesWindow } from './notes-window.js';
import { setupControls } from './keyboard-controls.js';
import { showSlide, nextSlide, updateProgress } from './navigation.js';
import type { Presenter, PresentOptions } from './types.js';

export type { Presenter, PresentOptions };

// Re-export navigation functions for backwards compatibility
export { jumpToSlide, prevSlide } from './navigation.js';

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
    try {
      presenter.notesWindow = await createNotesWindow(options.notesTty);
    } catch (error) {
      // Clean up renderer before throwing
      destroyRenderer(renderer);
      throw error;
    }
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
    destroyNotesWindow(presenter.notesWindow);
  }
  destroyRenderer(presenter.renderer);
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
function startAutoAdvance(presenter: Presenter): ReturnType<typeof setInterval> | null {
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
function stopAutoAdvance(timer: ReturnType<typeof setInterval> | null): void {
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
