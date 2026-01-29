import { describe, it, expect } from 'vitest'
import { HexColorSchema, GradientSchema, ThemeSchema, ColorTokens, COLOR_TOKEN_PATTERN, PartialThemeSchema, DEFAULT_THEME, type Theme, type ColorToken, type PartialTheme, type DeepPartial } from '../theme'

describe('HexColorSchema', () => {
  it('accepts valid hex color #ff0066', () => {
    expect(() => HexColorSchema.parse('#ff0066')).not.toThrow()
    expect(HexColorSchema.parse('#ff0066')).toBe('#ff0066')
  })

  it('accepts valid hex color with uppercase letters', () => {
    expect(() => HexColorSchema.parse('#FF0066')).not.toThrow()
    expect(HexColorSchema.parse('#AABBCC')).toBe('#AABBCC')
  })

  it('accepts valid hex color with mixed case', () => {
    expect(() => HexColorSchema.parse('#aAbBcC')).not.toThrow()
  })

  it('rejects color name "red"', () => {
    const result = HexColorSchema.safeParse('red')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid hex color')
      expect(result.error.issues[0].message).toContain('#ff0066')
    }
  })

  it('rejects short hex "#fff"', () => {
    const result = HexColorSchema.safeParse('#fff')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid hex color')
    }
  })

  it('rejects invalid hex characters "#GGGGGG"', () => {
    const result = HexColorSchema.safeParse('#GGGGGG')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid hex color')
    }
  })

  it('rejects hex without # prefix', () => {
    const result = HexColorSchema.safeParse('ff0066')
    expect(result.success).toBe(false)
  })

  it('rejects 8-digit hex (with alpha)', () => {
    const result = HexColorSchema.safeParse('#ff006699')
    expect(result.success).toBe(false)
  })

  it('error message includes example of valid format', () => {
    const result = HexColorSchema.safeParse('invalid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('#ff0066')
    }
  })
})

describe('GradientSchema', () => {
  it('accepts valid gradient with 2 colors', () => {
    const gradient = ['#ff0000', '#00ff00']
    expect(() => GradientSchema.parse(gradient)).not.toThrow()
    expect(GradientSchema.parse(gradient)).toEqual(['#ff0000', '#00ff00'])
  })

  it('accepts gradient with 3+ colors', () => {
    const gradient = ['#ff0000', '#00ff00', '#0000ff']
    expect(() => GradientSchema.parse(gradient)).not.toThrow()
  })

  it('accepts gradient with many colors', () => {
    const gradient = ['#ff0000', '#ff6600', '#ffff00', '#00ff00', '#0000ff', '#6600ff']
    expect(() => GradientSchema.parse(gradient)).not.toThrow()
  })

  it('rejects single color array', () => {
    const result = GradientSchema.safeParse(['#ff0000'])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 2 colors')
    }
  })

  it('rejects empty array', () => {
    const result = GradientSchema.safeParse([])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 2 colors')
    }
  })

  it('rejects gradient with invalid hex color', () => {
    const result = GradientSchema.safeParse(['#ff0000', 'red'])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid hex color')
    }
  })

  it('rejects gradient with short hex', () => {
    const result = GradientSchema.safeParse(['#ff0000', '#fff'])
    expect(result.success).toBe(false)
  })

  it('validates each color in gradient', () => {
    const result = GradientSchema.safeParse(['invalid', 'also-invalid'])
    expect(result.success).toBe(false)
  })
})

