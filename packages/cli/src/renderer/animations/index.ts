/**
 * Animation effects module for term-deck.
 * Provides transition effects for slide content reveal.
 */

export { GLITCH_CHARS, PROTECTED_CHARS } from './constants.js'
export {
  type TransitionType,
  glitchLine,
  lineByLineReveal,
  fadeInReveal,
  typewriterReveal,
  applyTransition,
} from './transitions.js'
