import blessed from 'neo-blessed'
import figlet from 'figlet'
import gradient from 'gradient-string'
import type { Theme } from '../schemas/theme.js'
import type { Slide } from '../schemas/slide.js'
import { normalizeBigText, processSlideContent } from '../core/slide.js'
import {
  type MatrixRainState,
  createMatrixBox,
  initMatrixRain,
  stopMatrixRain,
} from './effects/matrix-rain.js'
import { applyTransition, type TransitionType } from './animations/transitions.js'

// Re-export for backwards compatibility
export { type TransitionType, applyTransition } from './animations/transitions.js'

/**
 * Main renderer state.
 * Manages the blessed screen, matrix rain background, window stack, and theme.
 */
export interface Renderer {
  /** The blessed screen instance */
  screen: blessed.Widgets.Screen
  /** Stack of window elements (slides render on top of each other) */
  windowStack: blessed.Widgets.BoxElement[]
  /** Active theme for rendering */
  theme: Theme
  /** Matrix rain animation state */
  matrixRain: MatrixRainState
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
  const matrixBox = createMatrixBox(screen)

  const matrixRain: MatrixRainState = {
    matrixBox,
    matrixDrops: [],
    matrixInterval: null,
    theme,
  }

  const renderer: Renderer = {
    screen,
    windowStack: [],
    theme,
    matrixRain,
  }

  // Initialize matrix rain
  initMatrixRain(screen, matrixRain)

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
  // Stop matrix rain animation
  stopMatrixRain(renderer.matrixRain)

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
