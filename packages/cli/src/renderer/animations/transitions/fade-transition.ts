import type blessed from 'neo-blessed'
import type { Theme } from '../../../schemas/theme.js'
import { PROTECTED_CHARS } from '../constants.js'
import { sleep, renderContent } from '../helpers/animation-utils.js'

/**
 * Fade-in reveal (character by character, all at once).
 * Gradually reveals characters randomly across the entire content
 * to create a fade-in effect. Uses multiple steps with increasing
 * reveal probability for a smooth animation.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The complete content string to reveal
 * @param theme - Theme configuration for animation timing
 */
export async function fadeInReveal(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string,
  theme: Theme
): Promise<void> {
  const steps = 10
  const delay = (theme.animations.lineDelay * 2) / steps

  for (let step = 0; step < steps; step++) {
    const revealRatio = step / steps
    let revealed = ''

    for (const char of content) {
      if (char === '\n' || PROTECTED_CHARS.has(char) || Math.random() < revealRatio) {
        revealed += char
      } else {
        revealed += ' '
      }
    }

    renderContent(box, screen, revealed)
    await sleep(delay)
  }

  renderContent(box, screen, content)
}
