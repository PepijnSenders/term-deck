import type { Presenter } from './types.js';
import { nextSlide, prevSlide, jumpToSlide } from './navigation.js';
import { toggleNotesVisibility } from './notes-window.js';

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
export function setupControls(presenter: Presenter): void {
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
