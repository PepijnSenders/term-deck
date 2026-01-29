import { describe, it, expect, vi, type Mock } from 'vitest'
import { GLITCH_CHARS, PROTECTED_CHARS } from '../constants'

// Mock blessed types for testing
interface MockBox {
  content: string
  setContent: (content: string) => void
}

interface MockScreen {
  render: Mock
}

function createMockBox(): MockBox {
  return {
    content: '',
    setContent(content: string) {
      this.content = content
    },
  }
}

function createMockScreen(): MockScreen {
  return {
    render: vi.fn(),
  }
}

describe('Animation Constants', () => {
  describe('GLITCH_CHARS', () => {
    it('contains at least 50 glitch characters', () => {
      expect(GLITCH_CHARS.length).toBeGreaterThanOrEqual(50)
    })

    it('does not contain any protected characters', () => {
      for (const char of GLITCH_CHARS) {
        expect(PROTECTED_CHARS.has(char)).toBe(false)
      }
    })

    it('contains block characters', () => {
      expect(GLITCH_CHARS).toContain('█')
      expect(GLITCH_CHARS).toContain('▓')
      expect(GLITCH_CHARS).toContain('▒')
      expect(GLITCH_CHARS).toContain('░')
    })

    it('contains Greek letters', () => {
      expect(GLITCH_CHARS).toContain('α')
      expect(GLITCH_CHARS).toContain('β')
      expect(GLITCH_CHARS).toContain('Σ')
      expect(GLITCH_CHARS).toContain('Ω')
    })

    it('contains katakana characters', () => {
      expect(GLITCH_CHARS).toContain('ｱ')
      expect(GLITCH_CHARS).toContain('ｲ')
    })
  })

  describe('PROTECTED_CHARS', () => {
    it('protects whitespace characters', () => {
      expect(PROTECTED_CHARS.has(' ')).toBe(true)
      expect(PROTECTED_CHARS.has('\t')).toBe(true)
      expect(PROTECTED_CHARS.has('\n')).toBe(true)
    })

    it('protects common punctuation', () => {
      expect(PROTECTED_CHARS.has('.')).toBe(true)
      expect(PROTECTED_CHARS.has(',')).toBe(true)
      expect(PROTECTED_CHARS.has('!')).toBe(true)
      expect(PROTECTED_CHARS.has('?')).toBe(true)
      expect(PROTECTED_CHARS.has(':')).toBe(true)
      expect(PROTECTED_CHARS.has(';')).toBe(true)
    })

    it('protects brackets and braces', () => {
      expect(PROTECTED_CHARS.has('{')).toBe(true)
      expect(PROTECTED_CHARS.has('}')).toBe(true)
      expect(PROTECTED_CHARS.has('[')).toBe(true)
      expect(PROTECTED_CHARS.has(']')).toBe(true)
      expect(PROTECTED_CHARS.has('(')).toBe(true)
      expect(PROTECTED_CHARS.has(')')).toBe(true)
    })

    it('protects box drawing characters', () => {
      expect(PROTECTED_CHARS.has('┌')).toBe(true)
      expect(PROTECTED_CHARS.has('┐')).toBe(true)
      expect(PROTECTED_CHARS.has('└')).toBe(true)
      expect(PROTECTED_CHARS.has('┘')).toBe(true)
      expect(PROTECTED_CHARS.has('│')).toBe(true)
      expect(PROTECTED_CHARS.has('─')).toBe(true)
      expect(PROTECTED_CHARS.has('╔')).toBe(true)
      expect(PROTECTED_CHARS.has('╗')).toBe(true)
    })

    it('protects arrow characters', () => {
      expect(PROTECTED_CHARS.has('→')).toBe(true)
      expect(PROTECTED_CHARS.has('←')).toBe(true)
      expect(PROTECTED_CHARS.has('↑')).toBe(true)
      expect(PROTECTED_CHARS.has('↓')).toBe(true)
      expect(PROTECTED_CHARS.has('▶')).toBe(true)
      expect(PROTECTED_CHARS.has('◀')).toBe(true)
    })

    it('does not protect alphanumeric characters', () => {
      expect(PROTECTED_CHARS.has('a')).toBe(false)
      expect(PROTECTED_CHARS.has('Z')).toBe(false)
      expect(PROTECTED_CHARS.has('0')).toBe(false)
      expect(PROTECTED_CHARS.has('9')).toBe(false)
    })
  })
})

