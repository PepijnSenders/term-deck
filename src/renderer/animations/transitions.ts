/**
 * Transition animations module.
 * This module provides a clean interface for slide transition effects.
 *
 * The transitions have been refactored into focused, modular files:
 * - transition-orchestrator.ts: Main dispatcher and type definitions
 * - transitions/glitch-transition.ts: Glitch effect implementation
 * - transitions/fade-transition.ts: Fade effect implementation
 * - transitions/typewriter-transition.ts: Typewriter effect implementation
 * - transitions/instant-transition.ts: Instant (no animation) implementation
 * - helpers/animation-utils.ts: Shared animation utilities
 */

// Re-export the main transition orchestrator
export { applyTransition, type TransitionType } from './transition-orchestrator.js'

// Re-export individual transitions for direct use if needed
export { glitchLine, lineByLineReveal } from './transitions/glitch-transition.js'
export { fadeInReveal } from './transitions/fade-transition.js'
export { typewriterReveal } from './transitions/typewriter-transition.js'
export { instantReveal } from './transitions/instant-transition.js'
