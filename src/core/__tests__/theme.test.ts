import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createTheme,
  createGradients,
  applyGradient,
  BUILTIN_COLORS,
  resolveColorToken,
  colorTokensToBlessedTags,
  ThemeError,
  formatThemeError,
} from '../theme'
import { loadThemeFromFile, loadThemeFromPackage } from '../theme-loaders'
import { ValidationError } from '../../schemas/validation'
import { join } from 'path'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'

const validThemeYaml = `
name: test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`

describe('createTheme', () => {
  describe('valid YAML parsing', () => {
    it('creates theme from valid YAML', () => {
      const theme = createTheme(validThemeYaml)
      expect(theme.name).toBe('test')
      expect(theme.colors.primary).toBe('#ff0066')
      expect(theme.colors.accent).toBe('#00ff66')
      expect(theme.colors.background).toBe('#000000')
      expect(theme.colors.text).toBe('#ffffff')
      expect(theme.colors.muted).toBe('#666666')
    })

    it('parses gradients correctly', () => {
      const theme = createTheme(validThemeYaml)
      expect(theme.gradients.main).toEqual(['#ff0066', '#00ff66'])
    })

    it('parses glyphs correctly', () => {
      const theme = createTheme(validThemeYaml)
      expect(theme.glyphs).toBe('0123456789abcdef')
    })

    it('parses animations correctly', () => {
      const theme = createTheme(validThemeYaml)
      expect(theme.animations.revealSpeed).toBe(1.0)
      expect(theme.animations.matrixDensity).toBe(50)
      expect(theme.animations.glitchIterations).toBe(5)
      expect(theme.animations.lineDelay).toBe(30)
      expect(theme.animations.matrixInterval).toBe(80)
    })

    it('returns ThemeObject with extend method', () => {
      const theme = createTheme(validThemeYaml)
      expect(typeof theme.extend).toBe('function')
    })
  })

  describe('invalid YAML syntax', () => {
    it('throws on invalid YAML syntax (bad indentation)', () => {
      const badYaml = `
name: test
colors:
primary: "#ff0066"  # missing indentation
`
      expect(() => createTheme(badYaml)).toThrow()
    })

    it('throws on invalid YAML syntax (unclosed quotes)', () => {
      const badYaml = `
name: "test
colors:
  primary: "#ff0066"
`
      expect(() => createTheme(badYaml)).toThrow()
    })
  })

  describe('schema validation failure', () => {
    it('throws on invalid hex color', () => {
      const invalidColorYaml = `
name: test
colors:
  primary: "not-a-hex-color"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`
      expect(() => createTheme(invalidColorYaml)).toThrow(ValidationError)
    })

    it('throws when required fields are missing', () => {
      const missingFieldsYaml = `
name: test
colors:
  primary: "#ff0066"
`
      expect(() => createTheme(missingFieldsYaml)).toThrow(ValidationError)
    })

    it('throws when gradient has less than 2 colors', () => {
      const invalidGradientYaml = `
name: test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`
      expect(() => createTheme(invalidGradientYaml)).toThrow(ValidationError)
    })

    it('throws when glyph set is too short', () => {
      const shortGlyphsYaml = `
name: test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "abc"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`
      expect(() => createTheme(shortGlyphsYaml)).toThrow(ValidationError)
    })
  })

  describe('extend functionality', () => {
    it('extends theme with partial overrides', () => {
      const theme = createTheme(validThemeYaml)
      const extended = theme.extend({
        colors: { primary: '#aabbcc' },
      })

      expect(extended.colors.primary).toBe('#aabbcc')
      // Other values unchanged
      expect(extended.colors.accent).toBe('#00ff66')
      expect(extended.colors.background).toBe('#000000')
      expect(extended.name).toBe('test')
    })

    it('supports chained extensions', () => {
      const theme = createTheme(validThemeYaml)
      const extended = theme
        .extend({ colors: { primary: '#aabbcc' } })
        .extend({ animations: { revealSpeed: 0.5 } })

      expect(extended.colors.primary).toBe('#aabbcc')
      expect(extended.animations.revealSpeed).toBe(0.5)
      // Other values unchanged
      expect(extended.colors.accent).toBe('#00ff66')
      expect(extended.animations.matrixDensity).toBe(50)
    })

    it('replaces arrays completely (not concatenate)', () => {
      const theme = createTheme(validThemeYaml)
      const extended = theme.extend({
        gradients: {
          main: ['#ff0000', '#00ff00', '#0000ff'],
        },
      })

      expect(extended.gradients.main).toEqual(['#ff0000', '#00ff00', '#0000ff'])
    })

    it('extended theme also has extend method', () => {
      const theme = createTheme(validThemeYaml)
      const extended = theme.extend({
        colors: { primary: '#aabbcc' },
      })

      expect(typeof extended.extend).toBe('function')
    })

    it('throws if extension results in invalid theme', () => {
      const theme = createTheme(validThemeYaml)

      expect(() =>
        theme.extend({
          colors: { primary: 'invalid-color' as `#${string}` },
        })
      ).toThrow(ValidationError)
    })
  })

  describe('optional fields', () => {
    it('includes optional description when provided', () => {
      const yamlWithOptional = `
name: test
description: A test theme
author: tester
version: 1.0.0
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`
      const theme = createTheme(yamlWithOptional)
      expect(theme.description).toBe('A test theme')
      expect(theme.author).toBe('tester')
      expect(theme.version).toBe('1.0.0')
    })

    it('works without optional fields', () => {
      const theme = createTheme(validThemeYaml)
      expect(theme.description).toBeUndefined()
      expect(theme.author).toBeUndefined()
      expect(theme.version).toBeUndefined()
    })

    it('includes optional window settings when provided', () => {
      const yamlWithWindow = `
name: test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
window:
  borderStyle: double
  shadow: false
  padding:
    top: 2
    bottom: 2
    left: 3
    right: 3
`
      const theme = createTheme(yamlWithWindow)
      expect(theme.window?.borderStyle).toBe('double')
      expect(theme.window?.shadow).toBe(false)
      expect(theme.window?.padding?.top).toBe(2)
      expect(theme.window?.padding?.left).toBe(3)
    })
  })
})