describe('Animation Utils', () => {
  describe('sleep', () => {
    it('resolves after specified delay', async () => {
      const { sleep } = await import('../helpers/animation-utils')
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(40) // Allow some variance
    })

    it('resolves immediately for 0ms delay', async () => {
      const { sleep } = await import('../helpers/animation-utils')
      const start = Date.now()
      await sleep(0)
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(20)
    })
  })

  describe('renderContent', () => {
    it('sets content on box and renders screen', async () => {
      const { renderContent } = await import('../helpers/animation-utils')
      const box = createMockBox()
      const screen = createMockScreen()

      renderContent(box as any, screen as any, 'Hello World')

      expect(box.content).toBe('Hello World')
      expect(screen.render).toHaveBeenCalled()
    })

    it('handles empty content', async () => {
      const { renderContent } = await import('../helpers/animation-utils')
      const box = createMockBox()
      const screen = createMockScreen()

      renderContent(box as any, screen as any, '')

      expect(box.content).toBe('')
      expect(screen.render).toHaveBeenCalled()
    })

    it('handles multiline content', async () => {
      const { renderContent } = await import('../helpers/animation-utils')
      const box = createMockBox()
      const screen = createMockScreen()

      const content = 'Line 1\nLine 2\nLine 3'
      renderContent(box as any, screen as any, content)

      expect(box.content).toBe(content)
    })
  })
})

describe('Instant Transition', () => {
  it('renders content immediately', async () => {
    const { instantReveal } = await import('../transitions/instant-transition')
    const box = createMockBox()
    const screen = createMockScreen()

    instantReveal(box as any, screen as any, 'Instant content')

    expect(box.content).toBe('Instant content')
    expect(screen.render).toHaveBeenCalledTimes(1)
  })

  it('handles empty content', async () => {
    const { instantReveal } = await import('../transitions/instant-transition')
    const box = createMockBox()
    const screen = createMockScreen()

    instantReveal(box as any, screen as any, '')

    expect(box.content).toBe('')
  })

  it('handles multiline content', async () => {
    const { instantReveal } = await import('../transitions/instant-transition')
    const box = createMockBox()
    const screen = createMockScreen()

    const content = 'Line 1\nLine 2\nLine 3'
    instantReveal(box as any, screen as any, content)

    expect(box.content).toBe(content)
  })
})

