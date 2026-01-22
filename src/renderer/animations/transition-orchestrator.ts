import type blessed from 'neo-blessed'
import type { Theme } from '../../schemas/theme.js'
import { lineByLineReveal } from './transitions/glitch-transition.js'
import { fadeInReveal } from './transitions/fade-transition.js'
import { typewriterReveal } from './transitions/typewriter-transition.js'
import { instantReveal } from './transitions/instant-transition.js'

/**
 * Transition type for slide animations.
 * Defines the available transition effects for revealing slide content.
 */
export type TransitionType = 'glitch' | 'fade' | 'instant' | 'typewriter'

/**
 * Apply transition effect to reveal content.
 * Dispatcher function that selects and applies the appropriate
 * transition animation based on the specified transition type.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The complete content string to reveal
 * @param transition - The type of transition effect to apply
 * @param theme - Theme configuration for animation timing
 */
export async function applyTransition(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string,
  transition: TransitionType,
  theme: Theme
): Promise<void> {
  switch (transition) {
    case 'glitch':
      await lineByLineReveal(box, screen, content, theme)
      break

    case 'fade':
      await fadeInReveal(box, screen, content, theme)
      break

    case 'instant':
      instantReveal(box, screen, content)
      break

    case 'typewriter':
      await typewriterReveal(box, screen, content, theme)
      break

    default:
      instantReveal(box, screen, content)
  }
}
