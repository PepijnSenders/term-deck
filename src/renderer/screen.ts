import blessed from 'neo-blessed'
import figlet from 'figlet'
import gradient from 'gradient-string'
import type { Theme } from '../schemas/theme.js'
import type { Slide } from '../schemas/slide.js'
import { normalizeBigText, processSlideContent } from '../core/slide.js'

/**
 * Main renderer state.
 * Manages the blessed screen, matrix rain background, window stack, and theme.
 */
export interface Renderer {
  /** The blessed screen instance */
  screen: blessed.Widgets.Screen
  /** Box element for matrix rain background */
  matrixBox: blessed.Widgets.BoxElement
  /** Stack of window elements (slides render on top of each other) */
  windowStack: blessed.Widgets.BoxElement[]
  /** Active theme for rendering */
  theme: Theme
  /** Array of matrix rain drops for animation */
  matrixDrops: MatrixDrop[]
  /** Interval timer for matrix rain animation (null if stopped) */
  matrixInterval: NodeJS.Timer | null
}

/**
 * Matrix rain drop.
 * Represents a single falling column of glyphs in the matrix background.
 */
export interface MatrixDrop {
  /** Horizontal position (column) */
  x: number
  /** Vertical position (row, can be fractional for smooth animation) */
  y: number
  /** Fall speed (rows per animation frame) */
  speed: number
  /** Array of glyph characters forming the drop's trail */
  trail: string[]
}

/**
 * Window creation options.
 * Configuration for creating slide windows with stacking effect.
 */
export interface WindowOptions {
  /** Window title displayed in the border */
  title: string
  /** Border color (defaults to theme-based cycling) */
  color?: string
  /** Window width (number for absolute, string for percentage) */
  width?: number | string
  /** Window height (number for absolute, string for percentage) */
  height?: number | string
  /** Top position (number for absolute, string for percentage) */
  top?: number | string
  /** Left position (number for absolute, string for percentage) */
  left?: number | string
}

/**
 * Rendered slide content.
 * Structured content ready for display in a window.
 */
export interface RenderedContent {
  /** ASCII art big text (from figlet) */
  bigText?: string
  /** Main body content */
  body: string
  /** Mermaid diagram converted to ASCII */
  diagram?: string
}

/**
 * Create the main blessed screen.
 * Configures the screen with optimal settings for presentation:
 * - smartCSR: Enables smart cursor movement for efficient rendering
 * - fullUnicode: Enables full unicode support for glyphs
 * - altScreen: Uses alternate screen buffer (preserves terminal on exit)
 * - mouse: Disabled (keyboard-only navigation)
 *
 * @param title - Window title (defaults to 'term-deck')
 * @returns Configured blessed screen instance
 */
export function createScreen(title: string = 'term-deck'): blessed.Widgets.Screen {
  const screen = blessed.screen({
    smartCSR: true,
    title,
    fullUnicode: true,
    mouse: false,
    altScreen: true,
  })

  return screen
}

/**
 * Generate a trail of random glyphs.
 * Randomly selects glyphs from the theme's glyph set to form a drop trail.
 *
 * @param glyphs - String of available glyphs to choose from
 * @param length - Number of characters in the trail
 * @returns Array of random glyph characters
 */
function generateTrail(glyphs: string, length: number): string[] {
  return Array.from({ length }, () =>
    glyphs[Math.floor(Math.random() * glyphs.length)]
  )
}

/**
 * Render one frame of matrix rain.
 * Updates the matrix background with falling glyph trails.
 * This function is called repeatedly by the animation interval.
 *
 * @param renderer - The renderer instance to update
 */
export function renderMatrixRain(renderer: Renderer): void {
  const { screen, matrixBox, matrixDrops, theme } = renderer
  const width = Math.max(20, (screen.width as number) || 80)
  const height = Math.max(10, (screen.height as number) || 24)

  // Create grid for positioning characters
  const grid: string[][] = Array.from({ length: height }, () =>
    Array(width).fill(' ')
  )

  // Update and render drops
  for (const drop of matrixDrops) {
    drop.y += drop.speed

    // Reset if off screen
    if (drop.y > height + drop.trail.length) {
      drop.y = -drop.trail.length
      drop.x = Math.floor(Math.random() * width)
    }

    // Draw trail
    for (let i = 0; i < drop.trail.length; i++) {
      const y = Math.floor(drop.y) - i
      if (y >= 0 && y < height && drop.x < width) {
        grid[y][drop.x] = drop.trail[i]
      }
    }
  }

  // Convert grid to string with colors
  let output = ''
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = grid[y][x]
      if (char !== ' ') {
        const brightness = Math.random() > 0.7 ? '{bold}' : ''
        output += `${brightness}{${theme.colors.primary}-fg}${char}{/}`
      } else {
        output += ' '
      }
    }
    if (y < height - 1) output += '\n'
  }

  matrixBox.setContent(output)
}