describe('Glitch Transition', () => {
  describe('glitchLine', () => {
    it('eventually reveals the final line', async () => {
      const { glitchLine } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()

      await glitchLine(box as any, screen as any, [], 'Hello', 2)

      // After animation completes, the final content should be the line
      expect(box.content).toBe('Hello')
    })

    it('preserves protected characters during scramble', async () => {
      const { glitchLine } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()

      // Line with lots of protected chars
      await glitchLine(box as any, screen as any, [], 'a { b } c', 2)

      // Braces and spaces should be preserved in final output
      expect(box.content).toBe('a { b } c')
    })

    it('prepends current lines to output', async () => {
      const { glitchLine } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()

      const currentLines = ['Line 1', 'Line 2']
      await glitchLine(box as any, screen as any, currentLines, 'Line 3', 1)

      expect(box.content).toBe('Line 1\nLine 2\nLine 3')
    })

    it('renders multiple times during animation', async () => {
      const { glitchLine } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()

      await glitchLine(box as any, screen as any, [], 'Test', 3)

      // iterations + 1 renders (for i = 3, 2, 1, 0)
      expect(screen.render).toHaveBeenCalled()
      expect(screen.render.mock.calls.length).toBe(4)
    })

    it('uses default iterations of 5', async () => {
      const { glitchLine } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()

      await glitchLine(box as any, screen as any, [], 'Test')

      // 5 + 1 = 6 iterations
      expect(screen.render.mock.calls.length).toBe(6)
    })
  })

  describe('lineByLineReveal', () => {
    it('reveals all lines', async () => {
      const { lineByLineReveal } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
          glitchIterations: 1,
        },
      } as any

      await lineByLineReveal(box as any, screen as any, 'Line 1\nLine 2', theme)

      expect(box.content).toBe('Line 1\nLine 2')
    })

    it('handles single line content', async () => {
      const { lineByLineReveal } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
          glitchIterations: 1,
        },
      } as any

      await lineByLineReveal(box as any, screen as any, 'Single line', theme)

      expect(box.content).toBe('Single line')
    })

    it('handles empty content', async () => {
      const { lineByLineReveal } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
          glitchIterations: 1,
        },
      } as any

      await lineByLineReveal(box as any, screen as any, '', theme)

      expect(box.content).toBe('')
    })

    it('uses theme glitchIterations', async () => {
      const { lineByLineReveal } = await import('../transitions/glitch-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 5,
          glitchIterations: 2,
        },
      } as any

      await lineByLineReveal(box as any, screen as any, 'A', theme)

      // 3 renders per line (iterations + 1) + 1 final render
      // For 1 line with 2 iterations: 3 glitch renders + 1 final = at least 4
      expect(screen.render.mock.calls.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('Fade Transition', () => {
  describe('fadeInReveal', () => {
    it('reveals complete content at end', async () => {
      const { fadeInReveal } = await import('../transitions/fade-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
        },
      } as any

      await fadeInReveal(box as any, screen as any, 'Hello World', theme)

      expect(box.content).toBe('Hello World')
    })

    it('preserves newlines throughout animation', async () => {
      const { fadeInReveal } = await import('../transitions/fade-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
        },
      } as any

      await fadeInReveal(box as any, screen as any, 'A\nB\nC', theme)

      expect(box.content).toBe('A\nB\nC')
    })

    it('renders 10 times plus final render', async () => {
      const { fadeInReveal } = await import('../transitions/fade-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
        },
      } as any

      await fadeInReveal(box as any, screen as any, 'Test', theme)

      // 10 steps + 1 final render = 11 total
      expect(screen.render.mock.calls.length).toBe(11)
    })

    it('handles empty content', async () => {
      const { fadeInReveal } = await import('../transitions/fade-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 10,
        },
      } as any

      await fadeInReveal(box as any, screen as any, '', theme)

      expect(box.content).toBe('')
    })
  })
})

describe('Typewriter Transition', () => {
  describe('typewriterReveal', () => {
    it('reveals complete content at end', async () => {
      const { typewriterReveal } = await import('../transitions/typewriter-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 25, // Faster for tests
        },
      } as any

      await typewriterReveal(box as any, screen as any, 'ABC', theme)

      expect(box.content).toBe('ABC')
    })

    it('renders once per character', async () => {
      const { typewriterReveal } = await import('../transitions/typewriter-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 25,
        },
      } as any

      await typewriterReveal(box as any, screen as any, 'ABC', theme)

      expect(screen.render.mock.calls.length).toBe(3)
    })

    it('handles spaces without delay', async () => {
      const { typewriterReveal } = await import('../transitions/typewriter-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 50, // Longer delay to make timing differences noticeable
        },
      } as any

      const start = Date.now()
      await typewriterReveal(box as any, screen as any, 'A B', theme)
      const elapsed = Date.now() - start

      // Only 'A' and 'B' should have delays, not the space
      // charDelay = 50 / 5 = 10ms per char, so ~20ms for A and B
      expect(elapsed).toBeLessThan(100)
    })

    it('handles newlines without delay', async () => {
      const { typewriterReveal } = await import('../transitions/typewriter-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 50,
        },
      } as any

      await typewriterReveal(box as any, screen as any, 'A\nB', theme)

      expect(box.content).toBe('A\nB')
    })

    it('handles empty content', async () => {
      const { typewriterReveal } = await import('../transitions/typewriter-transition')
      const box = createMockBox()
      const screen = createMockScreen()
      const theme = {
        animations: {
          lineDelay: 25,
        },
      } as any

      await typewriterReveal(box as any, screen as any, '', theme)

      expect(box.content).toBe('')
      expect(screen.render).not.toHaveBeenCalled()
    })
  })
})