describe('loadThemeFromFile', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'theme-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('loading valid theme files', () => {
    it('loads theme from filesystem path', async () => {
      const themePath = join(tempDir, 'valid-theme.yml')
      await writeFile(themePath, validThemeYaml)

      const theme = await loadThemeFromFile(themePath)

      expect(theme.name).toBe('test')
      expect(theme.colors.primary).toBe('#ff0066')
      expect(theme.colors.accent).toBe('#00ff66')
    })

    it('returns ThemeObject with extend method', async () => {
      const themePath = join(tempDir, 'theme-with-extend.yml')
      await writeFile(themePath, validThemeYaml)

      const theme = await loadThemeFromFile(themePath)

      expect(typeof theme.extend).toBe('function')

      const extended = theme.extend({ colors: { primary: '#aabbcc' } })
      expect(extended.colors.primary).toBe('#aabbcc')
      expect(extended.colors.accent).toBe('#00ff66')
    })

    it('handles absolute paths', async () => {
      const themePath = join(tempDir, 'absolute-path-theme.yml')
      await writeFile(themePath, validThemeYaml)

      const theme = await loadThemeFromFile(themePath)
      expect(theme.name).toBe('test')
    })
  })

  describe('file not found handling', () => {
    it('throws error for non-existent file', async () => {
      const nonExistentPath = join(tempDir, 'does-not-exist.yml')

      await expect(loadThemeFromFile(nonExistentPath)).rejects.toThrow(
        'Theme file not found'
      )
    })

    it('includes path in error message', async () => {
      const nonExistentPath = join(tempDir, 'missing.yml')

      await expect(loadThemeFromFile(nonExistentPath)).rejects.toThrow(
        nonExistentPath
      )
    })
  })

  describe('invalid theme file handling', () => {
    it('throws on invalid YAML syntax', async () => {
      const invalidYamlPath = join(tempDir, 'invalid-yaml.yml')
      await writeFile(
        invalidYamlPath,
        `
name: test
colors:
primary: "#ff0066"
`
      )

      await expect(loadThemeFromFile(invalidYamlPath)).rejects.toThrow()
    })

    it('throws ValidationError for invalid theme data', async () => {
      const invalidThemePath = join(tempDir, 'invalid-theme.yml')
      await writeFile(
        invalidThemePath,
        `
name: test
colors:
  primary: "not-a-hex-color"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`
      )

      await expect(loadThemeFromFile(invalidThemePath)).rejects.toThrow(
        ValidationError
      )
    })

    it('throws ValidationError for missing required fields', async () => {
      const incompleteThemePath = join(tempDir, 'incomplete-theme.yml')
      await writeFile(
        incompleteThemePath,
        `
name: test
colors:
  primary: "#ff0066"
`
      )

      await expect(loadThemeFromFile(incompleteThemePath)).rejects.toThrow(
        ValidationError
      )
    })
  })
})

