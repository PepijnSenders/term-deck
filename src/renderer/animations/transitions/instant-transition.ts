import type blessed from 'neo-blessed'
import { renderContent } from '../helpers/animation-utils.js'

/**
 * Instant reveal (no animation).
 * Immediately displays the content without any transition effect.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The complete content string to reveal
 */
export function instantReveal(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string
): void {
  renderContent(box, screen, content)
}
