import blessed from 'neo-blessed'
import type { Theme } from '../schemas/theme.js'

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
 * @param screen - The blessed screen instance
 * @param windowStack - Stack of existing windows
 * @param theme - Theme configuration
 * @param options - Window configuration options
 * @returns The created window box element
 */
export function createWindow(
  screen: blessed.Widgets.Screen,
  windowStack: blessed.Widgets.BoxElement[],
  theme: Theme,
  options: WindowOptions
): blessed.Widgets.BoxElement {
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
 * @param windowStack - The stack of windows to clear
 */
export function clearWindows(windowStack: blessed.Widgets.BoxElement[]): void {
  for (const window of windowStack) {
    window.destroy()
  }
  windowStack.length = 0
}
