import { describe, it, expect } from 'bun:test'
import { SlideFrontmatterSchema, SlideSchema } from '../slide'

describe('SlideFrontmatterSchema', () => {
  describe('title field', () => {
    it('accepts valid title', () => {
      const frontmatter = { title: 'My Slide' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.title).toBe('My Slide')
    })

    it('rejects missing title', () => {
      const frontmatter = {}
      expect(() => SlideFrontmatterSchema.parse(frontmatter)).toThrow()
    })

    it('rejects empty title', () => {
      const frontmatter = { title: '' }
      expect(() => SlideFrontmatterSchema.parse(frontmatter)).toThrow('Slide must have a title')
    })
  })

  describe('bigText field', () => {
    it('accepts string bigText', () => {
      const frontmatter = { title: 'Test', bigText: 'HELLO' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.bigText).toBe('HELLO')
    })

    it('accepts array bigText', () => {
      const frontmatter = { title: 'Test', bigText: ['HELLO', 'WORLD'] }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.bigText).toEqual(['HELLO', 'WORLD'])
    })

    it('accepts undefined bigText', () => {
      const frontmatter = { title: 'Test' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.bigText).toBeUndefined()
    })

    it('accepts empty array bigText', () => {
      const frontmatter = { title: 'Test', bigText: [] }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.bigText).toEqual([])
    })
  })

  describe('gradient field', () => {
    it('accepts string gradient', () => {
      const frontmatter = { title: 'Test', gradient: 'fire' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.gradient).toBe('fire')
    })

    it('accepts undefined gradient', () => {
      const frontmatter = { title: 'Test' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.gradient).toBeUndefined()
    })
  })

  describe('theme field', () => {
    it('accepts string theme', () => {
      const frontmatter = { title: 'Test', theme: 'dark' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.theme).toBe('dark')
    })

    it('accepts undefined theme', () => {
      const frontmatter = { title: 'Test' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.theme).toBeUndefined()
    })
  })

  describe('transition field', () => {
    it('defaults to glitch', () => {
      const frontmatter = { title: 'Test' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.transition).toBe('glitch')
    })

    it('accepts glitch transition', () => {
      const frontmatter = { title: 'Test', transition: 'glitch' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.transition).toBe('glitch')
    })

    it('accepts fade transition', () => {
      const frontmatter = { title: 'Test', transition: 'fade' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.transition).toBe('fade')
    })

    it('accepts instant transition', () => {
      const frontmatter = { title: 'Test', transition: 'instant' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.transition).toBe('instant')
    })

    it('accepts typewriter transition', () => {
      const frontmatter = { title: 'Test', transition: 'typewriter' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.transition).toBe('typewriter')
    })

    it('rejects invalid transition', () => {
      const frontmatter = { title: 'Test', transition: 'slide' }
      expect(() => SlideFrontmatterSchema.parse(frontmatter)).toThrow()
    })
  })

  describe('meta field', () => {
    it('accepts object meta', () => {
      const frontmatter = { title: 'Test', meta: { author: 'John', version: 1 } }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.meta).toEqual({ author: 'John', version: 1 })
    })

    it('accepts undefined meta', () => {
      const frontmatter = { title: 'Test' }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.meta).toBeUndefined()
    })

    it('accepts empty meta object', () => {
      const frontmatter = { title: 'Test', meta: {} }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.meta).toEqual({})
    })

    it('accepts nested meta values', () => {
      const frontmatter = { title: 'Test', meta: { nested: { deep: true } } }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.meta).toEqual({ nested: { deep: true } })
    })
  })

  describe('full frontmatter', () => {
    it('accepts minimal frontmatter (title only)', () => {
      const frontmatter = { title: 'My Slide' }
      expect(() => SlideFrontmatterSchema.parse(frontmatter)).not.toThrow()
    })

    it('accepts full frontmatter with all fields', () => {
      const frontmatter = {
        title: 'My Slide',
        bigText: ['HELLO', 'WORLD'],
        gradient: 'fire',
        theme: 'dark',
        transition: 'glitch',
        meta: { author: 'John' }
      }
      const result = SlideFrontmatterSchema.parse(frontmatter)
      expect(result.title).toBe('My Slide')
      expect(result.bigText).toEqual(['HELLO', 'WORLD'])
      expect(result.gradient).toBe('fire')
      expect(result.theme).toBe('dark')
      expect(result.transition).toBe('glitch')
      expect(result.meta).toEqual({ author: 'John' })
    })
  })
})