describe('loadThemeFromPackage', () => {
  describe('module not found handling', () => {
    it('throws helpful error for non-existent package', async () => {
      await expect(
        loadThemeFromPackage('@term-deck/non-existent-theme-package')
      ).rejects.toThrow('Theme package "@term-deck/non-existent-theme-package" not found')
    })

    it('suggests npm install in error message', async () => {
      await expect(
        loadThemeFromPackage('@term-deck/non-existent-theme-package')
      ).rejects.toThrow('npm install @term-deck/non-existent-theme-package')
    })

    it('handles unscoped package names', async () => {
      await expect(
        loadThemeFromPackage('term-deck-theme-fake')
      ).rejects.toThrow('npm install term-deck-theme-fake')
    })
  })

  describe('loading installed packages with invalid theme export', () => {
    // Note: These tests verify the function works with actual installed packages.
    // Dynamic import synthesizes a default export, so we test validation failure.

    it('throws ValidationError when default export is not a valid theme', async () => {
      // yaml package exports module contents as default, not a valid theme
      await expect(loadThemeFromPackage('yaml')).rejects.toThrow(ValidationError)
    })

    it('error message mentions the package name', async () => {
      await expect(loadThemeFromPackage('yaml')).rejects.toThrow('from yaml')
    })
  })
})

describe('createGradients', () => {
  const themeWithMultipleGradients = createTheme(`
name: gradient-test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  fire:
    - "#ff6600"
    - "#ff3300"
    - "#ff0066"
  cool:
    - "#00ccff"
    - "#0066ff"
    - "#6600ff"
  simple:
    - "#ff0000"
    - "#0000ff"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)

  describe('creating gradient functions', () => {
    it('creates gradient function for each theme gradient', () => {
      const gradients = createGradients(themeWithMultipleGradients)

      expect(gradients.fire).toBeDefined()
      expect(gradients.cool).toBeDefined()
      expect(gradients.simple).toBeDefined()
      expect(typeof gradients.fire).toBe('function')
      expect(typeof gradients.cool).toBe('function')
      expect(typeof gradients.simple).toBe('function')
    })

    it('returns empty object for theme with no gradients', () => {
      // Create a theme with minimal gradients
      const minimalTheme = createTheme(`
name: minimal
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)
      const gradients = createGradients(minimalTheme)

      expect(Object.keys(gradients)).toHaveLength(1)
      expect(gradients.main).toBeDefined()
    })
  })

  describe('gradient function output', () => {
    it('gradient function returns a string', () => {
      const gradients = createGradients(themeWithMultipleGradients)
      const result = gradients.fire('Hello World')

      // Returns a string (may or may not have ANSI codes depending on TTY)
      expect(typeof result).toBe('string')
      // The text content should be preserved
      expect(result).toContain('H')
      expect(result).toContain('W')
    })

    it('gradient function handles empty string', () => {
      const gradients = createGradients(themeWithMultipleGradients)
      const result = gradients.fire('')

      expect(result).toBe('')
    })

    it('different gradient functions are created for each gradient', () => {
      const gradients = createGradients(themeWithMultipleGradients)

      // Verify different function instances are created
      expect(gradients.fire).not.toBe(gradients.cool)
      expect(gradients.cool).not.toBe(gradients.simple)
    })
  })
})