/**
 * Initialize matrix rain drops.
 * Creates the initial set of drops and starts the animation loop.
 * This is called automatically by createRenderer.
 *
 * @param renderer - The renderer instance to initialize
 */
export function initMatrixRain(renderer: Renderer): void {
  const { screen, theme } = renderer
  const width = (screen.width as number) || 80
  const height = (screen.height as number) || 24
  const density = theme.animations.matrixDensity

  renderer.matrixDrops = []

  for (let i = 0; i < density; i++) {
    renderer.matrixDrops.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      speed: 0.3 + Math.random() * 0.7,
      trail: generateTrail(theme.glyphs, 5 + Math.floor(Math.random() * 10)),
    })
  }

  // Start animation loop
  renderer.matrixInterval = setInterval(() => {
    renderMatrixRain(renderer)
    renderer.screen.render()
  }, theme.animations.matrixInterval)
}

/**
 * Create the renderer with all components.
 * Initializes the blessed screen, matrix rain background box,
 * empty window stack, and starts the matrix rain animation.
 *
 * @param theme - Theme configuration for rendering
 * @returns Fully initialized Renderer instance
 */
export function createRenderer(theme: Theme): Renderer {
  const screen = createScreen()

  // Create matrix background box covering full screen
  const matrixBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    tags: true,
  })
  screen.append(matrixBox)

  const renderer: Renderer = {
    screen,
    matrixBox,
    windowStack: [],
    theme,
    matrixDrops: [],
    matrixInterval: null,
  }

  // Initialize matrix rain
  initMatrixRain(renderer)

  return renderer
}

/**
 * Destroy renderer and cleanup resources.
 * Stops the matrix rain animation, destroys all windows in the stack,
 * and destroys the blessed screen to restore the terminal.
 *
 * @param renderer - The renderer instance to destroy
 */
export function destroyRenderer(renderer: Renderer): void {
  // Clear matrix rain animation interval
  if (renderer.matrixInterval) {
    clearInterval(renderer.matrixInterval)
    renderer.matrixInterval = null
  }

  // Destroy all windows in the stack
  for (const win of renderer.windowStack) {
    win.destroy()
  }
  renderer.windowStack = []

  // Destroy the screen (restores terminal)
  renderer.screen.destroy()
}

/**
 * Get window border color based on index.
 * Cycles through theme colors and additional cyberpunk colors
 * to create a stacking effect with varied border colors.
 *
 * @param index - Window index in the stack
 * @param theme - Theme configuration
 * @returns Hex color string for the window border
 */
export function getWindowColor(index: number, theme: Theme): string {
  const colors = [
    theme.colors.primary,
    theme.colors.accent,
    theme.colors.secondary ?? theme.colors.primary,
    '#ff0066', // pink
    '#9966ff', // purple
    '#ffcc00', // yellow
  ]
  return colors[index % colors.length]
}

/**
 * Create a slide window with stacking effect.
 * Creates a bordered box element with theme-based styling,
 * random position for stacking effect, and adds it to the window stack.
 *
 * @param renderer - The renderer instance
 * @param options - Window configuration options
 * @returns The created window box element
 */
export function createWindow(
  renderer: Renderer,
  options: WindowOptions
): blessed.Widgets.BoxElement {
  const { screen, windowStack, theme } = renderer
  const windowIndex = windowStack.length
  const color = options.color ?? getWindowColor(windowIndex, theme)

  const screenWidth = (screen.width as number) || 120
  const screenHeight = (screen.height as number) || 40

  // Default dimensions: 75% width, 70% height
  const width = options.width ?? Math.floor(screenWidth * 0.75)
  const height = options.height ?? Math.floor(screenHeight * 0.7)

  // Random position within bounds (for stacking effect)
  const maxTop = Math.max(1, screenHeight - (height as number) - 2)
  const maxLeft = Math.max(1, screenWidth - (width as number) - 2)
  const top = options.top ?? Math.floor(Math.random() * maxTop)
  const left = options.left ?? Math.floor(Math.random() * maxLeft)

  const window = theme.window ?? { borderStyle: 'line', shadow: true }
  const padding = window.padding ?? { top: 1, bottom: 1, left: 2, right: 2 }

  const box = blessed.box({
    top,
    left,
    width,
    height,
    border: {
      type: window.borderStyle === 'none' ? undefined : 'line',
    },
    label: ` ${options.title} `,
    style: {
      fg: theme.colors.text,
      bg: theme.colors.background,
      border: { fg: color },
      label: { fg: color, bold: true },
    },
    padding,
    tags: true,
    shadow: window.shadow,
  })

  screen.append(box)
  windowStack.push(box)

  return box
}

