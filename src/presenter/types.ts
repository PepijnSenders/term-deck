import blessed from 'neo-blessed';
import type { Deck } from '../core/slide.js';
import type { Renderer } from '../renderer/screen.js';
import type { NotesWindow } from './notes-window.js';

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
