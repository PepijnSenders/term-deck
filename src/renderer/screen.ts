import blessed from 'neo-blessed'
import type { Theme } from '../schemas/theme.js'
import type { Slide } from '../schemas/slide.js'
import {
  type MatrixRainState,
  createMatrixBox,
  initMatrixRain,
  stopMatrixRain,
} from './effects/matrix-rain.js'
import { type TransitionType } from './animations/transitions.js'
import {
  createWindow as createWindowInternal,
  clearWindows as clearWindowsInternal,
  type WindowOptions,
} from './window-manager.js'
import { renderSlide as renderSlideInternal } from './slide-renderer.js'
import { generateBigText, generateMultiLineBigText } from './text-generator.js'

// Re-export for backwards compatibility
export { type TransitionType, applyTransition } from './animations/transitions.js'
export { type WindowOptions, getWindowColor } from './window-manager.js'
export { generateBigText, generateMultiLineBigText } from './text-generator.js'
export { type RenderedContent } from './slide-renderer.js'

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

  // Clear all windows
  clearWindowsInternal(renderer.windowStack)

  // Destroy the screen (restores terminal)
  renderer.screen.destroy()
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
  return createWindowInternal(renderer.screen, renderer.windowStack, renderer.theme, options)
}

/**
 * Clear all windows from stack.
 * Destroys all window elements in the stack and resets the stack to empty.
 * This is typically called when transitioning between slides.
 *
 * @param renderer - The renderer instance containing the window stack
 */
export function clearWindows(renderer: Renderer): void {
  clearWindowsInternal(renderer.windowStack)
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
  return renderSlideInternal(renderer.screen, renderer.windowStack, renderer.theme, slide)
}
