import { describe, it, expect } from 'vitest'
import { DeckConfigSchema, SettingsSchema, ExportSettingsSchema } from '../config'

// Valid theme for testing
const validTheme = {
  name: 'test-theme',
  colors: {
    primary: '#00cc66',
    accent: '#ff6600',
    background: '#0a0a0a',
    text: '#ffffff',
    muted: '#666666',
  },
  gradients: {
    fire: ['#ff6600', '#ff3300', '#ff0066'],
  },
  glyphs: '0123456789abcdef',
  animations: {},
}

describe('SettingsSchema', () => {
  describe('startSlide field', () => {
    it('defaults to 0', () => {
      const result = SettingsSchema.parse({})
      expect(result.startSlide).toBe(0)
    })

    it('accepts positive values', () => {
      const result = SettingsSchema.parse({ startSlide: 5 })
      expect(result.startSlide).toBe(5)
    })

    it('accepts 0', () => {
      const result = SettingsSchema.parse({ startSlide: 0 })
      expect(result.startSlide).toBe(0)
    })

    it('rejects negative values', () => {
      expect(() => SettingsSchema.parse({ startSlide: -1 })).toThrow()
    })
  })

  describe('loop field', () => {
    it('defaults to false', () => {
      const result = SettingsSchema.parse({})
      expect(result.loop).toBe(false)
    })

    it('accepts true', () => {
      const result = SettingsSchema.parse({ loop: true })
      expect(result.loop).toBe(true)
    })

    it('accepts false', () => {
      const result = SettingsSchema.parse({ loop: false })
      expect(result.loop).toBe(false)
    })
  })

  describe('autoAdvance field', () => {
    it('defaults to 0 (disabled)', () => {
      const result = SettingsSchema.parse({})
      expect(result.autoAdvance).toBe(0)
    })

    it('accepts positive values (ms)', () => {
      const result = SettingsSchema.parse({ autoAdvance: 5000 })
      expect(result.autoAdvance).toBe(5000)
    })

    it('accepts 0 (disabled)', () => {
      const result = SettingsSchema.parse({ autoAdvance: 0 })
      expect(result.autoAdvance).toBe(0)
    })

    it('rejects negative values', () => {
      expect(() => SettingsSchema.parse({ autoAdvance: -100 })).toThrow()
    })
  })

  describe('showSlideNumbers field', () => {
    it('defaults to false', () => {
      const result = SettingsSchema.parse({})
      expect(result.showSlideNumbers).toBe(false)
    })

    it('accepts true', () => {
      const result = SettingsSchema.parse({ showSlideNumbers: true })
      expect(result.showSlideNumbers).toBe(true)
    })
  })

  describe('showProgress field', () => {
    it('defaults to false', () => {
      const result = SettingsSchema.parse({})
      expect(result.showProgress).toBe(false)
    })

    it('accepts true', () => {
      const result = SettingsSchema.parse({ showProgress: true })
      expect(result.showProgress).toBe(true)
    })
  })

  describe('full settings object', () => {
    it('accepts all fields', () => {
      const settings = {
        startSlide: 2,
        loop: true,
        autoAdvance: 3000,
        showSlideNumbers: true,
        showProgress: true,
      }
      const result = SettingsSchema.parse(settings)
      expect(result).toEqual(settings)
    })

    it('applies all defaults for empty object', () => {
      const result = SettingsSchema.parse({})
      expect(result).toEqual({
        startSlide: 0,
        loop: false,
        autoAdvance: 0,
        showSlideNumbers: false,
        showProgress: false,
      })
    })
  })
})

describe('ExportSettingsSchema', () => {
  describe('width field', () => {
    it('defaults to 120', () => {
      const result = ExportSettingsSchema.parse({})
      expect(result.width).toBe(120)
    })

    it('accepts values at minimum (80)', () => {
      const result = ExportSettingsSchema.parse({ width: 80 })
      expect(result.width).toBe(80)
    })

    it('accepts values at maximum (400)', () => {
      const result = ExportSettingsSchema.parse({ width: 400 })
      expect(result.width).toBe(400)
    })

    it('accepts values in range', () => {
      const result = ExportSettingsSchema.parse({ width: 200 })
      expect(result.width).toBe(200)
    })

    it('rejects values below minimum', () => {
      expect(() => ExportSettingsSchema.parse({ width: 79 })).toThrow()
    })

    it('rejects values above maximum', () => {
      expect(() => ExportSettingsSchema.parse({ width: 401 })).toThrow()
    })
  })

  describe('height field', () => {
    it('defaults to 40', () => {
      const result = ExportSettingsSchema.parse({})
      expect(result.height).toBe(40)
    })

    it('accepts values at minimum (24)', () => {
      const result = ExportSettingsSchema.parse({ height: 24 })
      expect(result.height).toBe(24)
    })

    it('accepts values at maximum (100)', () => {
      const result = ExportSettingsSchema.parse({ height: 100 })
      expect(result.height).toBe(100)
    })

    it('accepts values in range', () => {
      const result = ExportSettingsSchema.parse({ height: 50 })
      expect(result.height).toBe(50)
    })

    it('rejects values below minimum', () => {
      expect(() => ExportSettingsSchema.parse({ height: 23 })).toThrow()
    })

    it('rejects values above maximum', () => {
      expect(() => ExportSettingsSchema.parse({ height: 101 })).toThrow()
    })
  })

  describe('fps field', () => {
    it('defaults to 30', () => {
      const result = ExportSettingsSchema.parse({})
      expect(result.fps).toBe(30)
    })

    it('accepts values at minimum (10)', () => {
      const result = ExportSettingsSchema.parse({ fps: 10 })
      expect(result.fps).toBe(10)
    })

    it('accepts values at maximum (60)', () => {
      const result = ExportSettingsSchema.parse({ fps: 60 })
      expect(result.fps).toBe(60)
    })

    it('accepts values in range', () => {
      const result = ExportSettingsSchema.parse({ fps: 24 })
      expect(result.fps).toBe(24)
    })

    it('rejects values below minimum', () => {
      expect(() => ExportSettingsSchema.parse({ fps: 9 })).toThrow()
    })

    it('rejects values above maximum', () => {
      expect(() => ExportSettingsSchema.parse({ fps: 61 })).toThrow()
    })
  })

  describe('full export settings object', () => {
    it('accepts all fields', () => {
      const exportSettings = {
        width: 160,
        height: 50,
        fps: 24,
      }
      const result = ExportSettingsSchema.parse(exportSettings)
      expect(result).toEqual(exportSettings)
    })

    it('applies all defaults for empty object', () => {
      const result = ExportSettingsSchema.parse({})
      expect(result).toEqual({
        width: 120,
        height: 40,
        fps: 30,
      })
    })
  })
})