/**
 * Clear all windows from stack.
 * Destroys all window elements in the stack and resets the stack to empty.
 * This is typically called when transitioning between slides.
 *
 * @param renderer - The renderer instance containing the window stack
 */
export function clearWindows(renderer: Renderer): void {
  for (const window of renderer.windowStack) {
    window.destroy()
  }
  renderer.windowStack = []
}

/**
 * Generate ASCII art text with gradient.
 * Uses figlet to convert text to ASCII art and applies a gradient color effect.
 * This function is asynchronous because figlet uses a callback-based API.
 *
 * @param text - The text to convert to ASCII art
 * @param gradientColors - Array of hex colors for the gradient effect
 * @param font - Figlet font to use (defaults to 'Standard')
 * @returns Promise resolving to the gradient-colored ASCII art text
 */
export async function generateBigText(
  text: string,
  gradientColors: string[],
  font: string = 'Standard'
): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font }, (err, result) => {
      if (err || !result) {
        reject(err ?? new Error('Failed to generate figlet text'))
        return
      }

      // Apply gradient
      const gradientFn = gradient(gradientColors)
      resolve(gradientFn(result))
    })
  })
}

/**
 * Generate multi-line big text (for arrays like ['SPEC', 'MACHINE']).
 * Creates ASCII art for each line separately and joins them with newlines.
 * Each line gets the same gradient applied independently.
 *
 * @param lines - Array of text strings to convert to ASCII art
 * @param gradientColors - Array of hex colors for the gradient effect
 * @param font - Figlet font to use (defaults to 'Standard')
 * @returns Promise resolving to the combined gradient-colored ASCII art
 */
export async function generateMultiLineBigText(
  lines: string[],
  gradientColors: string[],
  font: string = 'Standard'
): Promise<string> {
  const results = await Promise.all(
    lines.map((line) => generateBigText(line, gradientColors, font))
  )
  return results.join('\n')
}

/**
 * Characters used for glitch effect (avoiding box drawing).
 * These characters create a cyberpunk glitch aesthetic when scrambling text.
 * Includes: block characters, shapes, math symbols, Greek letters, and katakana.
 */
const GLITCH_CHARS =
  '█▓▒░▀▄▌▐■□▪▫●○◊◘◙♦♣♠♥★☆⌂ⁿ²³ÆØ∞≈≠±×÷αβγδεζηθλμπσφωΔΣΩｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'

/**
 * Characters to never glitch.
 * Protects structural characters like spaces, punctuation, box drawing,
 * and arrows to maintain readability and layout integrity during glitch effects.
 */
const PROTECTED_CHARS = new Set([
  ' ', '\t', '\n', '{', '}', '-', '/', '#', '[', ']', '(', ')', ':', ';',
  ',', '.', '!', '?', "'", '"', '`', '_', '|', '\\', '<', '>', '=', '+',
  '*', '&', '^', '%', '$', '@', '~',
  // Box drawing
  '┌', '┐', '└', '┘', '│', '─', '├', '┤', '┬', '┴', '┼', '═', '║',
  '╔', '╗', '╚', '╝', '╠', '╣', '╦', '╩', '╬', '╭', '╮', '╯', '╰',
  // Arrows
  '→', '←', '↑', '↓', '▶', '◀', '▲', '▼', '►', '◄',
])

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
 * Transition type for slide animations.
 * Defines the available transition effects for revealing slide content.
 */
export type TransitionType = 'glitch' | 'fade' | 'instant' | 'typewriter'

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
async function fadeInReveal(
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
async function typewriterReveal(
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

/**
 * Render a slide to a window.
 * Creates a window, generates bigText if present, processes the body content,
 * and applies the specified transition effect to reveal the slide.
 *
 * @param renderer - The renderer instance
 * @param slide - The slide to render
 * @returns The created window box element containing the rendered slide
 */
export async function renderSlide(
  renderer: Renderer,
  slide: Slide
): Promise<blessed.Widgets.BoxElement> {
  const { theme } = renderer
  const { frontmatter, body } = slide

  // Create window
  const window = createWindow(renderer, {
    title: frontmatter.title,
  })

  // Build content
  let content = ''

  // Big text (figlet)
  const bigTextLines = normalizeBigText(frontmatter.bigText)
  if (bigTextLines.length > 0) {
    const gradientName = frontmatter.gradient ?? 'fire'
    const gradientColors = theme.gradients[gradientName] ?? theme.gradients.fire

    const bigText = await generateMultiLineBigText(bigTextLines, gradientColors)
    content += bigText + '\n\n'
  }

  // Process body content (color tokens, mermaid)
  const processedBody = await processSlideContent(body, theme)
  content += processedBody

  // Apply transition
  const transition = frontmatter.transition ?? 'glitch'
  await applyTransition(window, renderer.screen, content, transition, theme)

  return window
}
