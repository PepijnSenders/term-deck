import blessed from 'neo-blessed';
import type { Presenter } from './types.js';
import { renderSlide, clearWindows } from '../renderer/screen.js';
import { updateNotesWindow } from './notes-window.js';

/**
 * Show a specific slide
 *
 * Renders the specified slide index and updates notes/progress.
 * Respects the isAnimating flag to prevent concurrent transitions.
 *
 * @param presenter - The presenter state
 * @param index - The slide index to show (0-based)
 */
export async function showSlide(presenter: Presenter, index: number): Promise<void> {
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
    const nextSlide = presenter.deck.slides[index + 1];
    updateNotesWindow(
      presenter.notesWindow,
      slide,
      nextSlide,
      index,
      presenter.deck.slides.length
    );
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

      updateUIComponents(presenter, slides.length - 1);
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

  updateUIComponents(presenter, prevIndex);
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

  presenter.currentSlide = index;

  updateUIComponents(presenter, index);
  presenter.renderer.screen.render();
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
export function updateProgress(
  progressBar: blessed.Widgets.ProgressBarElement,
  current: number,
  total: number
): void {
  const progress = ((current + 1) / total) * 100;
  progressBar.setProgress(progress);
}

/**
 * Update UI components after slide change
 *
 * Updates the notes window and progress bar to reflect the current slide.
 * This centralizes the UI update logic used by navigation functions.
 *
 * @param presenter - The presenter state
 * @param currentIndex - Current slide index (0-based)
 */
function updateUIComponents(presenter: Presenter, currentIndex: number): void {
  const { slides } = presenter.deck;
  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1];

  if (presenter.notesWindow) {
    updateNotesWindow(
      presenter.notesWindow,
      currentSlide,
      nextSlide,
      currentIndex,
      slides.length
    );
  }

  if (presenter.progressBar) {
    updateProgress(presenter.progressBar, currentIndex, slides.length);
  }
}