describe('DeckConfigSchema', () => {
  describe('metadata fields', () => {
    it('accepts title', () => {
      const config = { title: 'My Presentation', theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.title).toBe('My Presentation')
    })

    it('accepts author', () => {
      const config = { author: 'John Doe', theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.author).toBe('John Doe')
    })

    it('accepts date', () => {
      const config = { date: '2024-01-15', theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.date).toBe('2024-01-15')
    })

    it('accepts all metadata fields together', () => {
      const config = {
        title: 'My Presentation',
        author: 'John Doe',
        date: '2024-01-15',
        theme: validTheme,
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.title).toBe('My Presentation')
      expect(result.author).toBe('John Doe')
      expect(result.date).toBe('2024-01-15')
    })

    it('all metadata fields are optional', () => {
      const config = { theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.title).toBeUndefined()
      expect(result.author).toBeUndefined()
      expect(result.date).toBeUndefined()
    })
  })

  describe('theme field', () => {
    it('theme is optional (uses themePreset or defaults)', () => {
      const config = { title: 'My Presentation' }
      // Theme is now optional - either themePreset or theme can be used
      expect(() => DeckConfigSchema.parse(config)).not.toThrow()
    })

    it('accepts valid theme', () => {
      const config = { theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.theme.name).toBe('test-theme')
    })

    it('rejects invalid theme', () => {
      const config = {
        theme: {
          name: 'invalid',
          colors: { primary: 'not-a-hex' },
        },
      }
      expect(() => DeckConfigSchema.parse(config)).toThrow()
    })

    it('applies theme defaults (animations)', () => {
      const config = { theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.theme.animations.revealSpeed).toBe(1.0)
      expect(result.theme.animations.matrixDensity).toBe(50)
      expect(result.theme.animations.glitchIterations).toBe(5)
      expect(result.theme.animations.lineDelay).toBe(30)
      expect(result.theme.animations.matrixInterval).toBe(80)
    })
  })

  describe('settings field', () => {
    it('accepts settings object', () => {
      const config = {
        theme: validTheme,
        settings: {
          startSlide: 1,
          loop: true,
        },
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.settings?.startSlide).toBe(1)
      expect(result.settings?.loop).toBe(true)
    })

    it('settings is optional', () => {
      const config = { theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.settings).toBeUndefined()
    })

    it('applies settings defaults when settings provided', () => {
      const config = {
        theme: validTheme,
        settings: { loop: true },
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.settings?.startSlide).toBe(0)
      expect(result.settings?.loop).toBe(true)
      expect(result.settings?.autoAdvance).toBe(0)
      expect(result.settings?.showSlideNumbers).toBe(false)
      expect(result.settings?.showProgress).toBe(false)
    })
  })

  describe('export field', () => {
    it('accepts export object', () => {
      const config = {
        theme: validTheme,
        export: {
          width: 160,
          height: 50,
          fps: 24,
        },
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.export?.width).toBe(160)
      expect(result.export?.height).toBe(50)
      expect(result.export?.fps).toBe(24)
    })

    it('export is optional', () => {
      const config = { theme: validTheme }
      const result = DeckConfigSchema.parse(config)
      expect(result.export).toBeUndefined()
    })

    it('applies export defaults when export provided', () => {
      const config = {
        theme: validTheme,
        export: { fps: 24 },
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.export?.width).toBe(120)
      expect(result.export?.height).toBe(40)
      expect(result.export?.fps).toBe(24)
    })

    it('validates export constraints', () => {
      const config = {
        theme: validTheme,
        export: { width: 50 }, // Below minimum of 80
      }
      expect(() => DeckConfigSchema.parse(config)).toThrow()
    })
  })

  describe('full deck configuration', () => {
    it('accepts minimal config (theme only)', () => {
      const config = { theme: validTheme }
      expect(() => DeckConfigSchema.parse(config)).not.toThrow()
    })

    it('accepts full config with all fields', () => {
      const config = {
        title: 'My Presentation',
        author: 'John Doe',
        date: '2024-01-15',
        theme: validTheme,
        settings: {
          startSlide: 0,
          loop: true,
          autoAdvance: 5000,
          showSlideNumbers: true,
          showProgress: true,
        },
        export: {
          width: 160,
          height: 50,
          fps: 24,
        },
      }
      const result = DeckConfigSchema.parse(config)
      expect(result.title).toBe('My Presentation')
      expect(result.author).toBe('John Doe')
      expect(result.date).toBe('2024-01-15')
      expect(result.theme.name).toBe('test-theme')
      expect(result.settings?.loop).toBe(true)
      expect(result.export?.fps).toBe(24)
    })
  })
})
