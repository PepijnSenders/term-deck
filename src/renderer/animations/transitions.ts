import type blessed from 'neo-blessed'
import type { Theme } from '../../schemas/theme.js'
import { GLITCH_CHARS, PROTECTED_CHARS } from './constants.js'

/**
 * Transition type for slide animations.
 * Defines the available transition effects for revealing slide content.
 */
export type TransitionType = 'glitch' | 'fade' | 'instant' | 'typewriter'

/**
 * Sleep helper for async animations.
 * Returns a promise that resolves after the specified delay.
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Glitch-reveal a single line of text.
 * Animates the transition from scrambled characters to the final text.
 * The scramble ratio decreases with each iteration, gradually revealing the text.
 * Protected characters (spaces, punctuation, box drawing) are never scrambled.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param currentLines - Array of already-revealed lines
 * @param newLine - The new line to glitch-reveal
 * @param iterations - Number of glitch iterations (default: 5)
 */
export async function glitchLine(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  currentLines: string[],
  newLine: string,
  iterations: number = 5
): Promise<void> {
  for (let i = iterations; i >= 0; i--) {
    const scrambleRatio = i / iterations
    let scrambledLine = ''

    for (const char of newLine) {
      if (PROTECTED_CHARS.has(char)) {
        scrambledLine += char
      } else if (Math.random() < scrambleRatio) {
        scrambledLine += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      } else {
        scrambledLine += char
      }
    }

    box.setContent([...currentLines, scrambledLine].join('\n'))
    screen.render()
    await sleep(20)
  }
}

/**
 * Reveal content line by line with glitch effect.
 * Animates the transition of multi-line content by revealing each line
 * sequentially with a glitch effect. Uses theme-configured line delay
 * and glitch iteration count for consistent animation timing.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The complete content string (with newlines)
 * @param theme - Theme configuration for animation timing
 */
export async function lineByLineReveal(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string,
  theme: Theme
): Promise<void> {
  const lines = content.split('\n')
  const revealedLines: string[] = []
  const lineDelay = theme.animations.lineDelay
  const glitchIterations = theme.animations.glitchIterations

  for (const line of lines) {
    await glitchLine(box, screen, revealedLines, line, glitchIterations)
    revealedLines.push(line)
    box.setContent(revealedLines.join('\n'))
    screen.render()

    // Delay between lines (skip for empty lines)
    if (line.trim()) {
      await sleep(lineDelay)
    }
  }
}

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

    box.setContent(revealed)
    screen.render()
    await sleep(delay)
  }

  box.setContent(content)
  screen.render()
}

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
    box.setContent(revealed)
    screen.render()

    if (char !== ' ' && char !== '\n') {
      await sleep(charDelay)
    }
  }
}

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
      box.setContent(content)
      screen.render()
      break

    case 'typewriter':
      await typewriterReveal(box, screen, content, theme)
      break

    default:
      box.setContent(content)
      screen.render()
  }
}