describe('ThemeSchema', () => {
  // Valid minimal theme for testing
  const validMinimalTheme = {
    name: 'test',
    colors: {
      primary: '#ff0066',
      accent: '#00ff66',
      background: '#000000',
      text: '#ffffff',
      muted: '#666666',
    },
    gradients: {
      fire: ['#ff0000', '#ff6600'],
    },
    glyphs: '0123456789abcdef',
    animations: {
      revealSpeed: 1.0,
      matrixDensity: 50,
      glitchIterations: 5,
      lineDelay: 30,
      matrixInterval: 80,
    },
  }

  // Valid full theme with all optional fields
  const validFullTheme = {
    name: 'full-test',
    description: 'A test theme with all fields',
    author: 'Test Author',
    version: '1.0.0',
    colors: {
      primary: '#ff0066',
      secondary: '#0066ff',
      accent: '#00ff66',
      background: '#000000',
      text: '#ffffff',
      muted: '#666666',
      success: '#00cc00',
      warning: '#ffcc00',
      error: '#cc0000',
    },
    gradients: {
      fire: ['#ff0000', '#ff6600'],
      cool: ['#0066ff', '#00ccff', '#00ffcc'],
    },
    glyphs: '0123456789abcdefghijklmnop',
    animations: {
      revealSpeed: 1.5,
      matrixDensity: 75,
      glitchIterations: 10,
      lineDelay: 50,
      matrixInterval: 100,
    },
    window: {
      borderStyle: 'double' as const,
      shadow: false,
      padding: {
        top: 2,
        bottom: 2,
        left: 4,
        right: 4,
      },
    },
  }

  describe('accepts valid themes', () => {
    it('accepts valid minimal theme', () => {
      expect(() => ThemeSchema.parse(validMinimalTheme)).not.toThrow()
    })

    it('accepts valid full theme with all optional fields', () => {
      expect(() => ThemeSchema.parse(validFullTheme)).not.toThrow()
    })

    it('applies default values for animation settings', () => {
      const themeWithEmptyAnimations = {
        ...validMinimalTheme,
        animations: {},
      }
      const parsed = ThemeSchema.parse(themeWithEmptyAnimations)
      expect(parsed.animations.revealSpeed).toBe(1.0)
      expect(parsed.animations.matrixDensity).toBe(50)
      expect(parsed.animations.glitchIterations).toBe(5)
      expect(parsed.animations.lineDelay).toBe(30)
      expect(parsed.animations.matrixInterval).toBe(80)
    })

    it('applies default values for window settings', () => {
      const themeWithEmptyWindow = {
        ...validMinimalTheme,
        window: {},
      }
      const parsed = ThemeSchema.parse(themeWithEmptyWindow)
      expect(parsed.window?.borderStyle).toBe('line')
      expect(parsed.window?.shadow).toBe(true)
    })
  })

  describe('validates name field', () => {
    it('rejects missing name', () => {
      const { name, ...themeWithoutName } = validMinimalTheme
      const result = ThemeSchema.safeParse(themeWithoutName)
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const themeWithEmptyName = { ...validMinimalTheme, name: '' }
      const result = ThemeSchema.safeParse(themeWithEmptyName)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Theme name is required')
      }
    })
  })

  describe('validates colors field', () => {
    it('rejects missing required colors', () => {
      const themeWithMissingPrimary = {
        ...validMinimalTheme,
        colors: {
          accent: '#00ff66',
          background: '#000000',
          text: '#ffffff',
          muted: '#666666',
        },
      }
      const result = ThemeSchema.safeParse(themeWithMissingPrimary)
      expect(result.success).toBe(false)
    })

    it('rejects invalid hex color', () => {
      const themeWithInvalidColor = {
        ...validMinimalTheme,
        colors: {
          ...validMinimalTheme.colors,
          primary: 'red',
        },
      }
      const result = ThemeSchema.safeParse(themeWithInvalidColor)
      expect(result.success).toBe(false)
    })

    it('accepts optional colors', () => {
      const themeWithOptionalColors = {
        ...validMinimalTheme,
        colors: {
          ...validMinimalTheme.colors,
          secondary: '#0066ff',
          success: '#00cc00',
          warning: '#ffcc00',
          error: '#cc0000',
        },
      }
      expect(() => ThemeSchema.parse(themeWithOptionalColors)).not.toThrow()
    })
  })

  describe('validates gradients field', () => {
    it('rejects empty gradients object', () => {
      const themeWithNoGradients = {
        ...validMinimalTheme,
        gradients: {},
      }
      const result = ThemeSchema.safeParse(themeWithNoGradients)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one gradient must be defined')
      }
    })

    it('rejects gradient with single color', () => {
      const themeWithInvalidGradient = {
        ...validMinimalTheme,
        gradients: {
          fire: ['#ff0000'],
        },
      }
      const result = ThemeSchema.safeParse(themeWithInvalidGradient)
      expect(result.success).toBe(false)
    })

    it('accepts multiple gradients', () => {
      const themeWithMultipleGradients = {
        ...validMinimalTheme,
        gradients: {
          fire: ['#ff0000', '#ff6600'],
          cool: ['#0066ff', '#00ccff'],
          rainbow: ['#ff0000', '#ff6600', '#ffff00', '#00ff00', '#0066ff', '#6600ff'],
        },
      }
      expect(() => ThemeSchema.parse(themeWithMultipleGradients)).not.toThrow()
    })
  })

  describe('validates glyphs field', () => {
    it('rejects glyphs with less than 10 characters', () => {
      const themeWithShortGlyphs = {
        ...validMinimalTheme,
        glyphs: '012345678',
      }
      const result = ThemeSchema.safeParse(themeWithShortGlyphs)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters')
      }
    })

    it('accepts glyphs with exactly 10 characters', () => {
      const themeWith10Glyphs = {
        ...validMinimalTheme,
        glyphs: '0123456789',
      }
      expect(() => ThemeSchema.parse(themeWith10Glyphs)).not.toThrow()
    })

    it('accepts glyphs with unicode characters', () => {
      const themeWithUnicodeGlyphs = {
        ...validMinimalTheme,
        glyphs: 'ｱｲｳｴｵｶｷｸｹｺ',
      }
      expect(() => ThemeSchema.parse(themeWithUnicodeGlyphs)).not.toThrow()
    })
  })

  describe('validates animations field', () => {
    it('rejects revealSpeed below 0.1', () => {
      const themeWithLowSpeed = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, revealSpeed: 0.05 },
      }
      const result = ThemeSchema.safeParse(themeWithLowSpeed)
      expect(result.success).toBe(false)
    })

    it('rejects revealSpeed above 5.0', () => {
      const themeWithHighSpeed = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, revealSpeed: 6.0 },
      }
      const result = ThemeSchema.safeParse(themeWithHighSpeed)
      expect(result.success).toBe(false)
    })

    it('rejects matrixDensity below 10', () => {
      const themeWithLowDensity = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, matrixDensity: 5 },
      }
      const result = ThemeSchema.safeParse(themeWithLowDensity)
      expect(result.success).toBe(false)
    })

    it('rejects matrixDensity above 200', () => {
      const themeWithHighDensity = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, matrixDensity: 250 },
      }
      const result = ThemeSchema.safeParse(themeWithHighDensity)
      expect(result.success).toBe(false)
    })

    it('rejects glitchIterations below 1', () => {
      const themeWithZeroIterations = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, glitchIterations: 0 },
      }
      const result = ThemeSchema.safeParse(themeWithZeroIterations)
      expect(result.success).toBe(false)
    })

    it('rejects glitchIterations above 20', () => {
      const themeWithHighIterations = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, glitchIterations: 25 },
      }
      const result = ThemeSchema.safeParse(themeWithHighIterations)
      expect(result.success).toBe(false)
    })

    it('rejects lineDelay below 0', () => {
      const themeWithNegativeDelay = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, lineDelay: -10 },
      }
      const result = ThemeSchema.safeParse(themeWithNegativeDelay)
      expect(result.success).toBe(false)
    })

    it('rejects lineDelay above 500', () => {
      const themeWithHighDelay = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, lineDelay: 600 },
      }
      const result = ThemeSchema.safeParse(themeWithHighDelay)
      expect(result.success).toBe(false)
    })

    it('rejects matrixInterval below 20', () => {
      const themeWithLowInterval = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, matrixInterval: 10 },
      }
      const result = ThemeSchema.safeParse(themeWithLowInterval)
      expect(result.success).toBe(false)
    })

    it('rejects matrixInterval above 200', () => {
      const themeWithHighInterval = {
        ...validMinimalTheme,
        animations: { ...validMinimalTheme.animations, matrixInterval: 250 },
      }
      const result = ThemeSchema.safeParse(themeWithHighInterval)
      expect(result.success).toBe(false)
    })
  })

  describe('validates window field', () => {
    it('accepts valid borderStyle values', () => {
      const borderStyles = ['line', 'double', 'rounded', 'none'] as const
      for (const borderStyle of borderStyles) {
        const themeWithBorder = {
          ...validMinimalTheme,
          window: { borderStyle, shadow: true },
        }
        expect(() => ThemeSchema.parse(themeWithBorder)).not.toThrow()
      }
    })

    it('rejects invalid borderStyle value', () => {
      const themeWithInvalidBorder = {
        ...validMinimalTheme,
        window: { borderStyle: 'dashed', shadow: true },
      }
      const result = ThemeSchema.safeParse(themeWithInvalidBorder)
      expect(result.success).toBe(false)
    })

    it('validates padding constraints', () => {
      const themeWithInvalidPadding = {
        ...validMinimalTheme,
        window: {
          borderStyle: 'line' as const,
          shadow: true,
          padding: { top: 10, bottom: 1, left: 2, right: 2 },
        },
      }
      const result = ThemeSchema.safeParse(themeWithInvalidPadding)
      expect(result.success).toBe(false)
    })

    it('applies default padding values', () => {
      const themeWithEmptyPadding = {
        ...validMinimalTheme,
        window: {
          borderStyle: 'line' as const,
          shadow: true,
          padding: {},
        },
      }
      const parsed = ThemeSchema.parse(themeWithEmptyPadding)
      expect(parsed.window?.padding?.top).toBe(1)
      expect(parsed.window?.padding?.bottom).toBe(1)
      expect(parsed.window?.padding?.left).toBe(2)
      expect(parsed.window?.padding?.right).toBe(2)
    })
  })

  describe('type inference', () => {
    it('infers correct type from parsed theme', () => {
      const parsed: Theme = ThemeSchema.parse(validFullTheme)
      expect(parsed.name).toBe('full-test')
      expect(parsed.colors.primary).toBe('#ff0066')
      expect(parsed.gradients.fire).toEqual(['#ff0000', '#ff6600'])
    })
  })
})

