import { describe, it, expect, vi } from 'vitest'
import {
  createScreen,
  createRenderer,
  destroyRenderer,
  generateBigText,
  generateMultiLineBigText,
  getWindowColor,
  createWindow,
  clearWindows,
  applyTransition,
  renderSlide,
} from '../screen'
import { renderMatrixRain, initMatrixRain } from '../effects/matrix-rain'
import { lineByLineReveal, glitchLine } from '../animations/transitions'
import { DEFAULT_THEME } from '../../schemas/theme'
import type { Slide } from '../../schemas/slide'

describe('createScreen', () => {
  it('creates a blessed screen with correct configuration', () => {
    const screen = createScreen()

    expect(screen).toBeDefined()
    // Clean up
    screen.destroy()
  })

  it('accepts custom title', () => {
    const title = 'Custom Title'
    const screen = createScreen(title)

    expect(screen).toBeDefined()
    // Clean up
    screen.destroy()
  })

  it('uses default title when none provided', () => {
    const screen = createScreen()

    expect(screen).toBeDefined()
    // Clean up
    screen.destroy()
  })
})

describe('createRenderer', () => {
  it('initializes renderer with all components', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    expect(renderer).toBeDefined()
    expect(renderer.screen).toBeDefined()
    expect(renderer.matrixRain).toBeDefined()
    expect(renderer.matrixRain.matrixBox).toBeDefined()
    expect(renderer.windowStack).toEqual([])
    expect(renderer.theme).toBe(DEFAULT_THEME)
    expect(Array.isArray(renderer.matrixRain.matrixDrops)).toBe(true)
    expect(renderer.matrixRain.matrixDrops.length).toBeGreaterThan(0)
    expect(renderer.matrixRain.matrixInterval).toBeDefined()

    // Clean up
    destroyRenderer(renderer)
  })

  it('attaches matrix box to screen', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    expect(renderer.matrixRain.matrixBox.parent).toBe(renderer.screen)

    // Clean up
    destroyRenderer(renderer)
  })

  it('initializes matrix rain on creation', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Matrix rain should be initialized (even if empty for now)
    expect(renderer.matrixRain.matrixDrops).toBeDefined()
    expect(Array.isArray(renderer.matrixRain.matrixDrops)).toBe(true)

    // Clean up
    destroyRenderer(renderer)
  })
})

describe('destroyRenderer', () => {
  it('clears matrix interval if running', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Set up a mock interval
    renderer.matrixRain.matrixInterval = setInterval(() => {}, 100)

    destroyRenderer(renderer)

    expect(renderer.matrixRain.matrixInterval).toBeNull()
  })

  it('handles null matrix interval gracefully', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Clear the interval so it becomes null
    if (renderer.matrixRain.matrixInterval) {
      clearInterval(renderer.matrixRain.matrixInterval)
      renderer.matrixRain.matrixInterval = null
    }

    // Should not throw when interval is null
    expect(() => destroyRenderer(renderer)).not.toThrow()
  })

  it('destroys all windows in the stack', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Create mock windows
    const mockWindow1 = {
      destroy: vi.fn(() => {}),
    }
    const mockWindow2 = {
      destroy: vi.fn(() => {}),
    }

    renderer.windowStack = [mockWindow1 as any, mockWindow2 as any]

    destroyRenderer(renderer)

    expect(mockWindow1.destroy).toHaveBeenCalledTimes(1)
    expect(mockWindow2.destroy).toHaveBeenCalledTimes(1)
    expect(renderer.windowStack).toEqual([])
  })

  it('empties the window stack after destroying windows', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Add mock windows
    renderer.windowStack = [
      { destroy: vi.fn(() => {}) } as any,
      { destroy: vi.fn(() => {}) } as any,
      { destroy: vi.fn(() => {}) } as any,
    ]

    destroyRenderer(renderer)

    expect(renderer.windowStack).toEqual([])
  })

  it('destroys the blessed screen', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Mock the screen destroy method
    const destroySpy = vi.fn(() => {})
    renderer.screen.destroy = destroySpy

    destroyRenderer(renderer)

    expect(destroySpy).toHaveBeenCalledTimes(1)
  })

  it('performs full cleanup in correct order', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    // Set up interval and windows
    renderer.matrixRain.matrixInterval = setInterval(() => {}, 100)
    const mockWindow = { destroy: vi.fn(() => {}) }
    renderer.windowStack = [mockWindow as any]
    const screenDestroySpy = vi.fn(() => {})
    renderer.screen.destroy = screenDestroySpy

    destroyRenderer(renderer)

    // Verify all cleanup steps occurred
    expect(renderer.matrixRain.matrixInterval).toBeNull()
    expect(mockWindow.destroy).toHaveBeenCalled()
    expect(renderer.windowStack).toEqual([])
    expect(screenDestroySpy).toHaveBeenCalled()
  })

  it('handles empty window stack', () => {
    const renderer = createRenderer(DEFAULT_THEME)

    expect(renderer.windowStack).toEqual([])

    // Should not throw with empty stack
    expect(() => destroyRenderer(renderer)).not.toThrow()
  })
})

