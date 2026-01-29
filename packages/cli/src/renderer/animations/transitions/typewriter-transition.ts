import type blessed from 'neo-blessed'
import type { Theme } from '../../../schemas/theme.js'
import { sleep, renderContent } from '../helpers/animation-utils.js'

/**
 * Typewriter reveal (character by character, sequentially).
 * Reveals content character by character in order, like a typewriter.
 * Skips delay for spaces and newlines to maintain smooth flow.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The complete content string to reveal
 * @param theme - Theme configuration for animation timing
 */
export async function typewriterReveal(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string,
  theme: Theme
): Promise<void> {
  const charDelay = theme.animations.lineDelay / 5
  let revealed = ''

  for (const char of content) {
    revealed += char
    renderContent(box, screen, revealed)

    if (char !== ' ' && char !== '\n') {
      await sleep(charDelay)
    }
  }
}