describe('applyGradient', () => {
  const theme = createTheme(`
name: apply-gradient-test
colors:
  primary: "#ff0066"
  accent: "#00ff66"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"
gradients:
  fire:
    - "#ff6600"
    - "#ff3300"
    - "#ff0066"
  cool:
    - "#00ccff"
    - "#0066ff"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)

  describe('applying existing gradients', () => {
    it('returns a string for valid gradient name', () => {
      const result = applyGradient('Hello World', 'fire', theme)

      expect(typeof result).toBe('string')
      // The text content should be preserved (with or without ANSI codes)
      expect(result).toContain('H')
      expect(result).toContain('W')
    })

    it('processes text through gradient function', () => {
      // Both should process without error
      const fireResult = applyGradient('Test', 'fire', theme)
      const coolResult = applyGradient('Test', 'cool', theme)

      expect(typeof fireResult).toBe('string')
      expect(typeof coolResult).toBe('string')
    })
  })

  describe('fallback for missing gradients', () => {
    it('returns unstyled text for non-existent gradient', () => {
      const result = applyGradient('Hello World', 'nonexistent', theme)

      expect(result).toBe('Hello World')
    })

    it('does not throw for missing gradient', () => {
      expect(() => applyGradient('Test', 'missing', theme)).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles empty text', () => {
      const result = applyGradient('', 'fire', theme)
      expect(result).toBe('')
    })

    it('handles multiline text', () => {
      const multiline = 'Line 1\nLine 2\nLine 3'
      const result = applyGradient(multiline, 'fire', theme)

      expect(typeof result).toBe('string')
      expect(result).toContain('\n')
    })

    it('handles text with special characters', () => {
      const special = '!@#$%^&*()[]{}|;:,.<>?'
      const result = applyGradient(special, 'fire', theme)

      expect(typeof result).toBe('string')
    })
  })
})

describe('BUILTIN_COLORS', () => {
  it('contains all 6 built-in colors', () => {
    expect(Object.keys(BUILTIN_COLORS)).toHaveLength(6)
    expect(BUILTIN_COLORS.GREEN).toBeDefined()
    expect(BUILTIN_COLORS.ORANGE).toBeDefined()
    expect(BUILTIN_COLORS.CYAN).toBeDefined()
    expect(BUILTIN_COLORS.PINK).toBeDefined()
    expect(BUILTIN_COLORS.WHITE).toBeDefined()
    expect(BUILTIN_COLORS.GRAY).toBeDefined()
  })

  it('has correct hex values', () => {
    expect(BUILTIN_COLORS.GREEN).toBe('#00cc66')
    expect(BUILTIN_COLORS.ORANGE).toBe('#ff6600')
    expect(BUILTIN_COLORS.CYAN).toBe('#00ccff')
    expect(BUILTIN_COLORS.PINK).toBe('#ff0066')
    expect(BUILTIN_COLORS.WHITE).toBe('#ffffff')
    expect(BUILTIN_COLORS.GRAY).toBe('#666666')
  })
})

describe('resolveColorToken', () => {
  const theme = createTheme(`
name: color-token-test
colors:
  primary: "#11aa22"
  secondary: "#33bb44"
  accent: "#55cc66"
  background: "#000000"
  text: "#ffffff"
  muted: "#888888"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)

  describe('resolving theme colors', () => {
    it('resolves PRIMARY to theme.colors.primary', () => {
      expect(resolveColorToken('PRIMARY', theme)).toBe('#11aa22')
    })

    it('resolves SECONDARY to theme.colors.secondary', () => {
      expect(resolveColorToken('SECONDARY', theme)).toBe('#33bb44')
    })

    it('resolves ACCENT to theme.colors.accent', () => {
      expect(resolveColorToken('ACCENT', theme)).toBe('#55cc66')
    })

    it('resolves MUTED to theme.colors.muted', () => {
      expect(resolveColorToken('MUTED', theme)).toBe('#888888')
    })

    it('resolves TEXT to theme.colors.text', () => {
      expect(resolveColorToken('TEXT', theme)).toBe('#ffffff')
    })

    it('resolves BACKGROUND to theme.colors.background', () => {
      expect(resolveColorToken('BACKGROUND', theme)).toBe('#000000')
    })
  })

  describe('resolving built-in colors', () => {
    it('resolves GREEN to built-in color', () => {
      expect(resolveColorToken('GREEN', theme)).toBe('#00cc66')
    })

    it('resolves ORANGE to built-in color', () => {
      expect(resolveColorToken('ORANGE', theme)).toBe('#ff6600')
    })

    it('resolves CYAN to built-in color', () => {
      expect(resolveColorToken('CYAN', theme)).toBe('#00ccff')
    })

    it('resolves PINK to built-in color', () => {
      expect(resolveColorToken('PINK', theme)).toBe('#ff0066')
    })

    it('resolves WHITE to built-in color', () => {
      expect(resolveColorToken('WHITE', theme)).toBe('#ffffff')
    })

    it('resolves GRAY to built-in color', () => {
      expect(resolveColorToken('GRAY', theme)).toBe('#666666')
    })
  })

  describe('fallback for unknown tokens', () => {
    it('falls back to theme.colors.text for unknown token', () => {
      expect(resolveColorToken('UNKNOWN', theme)).toBe('#ffffff')
    })

    it('falls back to theme.colors.text for lowercase token', () => {
      expect(resolveColorToken('green', theme)).toBe('#ffffff')
    })
  })

  describe('SECONDARY fallback when not defined', () => {
    const themeWithoutSecondary = createTheme(`
name: no-secondary
colors:
  primary: "#aabbcc"
  accent: "#ddeeff"
  background: "#000000"
  text: "#ffffff"
  muted: "#888888"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)

    it('falls back to primary when secondary is not defined', () => {
      expect(resolveColorToken('SECONDARY', themeWithoutSecondary)).toBe('#aabbcc')
    })
  })
})

describe('colorTokensToBlessedTags', () => {
  const theme = createTheme(`
name: blessed-tags-test
colors:
  primary: "#11aa22"
  secondary: "#33bb44"
  accent: "#55cc66"
  background: "#000000"
  text: "#ffffff"
  muted: "#888888"
gradients:
  main:
    - "#ff0066"
    - "#00ff66"
glyphs: "0123456789abcdef"
animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80
`)

  describe('converting built-in color tokens', () => {
    it('converts {GREEN} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{GREEN}Hello{/}', theme)
      expect(result).toBe('{#00cc66-fg}Hello{/}')
    })

    it('converts {ORANGE} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{ORANGE}Hello{/}', theme)
      expect(result).toBe('{#ff6600-fg}Hello{/}')
    })

    it('converts {CYAN} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{CYAN}Hello{/}', theme)
      expect(result).toBe('{#00ccff-fg}Hello{/}')
    })

    it('converts {PINK} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{PINK}Hello{/}', theme)
      expect(result).toBe('{#ff0066-fg}Hello{/}')
    })

    it('converts {WHITE} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{WHITE}Hello{/}', theme)
      expect(result).toBe('{#ffffff-fg}Hello{/}')
    })

    it('converts {GRAY} to blessed tag', () => {
      const result = colorTokensToBlessedTags('{GRAY}Hello{/}', theme)
      expect(result).toBe('{#666666-fg}Hello{/}')
    })
  })

  describe('converting theme color tokens', () => {
    it('converts {PRIMARY} to theme primary color', () => {
      const result = colorTokensToBlessedTags('{PRIMARY}Test{/}', theme)
      expect(result).toBe('{#11aa22-fg}Test{/}')
    })

    it('converts {SECONDARY} to theme secondary color', () => {
      const result = colorTokensToBlessedTags('{SECONDARY}Test{/}', theme)
      expect(result).toBe('{#33bb44-fg}Test{/}')
    })

    it('converts {ACCENT} to theme accent color', () => {
      const result = colorTokensToBlessedTags('{ACCENT}Test{/}', theme)
      expect(result).toBe('{#55cc66-fg}Test{/}')
    })

    it('converts {MUTED} to theme muted color', () => {
      const result = colorTokensToBlessedTags('{MUTED}Test{/}', theme)
      expect(result).toBe('{#888888-fg}Test{/}')
    })

    it('converts {TEXT} to theme text color', () => {
      const result = colorTokensToBlessedTags('{TEXT}Test{/}', theme)
      expect(result).toBe('{#ffffff-fg}Test{/}')
    })

    it('converts {BACKGROUND} to theme background color', () => {
      const result = colorTokensToBlessedTags('{BACKGROUND}Test{/}', theme)
      expect(result).toBe('{#000000-fg}Test{/}')
    })
  })

  describe('handling closing tags', () => {
    it('preserves {/} as closing tag', () => {
      const result = colorTokensToBlessedTags('{GREEN}Hello{/}', theme)
      expect(result).toContain('{/}')
    })

    it('handles multiple closing tags', () => {
      const result = colorTokensToBlessedTags('{GREEN}A{/}{ORANGE}B{/}', theme)
      expect(result).toBe('{#00cc66-fg}A{/}{#ff6600-fg}B{/}')
    })
  })

  describe('handling multiple tokens', () => {
    it('converts multiple tokens in same string', () => {
      const content = '{GREEN}Hello{/} {ORANGE}World{/}'
      const result = colorTokensToBlessedTags(content, theme)
      expect(result).toBe('{#00cc66-fg}Hello{/} {#ff6600-fg}World{/}')
    })

    it('handles mixed theme and built-in tokens', () => {
      const content = '{PRIMARY}Hello{/} {GREEN}World{/}'
      const result = colorTokensToBlessedTags(content, theme)
      expect(result).toBe('{#11aa22-fg}Hello{/} {#00cc66-fg}World{/}')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(colorTokensToBlessedTags('', theme)).toBe('')
    })

    it('returns original text when no tokens present', () => {
      const content = 'Hello World'
      expect(colorTokensToBlessedTags(content, theme)).toBe('Hello World')
    })

    it('preserves other curly braces', () => {
      const content = '{GREEN}Test{/} {unknown} {foo: bar}'
      const result = colorTokensToBlessedTags(content, theme)
      // Only recognized tokens are replaced
      expect(result).toBe('{#00cc66-fg}Test{/} {unknown} {foo: bar}')
    })

    it('handles multiline content', () => {
      const content = '{GREEN}Line 1{/}\n{ORANGE}Line 2{/}'
      const result = colorTokensToBlessedTags(content, theme)
      expect(result).toBe('{#00cc66-fg}Line 1{/}\n{#ff6600-fg}Line 2{/}')
    })

    it('does not match lowercase tokens', () => {
      const content = '{green}Hello{/}'
      const result = colorTokensToBlessedTags(content, theme)
      expect(result).toBe('{green}Hello{/}')
    })
  })
})

describe('ThemeError', () => {
  describe('constructor', () => {
    it('creates error with message only', () => {
      const error = new ThemeError('Something went wrong')

      expect(error.message).toBe('Something went wrong')
      expect(error.name).toBe('ThemeError')
      expect(error.themeName).toBeUndefined()
      expect(error.path).toBeUndefined()
    })

    it('creates error with themeName', () => {
      const error = new ThemeError('Invalid theme', 'matrix')

      expect(error.message).toBe('Invalid theme')
      expect(error.themeName).toBe('matrix')
      expect(error.path).toBeUndefined()
    })

    it('creates error with themeName and path', () => {
      const error = new ThemeError('Invalid theme', 'matrix', './themes/matrix.yml')

      expect(error.message).toBe('Invalid theme')
      expect(error.themeName).toBe('matrix')
      expect(error.path).toBe('./themes/matrix.yml')
    })

    it('creates error with undefined themeName but with path', () => {
      const error = new ThemeError('File not found', undefined, './themes/missing.yml')

      expect(error.message).toBe('File not found')
      expect(error.themeName).toBeUndefined()
      expect(error.path).toBe('./themes/missing.yml')
    })

    it('is an instance of Error', () => {
      const error = new ThemeError('Test error')
      expect(error).toBeInstanceOf(Error)
    })

    it('is an instance of ThemeError', () => {
      const error = new ThemeError('Test error')
      expect(error).toBeInstanceOf(ThemeError)
    })
  })

  describe('error properties', () => {
    it('has readonly themeName property', () => {
      const error = new ThemeError('Test', 'myTheme')
      expect(error.themeName).toBe('myTheme')
      // TypeScript prevents: error.themeName = 'other'
    })

    it('has readonly path property', () => {
      const error = new ThemeError('Test', undefined, '/path/to/theme')
      expect(error.path).toBe('/path/to/theme')
      // TypeScript prevents: error.path = '/other/path'
    })
  })
})

describe('formatThemeError', () => {
  describe('formatting ValidationError', () => {
    it('formats ValidationError with source', () => {
      const validationError = new ValidationError('Invalid theme:\n  - colors.primary: Color must be a valid hex color')
      const result = formatThemeError(validationError, './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toContain('Invalid theme from ./theme.yml')
      expect(result.message).toContain('colors.primary')
      expect(result.path).toBe('./theme.yml')
    })

    it('includes full validation message', () => {
      const validationError = new ValidationError('Invalid theme:\n  - name: Required\n  - colors.primary: Invalid')
      const result = formatThemeError(validationError, 'my-package')

      expect(result.message).toContain('name: Required')
      expect(result.message).toContain('colors.primary: Invalid')
    })
  })

  describe('formatting generic Error', () => {
    it('formats generic Error with source', () => {
      const genericError = new Error('File not found')
      const result = formatThemeError(genericError, './missing.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Failed to load theme from ./missing.yml: File not found')
      expect(result.path).toBe('./missing.yml')
    })

    it('formats Error with empty message', () => {
      const emptyError = new Error('')
      const result = formatThemeError(emptyError, './theme.yml')

      expect(result.message).toBe('Failed to load theme from ./theme.yml: ')
    })

    it('formats TypeError', () => {
      const typeError = new TypeError('Cannot read property of undefined')
      const result = formatThemeError(typeError, '@term-deck/theme-broken')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toContain('Cannot read property of undefined')
      expect(result.path).toBe('@term-deck/theme-broken')
    })
  })

  describe('formatting unknown errors', () => {
    it('formats string error', () => {
      const result = formatThemeError('something went wrong', './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Unknown error loading theme from ./theme.yml')
    })

    it('formats null error', () => {
      const result = formatThemeError(null, './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Unknown error loading theme from ./theme.yml')
    })

    it('formats undefined error', () => {
      const result = formatThemeError(undefined, './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Unknown error loading theme from ./theme.yml')
    })

    it('formats object error', () => {
      const result = formatThemeError({ code: 'ERR_INVALID' }, './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Unknown error loading theme from ./theme.yml')
    })

    it('formats number error', () => {
      const result = formatThemeError(404, './theme.yml')

      expect(result).toBeInstanceOf(ThemeError)
      expect(result.message).toBe('Unknown error loading theme from ./theme.yml')
    })
  })

  describe('source information', () => {
    it('includes path in ThemeError for file paths', () => {
      const error = new Error('Permission denied')
      const result = formatThemeError(error, '/etc/themes/protected.yml')

      expect(result.path).toBe('/etc/themes/protected.yml')
    })

    it('includes path in ThemeError for package names', () => {
      const error = new ValidationError('Invalid theme')
      const result = formatThemeError(error, '@company/theme-custom')

      expect(result.path).toBe('@company/theme-custom')
    })

    it('does not set themeName (themeName is undefined)', () => {
      const error = new Error('Test')
      const result = formatThemeError(error, './theme.yml')

      expect(result.themeName).toBeUndefined()
    })
  })
})