describe('ColorTokens', () => {
  it('includes all required built-in color tokens', () => {
    expect(ColorTokens).toContain('GREEN')
    expect(ColorTokens).toContain('ORANGE')
    expect(ColorTokens).toContain('CYAN')
    expect(ColorTokens).toContain('PINK')
    expect(ColorTokens).toContain('WHITE')
    expect(ColorTokens).toContain('GRAY')
  })

  it('includes all required theme-mapped color tokens', () => {
    expect(ColorTokens).toContain('PRIMARY')
    expect(ColorTokens).toContain('SECONDARY')
    expect(ColorTokens).toContain('ACCENT')
    expect(ColorTokens).toContain('MUTED')
    expect(ColorTokens).toContain('TEXT')
    expect(ColorTokens).toContain('BACKGROUND')
  })

  it('has exactly 12 color tokens', () => {
    expect(ColorTokens.length).toBe(12)
  })

  it('is a const array (readonly)', () => {
    // This ensures TypeScript treats it as a tuple of literal types
    const firstToken: ColorToken = ColorTokens[0]
    expect(firstToken).toBe('GREEN')
  })
})

describe('COLOR_TOKEN_PATTERN', () => {
  it('matches {GREEN} token', () => {
    const text = 'Hello {GREEN}world{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{GREEN}', '{/}'])
  })

  it('matches {ORANGE} token', () => {
    const text = '{ORANGE}warning{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{ORANGE}', '{/}'])
  })

  it('matches {CYAN} token', () => {
    const text = '{CYAN}info{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{CYAN}', '{/}'])
  })

  it('matches {PINK} token', () => {
    const text = '{PINK}highlight{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{PINK}', '{/}'])
  })

  it('matches {WHITE} token', () => {
    const text = '{WHITE}text{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{WHITE}', '{/}'])
  })

  it('matches {GRAY} token', () => {
    const text = '{GRAY}muted text{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{GRAY}', '{/}'])
  })

  it('matches {PRIMARY} theme token', () => {
    const text = '{PRIMARY}main color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{PRIMARY}', '{/}'])
  })

  it('matches {SECONDARY} theme token', () => {
    const text = '{SECONDARY}secondary color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{SECONDARY}', '{/}'])
  })

  it('matches {ACCENT} theme token', () => {
    const text = '{ACCENT}accent color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{ACCENT}', '{/}'])
  })

  it('matches {MUTED} theme token', () => {
    const text = '{MUTED}muted color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{MUTED}', '{/}'])
  })

  it('matches {TEXT} theme token', () => {
    const text = '{TEXT}text color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{TEXT}', '{/}'])
  })

  it('matches {BACKGROUND} theme token', () => {
    const text = '{BACKGROUND}bg color{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{BACKGROUND}', '{/}'])
  })

  it('matches closing tag {/}', () => {
    const text = '{GREEN}text{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toContain('{/}')
  })

  it('matches multiple tokens in same string', () => {
    const text = '{GREEN}green{/} and {ORANGE}orange{/} text'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{GREEN}', '{/}', '{ORANGE}', '{/}'])
  })

  it('matches nested/adjacent tokens', () => {
    const text = '{PRIMARY}{ACCENT}double styled{/}{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{PRIMARY}', '{ACCENT}', '{/}', '{/}'])
  })

  it('does not match lowercase tokens', () => {
    const text = '{green}text{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{/}'])
  })

  it('does not match invalid tokens', () => {
    const text = '{RED}text{/} and {BLUE}more{/}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toEqual(['{/}', '{/}'])
  })

  it('does not match tokens without braces', () => {
    const text = 'GREEN text ORANGE more'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toBeNull()
  })

  it('does not match partial braces', () => {
    const text = '{GREEN text} and GREEN}'
    const matches = text.match(COLOR_TOKEN_PATTERN)
    expect(matches).toBeNull()
  })

  it('works with replaceAll for token processing', () => {
    const text = '{GREEN}hello{/}'
    const processed = text.replace(COLOR_TOKEN_PATTERN, (match, token) => {
      if (token === '/') return '{/}'
      return `{#00cc66-fg}`
    })
    expect(processed).toBe('{#00cc66-fg}hello{/}')
  })
})

