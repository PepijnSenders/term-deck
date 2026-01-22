import type blessed from 'neo-blessed'

/**
 * Sleep helper for async animations.
 * Returns a promise that resolves after the specified delay.
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Renders content to a blessed box and updates the screen.
 * Utility function to reduce code duplication across transitions.
 *
 * @param box - The blessed box element to render into
 * @param screen - The blessed screen for rendering
 * @param content - The content string to render
 */
export function renderContent(
  box: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
  content: string
): void {
  box.setContent(content)
  screen.render()
}
