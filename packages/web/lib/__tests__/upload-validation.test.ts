import { describe, it, expect } from 'vitest'
import {
  isAllowedFile,
  isAllowedMimeType,
  isValidTextContent,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '../upload-validation'

describe('upload-validation', () => {
  describe('constants', () => {
    it('should have correct file size limits', () => {
      expect(MAX_FILE_SIZE).toBe(1 * 1024 * 1024) // 1MB
      expect(MAX_TOTAL_SIZE).toBe(5 * 1024 * 1024) // 5MB
    })

    it('should have correct allowed extensions', () => {
      expect(ALLOWED_EXTENSIONS).toContain('.md')
      expect(ALLOWED_EXTENSIONS).toContain('.markdown')
    })

    it('should have correct allowed MIME types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('text/markdown')
      expect(ALLOWED_MIME_TYPES).toContain('text/x-markdown')
      expect(ALLOWED_MIME_TYPES).toContain('text/plain')
      // Should NOT include application/octet-stream
      expect(ALLOWED_MIME_TYPES).not.toContain('application/octet-stream')
    })
  })

  describe('isAllowedFile', () => {
    it('should allow .md files', () => {
      expect(isAllowedFile('slide.md')).toBe(true)
      expect(isAllowedFile('01-intro.md')).toBe(true)
    })

    it('should allow .markdown files', () => {
      expect(isAllowedFile('slide.markdown')).toBe(true)
      expect(isAllowedFile('README.markdown')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isAllowedFile('slide.MD')).toBe(true)
      expect(isAllowedFile('slide.Md')).toBe(true)
      expect(isAllowedFile('slide.MARKDOWN')).toBe(true)
    })

    it('should reject non-markdown files', () => {
      expect(isAllowedFile('script.js')).toBe(false)
      expect(isAllowedFile('image.png')).toBe(false)
      expect(isAllowedFile('document.pdf')).toBe(false)
      expect(isAllowedFile('style.css')).toBe(false)
      expect(isAllowedFile('data.json')).toBe(false)
    })

    it('should reject files with markdown-like names but wrong extensions', () => {
      expect(isAllowedFile('markdown.txt')).toBe(false)
      expect(isAllowedFile('md.txt')).toBe(false)
      expect(isAllowedFile('.md')).toBe(true) // edge case: just the extension
    })
  })

  describe('isAllowedMimeType', () => {
    it('should allow text/markdown', () => {
      expect(isAllowedMimeType('text/markdown')).toBe(true)
    })

    it('should allow text/x-markdown', () => {
      expect(isAllowedMimeType('text/x-markdown')).toBe(true)
    })

    it('should allow text/plain', () => {
      expect(isAllowedMimeType('text/plain')).toBe(true)
    })

    it('should reject application/octet-stream', () => {
      expect(isAllowedMimeType('application/octet-stream')).toBe(false)
    })

    it('should reject other MIME types', () => {
      expect(isAllowedMimeType('text/html')).toBe(false)
      expect(isAllowedMimeType('application/json')).toBe(false)
      expect(isAllowedMimeType('image/png')).toBe(false)
      expect(isAllowedMimeType('application/javascript')).toBe(false)
    })
  })

  describe('isValidTextContent', () => {
    describe('valid text content', () => {
      it('should accept plain ASCII text', () => {
        expect(isValidTextContent('Hello, World!')).toBe(true)
        expect(isValidTextContent('# Heading\n\nParagraph text.')).toBe(true)
      })

      it('should accept empty content', () => {
        expect(isValidTextContent('')).toBe(true)
      })

      it('should accept content with tabs and newlines', () => {
        expect(isValidTextContent('Line 1\nLine 2\n\tIndented')).toBe(true)
        expect(isValidTextContent('\t\t\t')).toBe(true)
        expect(isValidTextContent('\n\n\n')).toBe(true)
      })

      it('should accept content with carriage returns', () => {
        expect(isValidTextContent('Windows\r\nLine endings')).toBe(true)
        expect(isValidTextContent('Old Mac\rLine endings')).toBe(true)
      })

      it('should accept markdown content', () => {
        const markdown = `---
title: My Slide
---

# Heading

- Bullet point
- Another point

\`\`\`javascript
const x = 1;
\`\`\`
`
        expect(isValidTextContent(markdown)).toBe(true)
      })
    })

    describe('unicode and emoji support', () => {
      it('should accept emojis', () => {
        expect(isValidTextContent('Hello 👋 World 🌍')).toBe(true)
        expect(isValidTextContent('🎉🎊🎈')).toBe(true)
        expect(isValidTextContent('I ❤️ coding')).toBe(true)
      })

      it('should accept complex emojis (ZWJ sequences)', () => {
        expect(isValidTextContent('Family: 👨‍👩‍👧‍👦')).toBe(true)
        expect(isValidTextContent('Skin tones: 👋🏻👋🏼👋🏽👋🏾👋🏿')).toBe(true)
      })

      it('should accept international characters', () => {
        expect(isValidTextContent('日本語テキスト')).toBe(true)
        expect(isValidTextContent('中文文本')).toBe(true)
        expect(isValidTextContent('Привет мир')).toBe(true)
        expect(isValidTextContent('مرحبا بالعالم')).toBe(true)
        expect(isValidTextContent('שלום עולם')).toBe(true)
      })

      it('should accept special unicode characters', () => {
        expect(isValidTextContent('→ Arrow')).toBe(true)
        expect(isValidTextContent('• Bullet')).toBe(true)
        expect(isValidTextContent('© Copyright')).toBe(true)
        expect(isValidTextContent('™ Trademark')).toBe(true)
        expect(isValidTextContent('€100 £50 ¥1000')).toBe(true)
      })

      it('should accept accented characters', () => {
        expect(isValidTextContent('Café résumé naïve')).toBe(true)
        expect(isValidTextContent('Ñoño señor')).toBe(true)
        expect(isValidTextContent('Ümlauts äöü')).toBe(true)
      })

      it('should accept mixed content with emojis and markdown', () => {
        const content = `# Welcome! 👋

This is a presentation about 🚀 **rockets**.

## Features ✨
- Fast ⚡
- Reliable 💪
- Fun 🎉
`
        expect(isValidTextContent(content)).toBe(true)
      })
    })

    describe('binary content detection', () => {
      it('should reject content with null bytes', () => {
        expect(isValidTextContent('Hello\0World')).toBe(false)
        expect(isValidTextContent('\0')).toBe(false)
        expect(isValidTextContent('Start\0\0\0End')).toBe(false)
      })

      it('should reject content with too many control characters', () => {
        // Create content with many control characters (< 90% printable)
        const controlChars = String.fromCharCode(1, 2, 3, 4, 5, 6, 7)
        const content = controlChars.repeat(20) + 'abc' // ~3% printable
        expect(isValidTextContent(content)).toBe(false)
      })

      it('should reject binary-like content', () => {
        // Simulate binary content with many non-printable characters
        const binaryLike = Array(100)
          .fill(0)
          .map((_, i) => String.fromCharCode(i % 32))
          .join('')
        expect(isValidTextContent(binaryLike)).toBe(false)
      })
    })

    describe('edge cases', () => {
      it('should handle content that is exactly at 90% threshold', () => {
        // 9 printable chars + 1 control char = 90% printable (should pass)
        const content = 'aaaaaaaaa' + String.fromCharCode(1)
        expect(isValidTextContent(content)).toBe(true)
      })

      it('should reject content just below 90% threshold', () => {
        // 89 printable chars + 11 control chars = 89% printable (should fail)
        const printable = 'a'.repeat(89)
        const control = String.fromCharCode(1).repeat(11)
        expect(isValidTextContent(printable + control)).toBe(false)
      })

      it('should handle single character content', () => {
        expect(isValidTextContent('a')).toBe(true)
        expect(isValidTextContent('🎉')).toBe(true)
        expect(isValidTextContent(String.fromCharCode(1))).toBe(false)
      })

      it('should handle whitespace-only content', () => {
        expect(isValidTextContent('   ')).toBe(true)
        expect(isValidTextContent('\n\n\n')).toBe(true)
        expect(isValidTextContent('\t\t\t')).toBe(true)
      })
    })
  })
})
