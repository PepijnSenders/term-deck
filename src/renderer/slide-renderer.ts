import blessed from 'neo-blessed'
import type { Theme } from '../schemas/theme.js'
import type { Slide } from '../schemas/slide.js'
import { normalizeBigText, processSlideContent } from '../core/slide.js'
import { applyTransition } from './animations/transitions.js'
import { generateMultiLineBigText } from './text-generator.js'
import { createWindow } from './window-manager.js'

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
 * Render a slide to a window.
 * Creates a window, generates bigText if present, processes the body content,
 * and applies the specified transition effect to reveal the slide.
 *
 * @param screen - The blessed screen instance
 * @param windowStack - Stack of existing windows
 * @param theme - Active theme for rendering
 * @param slide - The slide to render
 * @returns The created window box element containing the rendered slide
 */
export async function renderSlide(
  screen: blessed.Widgets.Screen,
  windowStack: blessed.Widgets.BoxElement[],
  theme: Theme,
  slide: Slide
): Promise<blessed.Widgets.BoxElement> {
  const { frontmatter, body } = slide

  // Create window
  const window = createWindow(screen, windowStack, theme, {
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
  await applyTransition(window, screen, content, transition, theme)

  return window
}