describe('PartialThemeSchema', () => {
  describe('accepts partial theme objects', () => {
    it('accepts empty object', () => {
      const partial = {}
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts only name field', () => {
      const partial = { name: 'my-theme' }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts only colors field with partial colors', () => {
      const partial = {
        colors: {
          primary: '#ff0066',
        },
      }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts only gradients field', () => {
      const partial = {
        gradients: {
          fire: ['#ff0000', '#ff6600'],
        },
      }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts only animations field with partial values', () => {
      const partial = {
        animations: {
          revealSpeed: 2.0,
        },
      }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts only window field with partial values', () => {
      const partial = {
        window: {
          shadow: false,
        },
      }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })

    it('accepts deeply nested partial values', () => {
      const partial = {
        window: {
          padding: {
            top: 3,
          },
        },
      }
      expect(() => PartialThemeSchema.parse(partial)).not.toThrow()
    })
  })

  describe('can be used for theme extension', () => {
    it('allows overriding just primary color', () => {
      const baseTheme: Theme = {
        name: 'base',
        colors: {
          primary: '#000000',
          accent: '#111111',
          background: '#222222',
          text: '#333333',
          muted: '#444444',
        },
        gradients: { fire: ['#ff0000', '#ff6600'] },
        glyphs: '0123456789abcdef',
        animations: {
          revealSpeed: 1.0,
          matrixDensity: 50,
          glitchIterations: 5,
          lineDelay: 30,
          matrixInterval: 80,
        },
      }

      const overrides: PartialTheme = {
        colors: {
          primary: '#ff0066',
        },
      }

      // Verify overrides parse correctly
      expect(() => PartialThemeSchema.parse(overrides)).not.toThrow()

      // Simulate merge for theme extension
      const merged = {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...overrides.colors,
        },
      }

      expect(merged.colors.primary).toBe('#ff0066')
      expect(merged.colors.accent).toBe('#111111') // Preserved from base
    })

    it('allows adding new gradient', () => {
      const overrides: PartialTheme = {
        gradients: {
          cool: ['#0066ff', '#00ccff'],
        },
      }

      expect(() => PartialThemeSchema.parse(overrides)).not.toThrow()
    })

    it('allows overriding animation settings', () => {
      const overrides: PartialTheme = {
        animations: {
          revealSpeed: 2.5,
          matrixDensity: 100,
        },
      }

      expect(() => PartialThemeSchema.parse(overrides)).not.toThrow()
    })

    it('allows overriding window padding', () => {
      const overrides: PartialTheme = {
        window: {
          padding: {
            left: 4,
            right: 4,
          },
        },
      }

      expect(() => PartialThemeSchema.parse(overrides)).not.toThrow()
    })
  })

  describe('validates partial values against constraints', () => {
    it('still validates hex colors in partial theme', () => {
      const partial = {
        colors: {
          primary: 'red', // Invalid - should be hex
        },
      }

      const result = PartialThemeSchema.safeParse(partial)
      expect(result.success).toBe(false)
    })

    it('still validates gradient array min length', () => {
      const partial = {
        gradients: {
          fire: ['#ff0000'], // Invalid - needs 2+ colors
        },
      }

      const result = PartialThemeSchema.safeParse(partial)
      expect(result.success).toBe(false)
    })
  })

  describe('type compatibility', () => {
    it('PartialTheme type allows all optional fields', () => {
      const partial: PartialTheme = {}
      expect(partial).toEqual({})
    })

    it('PartialTheme type allows nested optional fields', () => {
      const partial: PartialTheme = {
        colors: {
          primary: '#ff0066',
        },
        animations: {
          revealSpeed: 2.0,
        },
      }

      expect(partial.colors?.primary).toBe('#ff0066')
      expect(partial.animations?.revealSpeed).toBe(2.0)
    })

    it('DeepPartial type works with nested objects', () => {
      type TestObj = { a: { b: { c: string } } }
      type PartialTestObj = DeepPartial<TestObj>

      const partial: PartialTestObj = { a: { b: {} } }
      expect(partial.a?.b).toEqual({})
    })
  })
})

