import { describe, it, expect } from 'vitest'
import { generateBigText, generateMultiLineBigText } from '../text-generator.js'

describe('text-generator', () => {
  describe('generateBigText', () => {
    it('generates ASCII art from text', async () => {
      const result = await generateBigText('Hi', ['#00ff00', '#00ff00'])

      // Should contain figlet-style ASCII art characters
      expect(result).toContain('_')
      expect(result).toContain('|')
      // Should have multiple lines
      expect(result.split('\n').length).toBeGreaterThan(1)
    })

    it('accepts different gradient colors', async () => {
      const result = await generateBigText('A', ['#ff0000', '#0000ff'])

      // Should still produce valid ASCII art regardless of color support
      expect(result).toBeTruthy()
      expect(result).toContain('_')
    })

    it('handles empty string', async () => {
      const result = await generateBigText('', ['#00ff00', '#00ff00'])

      // Empty string produces minimal output
      expect(typeof result).toBe('string')
    })

    it('handles special characters', async () => {
      const result = await generateBigText('!@#', ['#00ff00', '#00ff00'])

      expect(result).toBeTruthy()
      expect(result.split('\n').length).toBeGreaterThan(1)
    })
  })

  describe('generateMultiLineBigText', () => {
    it('generates ASCII art for multiple lines', async () => {
      const result = await generateMultiLineBigText(
        ['AB', 'CD'],
        ['#00ff00', '#00ff00']
      )

      // Should have more lines than single text
      expect(result.split('\n').length).toBeGreaterThan(6)
    })

    it('handles single line array', async () => {
      const result = await generateMultiLineBigText(
        ['Hi'],
        ['#00ff00', '#00ff00']
      )

      expect(result).toContain('_')
      expect(result).toContain('|')
    })

    it('handles empty array', async () => {
      const result = await generateMultiLineBigText([], ['#00ff00', '#00ff00'])

      expect(result).toBe('')
    })

    it('joins multiple lines with newline', async () => {
      const result = await generateMultiLineBigText(
        ['A', 'B'],
        ['#00ff00', '#00ff00']
      )

      // Each ASCII art block is ~6 lines, so two blocks should be joined
      const lines = result.split('\n')
      expect(lines.length).toBeGreaterThan(10)
    })
  })
})
