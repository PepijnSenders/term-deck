import type blessed from 'neo-blessed'
import type { Theme } from '../../../schemas/theme.js'
import { GLITCH_CHARS, PROTECTED_CHARS } from '../constants.js'
import { sleep, renderContent } from '../helpers/animation-utils.js'

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

    renderContent(box, screen, [...currentLines, scrambledLine].join('\n'))
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
    renderContent(box, screen, revealedLines.join('\n'))

    // Delay between lines (skip for empty lines)
    if (line.trim()) {
      await sleep(lineDelay)
    }
  }
}