describe('DEFAULT_THEME', () => {
  describe('passes ThemeSchema validation', () => {
    it('passes ThemeSchema.parse without throwing', () => {
      expect(() => ThemeSchema.parse(DEFAULT_THEME)).not.toThrow()
    })

    it('is a valid Theme type', () => {
      const theme: Theme = DEFAULT_THEME
      expect(theme).toBeDefined()
    })
  })

  describe('has correct name and metadata', () => {
    it('has name "matrix"', () => {
      expect(DEFAULT_THEME.name).toBe('matrix')
    })

    it('has description', () => {
      expect(DEFAULT_THEME.description).toBe('Default cyberpunk/matrix theme')
    })
  })

  describe('has correct colors', () => {
    it('has primary color #00cc66', () => {
      expect(DEFAULT_THEME.colors.primary).toBe('#00cc66')
    })

    it('has accent color #ff6600', () => {
      expect(DEFAULT_THEME.colors.accent).toBe('#ff6600')
    })

    it('has background color #0a0a0a', () => {
      expect(DEFAULT_THEME.colors.background).toBe('#0a0a0a')
    })

    it('has text color #ffffff', () => {
      expect(DEFAULT_THEME.colors.text).toBe('#ffffff')
    })

    it('has muted color #666666', () => {
      expect(DEFAULT_THEME.colors.muted).toBe('#666666')
    })
  })

  describe('has correct gradients', () => {
    it('has fire gradient', () => {
      expect(DEFAULT_THEME.gradients.fire).toEqual(['#ff6600', '#ff3300', '#ff0066'])
    })

    it('has cool gradient', () => {
      expect(DEFAULT_THEME.gradients.cool).toEqual(['#00ccff', '#0066ff', '#6600ff'])
    })

    it('has pink gradient', () => {
      expect(DEFAULT_THEME.gradients.pink).toEqual(['#ff0066', '#ff0099', '#cc00ff'])
    })

    it('has hf gradient', () => {
      expect(DEFAULT_THEME.gradients.hf).toEqual(['#99cc00', '#00cc66', '#00cccc'])
    })

    it('has 4 default gradients', () => {
      expect(Object.keys(DEFAULT_THEME.gradients)).toHaveLength(4)
    })
  })

  describe('has correct glyphs', () => {
    it('includes katakana characters', () => {
      expect(DEFAULT_THEME.glyphs).toContain('ｱ')
      expect(DEFAULT_THEME.glyphs).toContain('ｲ')
      expect(DEFAULT_THEME.glyphs).toContain('ｳ')
    })

    it('includes digits', () => {
      expect(DEFAULT_THEME.glyphs).toContain('0')
      expect(DEFAULT_THEME.glyphs).toContain('9')
    })

    it('has at least 10 characters', () => {
      expect(DEFAULT_THEME.glyphs.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('has correct animation settings', () => {
    it('has revealSpeed 1.0', () => {
      expect(DEFAULT_THEME.animations.revealSpeed).toBe(1.0)
    })

    it('has matrixDensity 50', () => {
      expect(DEFAULT_THEME.animations.matrixDensity).toBe(50)
    })

    it('has glitchIterations 5', () => {
      expect(DEFAULT_THEME.animations.glitchIterations).toBe(5)
    })

    it('has lineDelay 30', () => {
      expect(DEFAULT_THEME.animations.lineDelay).toBe(30)
    })

    it('has matrixInterval 80', () => {
      expect(DEFAULT_THEME.animations.matrixInterval).toBe(80)
    })
  })

  describe('has correct window settings', () => {
    it('has borderStyle "line"', () => {
      expect(DEFAULT_THEME.window?.borderStyle).toBe('line')
    })

    it('has shadow true', () => {
      expect(DEFAULT_THEME.window?.shadow).toBe(true)
    })

    it('has padding top 1', () => {
      expect(DEFAULT_THEME.window?.padding?.top).toBe(1)
    })

    it('has padding bottom 1', () => {
      expect(DEFAULT_THEME.window?.padding?.bottom).toBe(1)
    })

    it('has padding left 2', () => {
      expect(DEFAULT_THEME.window?.padding?.left).toBe(2)
    })

    it('has padding right 2', () => {
      expect(DEFAULT_THEME.window?.padding?.right).toBe(2)
    })
  })
})