describe('SlideSchema', () => {
  describe('valid slides', () => {
    it('accepts minimal slide with required fields', () => {
      const slide = {
        frontmatter: { title: 'Test Slide' },
        body: '# Hello World\n\nThis is content.',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      const result = SlideSchema.parse(slide)
      expect(result.frontmatter.title).toBe('Test Slide')
      expect(result.body).toBe('# Hello World\n\nThis is content.')
      expect(result.sourcePath).toBe('/slides/01-intro.md')
      expect(result.index).toBe(0)
      expect(result.notes).toBeUndefined()
    })

    it('accepts slide with notes', () => {
      const slide = {
        frontmatter: { title: 'Test Slide' },
        body: '# Content',
        notes: 'Remember to explain this slowly.',
        sourcePath: '/slides/02-content.md',
        index: 1
      }
      const result = SlideSchema.parse(slide)
      expect(result.notes).toBe('Remember to explain this slowly.')
    })

    it('accepts slide with empty body', () => {
      const slide = {
        frontmatter: { title: 'Empty Slide' },
        body: '',
        sourcePath: '/slides/03-empty.md',
        index: 2
      }
      const result = SlideSchema.parse(slide)
      expect(result.body).toBe('')
    })

    it('accepts slide with full frontmatter', () => {
      const slide = {
        frontmatter: {
          title: 'Full Slide',
          bigText: ['BIG', 'TEXT'],
          gradient: 'fire',
          theme: 'dark',
          transition: 'fade',
          meta: { custom: 'data' }
        },
        body: '# Full Content',
        notes: 'All options used.',
        sourcePath: '/slides/04-full.md',
        index: 3
      }
      const result = SlideSchema.parse(slide)
      expect(result.frontmatter.title).toBe('Full Slide')
      expect(result.frontmatter.bigText).toEqual(['BIG', 'TEXT'])
      expect(result.frontmatter.gradient).toBe('fire')
      expect(result.frontmatter.theme).toBe('dark')
      expect(result.frontmatter.transition).toBe('fade')
      expect(result.frontmatter.meta).toEqual({ custom: 'data' })
    })
  })

  describe('frontmatter validation', () => {
    it('rejects slide with missing frontmatter title', () => {
      const slide = {
        frontmatter: {},
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })

    it('rejects slide with empty frontmatter title', () => {
      const slide = {
        frontmatter: { title: '' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow('Slide must have a title')
    })

    it('rejects slide with invalid transition in frontmatter', () => {
      const slide = {
        frontmatter: { title: 'Test', transition: 'invalid' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })
  })

  describe('required fields', () => {
    it('rejects slide without frontmatter', () => {
      const slide = {
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })

    it('rejects slide without body', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })

    it('rejects slide without sourcePath', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        index: 0
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })

    it('rejects slide without index', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md'
      }
      expect(() => SlideSchema.parse(slide)).toThrow()
    })
  })

  describe('index field', () => {
    it('accepts index 0', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      const result = SlideSchema.parse(slide)
      expect(result.index).toBe(0)
    })

    it('accepts positive index', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 42
      }
      const result = SlideSchema.parse(slide)
      expect(result.index).toBe(42)
    })

    it('accepts negative index (not constrained)', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: -1
      }
      // Note: Schema doesn't constrain to non-negative, that's business logic
      const result = SlideSchema.parse(slide)
      expect(result.index).toBe(-1)
    })
  })

  describe('nested schema defaults', () => {
    it('applies default transition from frontmatter schema', () => {
      const slide = {
        frontmatter: { title: 'Test' },
        body: '# Content',
        sourcePath: '/slides/01-intro.md',
        index: 0
      }
      const result = SlideSchema.parse(slide)
      expect(result.frontmatter.transition).toBe('glitch')
    })
  })
})