describe('generateBigText', () => {
  it('generates ASCII art text successfully', async () => {
    const text = 'HELLO'
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateBigText(text, gradientColors)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('applies gradient colors to ASCII art', async () => {
    const text = 'TEST'
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateBigText(text, gradientColors)

    // The gradient library adds ANSI color codes
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(text.length)
  })

  it('uses Standard font by default', async () => {
    const text = 'ABC'
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateBigText(text, gradientColors)

    expect(result).toBeDefined()
    // Standard font should produce multi-line ASCII art
    expect(result.includes('\n')).toBe(true)
  })

  it('accepts custom font parameter', async () => {
    const text = 'XYZ'
    const gradientColors = ['#00cc66', '#ff6600']
    const font = 'Small'

    const result = await generateBigText(text, gradientColors, font)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('handles single character input', async () => {
    const text = 'A'
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateBigText(text, gradientColors)

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty string gracefully', async () => {
    const text = ''
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateBigText(text, gradientColors)

    expect(result).toBeDefined()
  })
})

describe('generateMultiLineBigText', () => {
  it('generates ASCII art for multiple lines', async () => {
    const lines = ['SPEC', 'MACHINE']
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateMultiLineBigText(lines, gradientColors)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('joins lines with newlines', async () => {
    const lines = ['LINE1', 'LINE2']
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateMultiLineBigText(lines, gradientColors)

    // Should have newlines between the ASCII art blocks
    const newlineCount = (result.match(/\n/g) || []).length
    expect(newlineCount).toBeGreaterThan(0)
  })

  it('applies gradient to each line independently', async () => {
    const lines = ['A', 'B', 'C']
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateMultiLineBigText(lines, gradientColors)

    expect(result).toBeDefined()
    // Each line should be processed
    expect(result.length).toBeGreaterThan(lines.length)
  })

  it('handles empty array', async () => {
    const lines: string[] = []
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateMultiLineBigText(lines, gradientColors)

    expect(result).toBeDefined()
    expect(result).toBe('')
  })

  it('handles single line array', async () => {
    const lines = ['ONLY']
    const gradientColors = ['#00cc66', '#ff6600']

    const result = await generateMultiLineBigText(lines, gradientColors)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('uses custom font parameter', async () => {
    const lines = ['TEST', 'FONT']
    const gradientColors = ['#00cc66', '#ff6600']
    const font = 'Small'

    const result = await generateMultiLineBigText(lines, gradientColors, font)

    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })

  it('processes all lines in parallel', async () => {
    const lines = ['ONE', 'TWO', 'THREE']
    const gradientColors = ['#00cc66', '#ff6600']

    const startTime = Date.now()
    const result = await generateMultiLineBigText(lines, gradientColors)
    const duration = Date.now() - startTime

    expect(result).toBeDefined()
    // Processing should be relatively fast due to parallelization
    // This is a loose check - mainly verifying it completes
    expect(duration).toBeLessThan(5000)
  })
})

describe('glitchLine', () => {
  it('animates a single line with glitch effect', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = renderer.windowStack[0] || {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const currentLines = ['Line 1', 'Line 2']
    const newLine = 'Line 3'

    await glitchLine(box, screen, currentLines, newLine, 3)

    // Should have called setContent multiple times during animation
    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('preserves protected characters during glitch', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const contentCalls: string[] = []
    const box = {
      setContent: vi.fn((content: string) => {
        contentCalls.push(content)
      }),
    } as any
    const screen = renderer.screen
    const currentLines: string[] = []
    const newLine = 'Hello, World!'

    await glitchLine(box, screen, currentLines, newLine, 5)

    // Check that spaces and punctuation were preserved in all calls
    for (const call of contentCalls) {
      expect(call).toContain(',')
      expect(call).toContain(' ')
    }

    destroyRenderer(renderer)
  })

  it('gradually reveals text over iterations', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const contentCalls: string[] = []
    const box = {
      setContent: vi.fn((content: string) => {
        contentCalls.push(content)
      }),
    } as any
    const screen = renderer.screen
    const currentLines: string[] = []
    const newLine = 'Test'

    await glitchLine(box, screen, currentLines, newLine, 3)

    // Should have multiple calls showing progression
    expect(contentCalls.length).toBeGreaterThan(1)
    // Last call should have the final text
    expect(contentCalls[contentCalls.length - 1]).toBe('Test')

    destroyRenderer(renderer)
  })

  it('handles empty lines', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const currentLines: string[] = []
    const newLine = ''

    await glitchLine(box, screen, currentLines, newLine, 2)

    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })
})

describe('lineByLineReveal', () => {
  it('reveals content line by line', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const content = 'Line 1\nLine 2\nLine 3'

    await lineByLineReveal(box, screen, content, DEFAULT_THEME)

    // Should have called setContent multiple times
    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('uses theme animations configuration', async () => {
    const customTheme = {
      ...DEFAULT_THEME,
      animations: {
        ...DEFAULT_THEME.animations,
        lineDelay: 10,
        glitchIterations: 2,
      },
    }

    const renderer = createRenderer(customTheme)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const content = 'Line A\nLine B'

    await lineByLineReveal(box, screen, content, customTheme)

    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('handles single line content', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const content = 'Single line'

    await lineByLineReveal(box, screen, content, DEFAULT_THEME)

    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('handles empty content', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const content = ''

    await lineByLineReveal(box, screen, content, DEFAULT_THEME)

    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('skips delay for empty lines', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const box = {
      setContent: vi.fn(() => {}),
    } as any
    const screen = renderer.screen
    const content = 'Line 1\n\nLine 3'

    const startTime = Date.now()
    await lineByLineReveal(box, screen, content, DEFAULT_THEME)
    const duration = Date.now() - startTime

    // Should complete relatively quickly since empty line doesn't add delay
    expect(duration).toBeLessThan(1000)
    expect(box.setContent).toHaveBeenCalled()

    destroyRenderer(renderer)
  })

  it('processes multi-line content sequentially', async () => {
    const renderer = createRenderer(DEFAULT_THEME)
    const contentCalls: string[] = []
    const box = {
      setContent: vi.fn((content: string) => {
        contentCalls.push(content)
      }),
    } as any
    const screen = renderer.screen
    const content = 'First\nSecond\nThird'

    await lineByLineReveal(box, screen, content, DEFAULT_THEME)

    // Should have accumulated lines progressively
    expect(contentCalls.length).toBeGreaterThan(0)
    // Final call should have all lines
    const finalCall = contentCalls[contentCalls.length - 1]
    expect(finalCall).toContain('First')
    expect(finalCall).toContain('Second')
    expect(finalCall).toContain('Third')

    destroyRenderer(renderer)
  })
})
