import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { extractNotes, parseSlide } from '../slide'
import { findSlideFiles, loadDeckConfig, loadDeck } from '../deck-loader'
import { normalizeBigText } from '../content-processor'
import { hasMermaidDiagrams, extractMermaidBlocks, mermaidToAscii, formatMermaidError, processMermaidDiagrams } from '../utils/mermaid'
import { DEFAULT_THEME } from '../../schemas/theme'
import { join, dirname } from 'path'
import { rmSync, mkdirSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Temp directory for test files
const TEST_DIR = join(__dirname, '.test-slides')

// Helper to create test slide files
async function createTestSlide(name: string, content: string): Promise<string> {
  const path = join(TEST_DIR, name)
  writeFileSync(path, content)
  return path
}

describe('extractNotes', () => {
  describe('basic extraction', () => {
    it('extracts notes from content with marker', () => {
      const content = `
This is the body.

<!-- notes -->
These are presenter notes.
They can span multiple lines.
`
      const { body, notes } = extractNotes(content)

      expect(body).toBe('This is the body.')
      expect(notes).toBe('These are presenter notes.\nThey can span multiple lines.')
    })

    it('returns undefined notes if no marker', () => {
      const content = 'Just body content'
      const { body, notes } = extractNotes(content)

      expect(body).toBe('Just body content')
      expect(notes).toBeUndefined()
    })

    it('handles empty content', () => {
      const { body, notes } = extractNotes('')

      expect(body).toBe('')
      expect(notes).toBeUndefined()
    })

    it('handles only notes marker with no content', () => {
      const content = '<!-- notes -->'
      const { body, notes } = extractNotes(content)

      expect(body).toBe('')
      expect(notes).toBeUndefined()
    })
  })

  describe('explicit end marker', () => {
    it('handles explicit end marker', () => {
      const content = `
Body content.

<!-- notes -->
Notes here.
<!-- /notes -->

More body content.
`
      const { body, notes } = extractNotes(content)

      expect(body).toBe('Body content.')
      expect(notes).toBe('Notes here.')
    })

    it('extracts only content between markers', () => {
      const content = `First part.

<!-- notes -->
Secret speaker notes.
<!-- /notes -->

This comes after notes.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('First part.')
      expect(notes).toBe('Secret speaker notes.')
    })

    it('handles empty notes with end marker', () => {
      const content = `Body.
<!-- notes -->
<!-- /notes -->
After.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('Body.')
      expect(notes).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('handles notes at the very start', () => {
      const content = `<!-- notes -->
Notes first.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('')
      expect(notes).toBe('Notes first.')
    })

    it('preserves whitespace in notes', () => {
      const content = `Body.

<!-- notes -->
Line 1

Line 3

Line 5`

      const { body, notes } = extractNotes(content)

      expect(notes).toBe('Line 1\n\nLine 3\n\nLine 5')
    })

    it('handles multiline body content', () => {
      const content = `# Title

Paragraph one.

Paragraph two.

- List item 1
- List item 2

<!-- notes -->
Speaker notes.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe(`# Title

Paragraph one.

Paragraph two.

- List item 1
- List item 2`)
      expect(notes).toBe('Speaker notes.')
    })

    it('handles code blocks in body', () => {
      const content = `Some code:

\`\`\`typescript
const x = 1;
\`\`\`

<!-- notes -->
Explain the code.`

      const { body, notes } = extractNotes(content)

      expect(body).toContain('```typescript')
      expect(notes).toBe('Explain the code.')
    })

    it('handles multiple notes markers (uses first)', () => {
      const content = `Body.

<!-- notes -->
First notes.

<!-- notes -->
Second notes section.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('Body.')
      expect(notes).toBe('First notes.\n\n<!-- notes -->\nSecond notes section.')
    })

    it('handles marker as part of text (not at line start)', () => {
      const content = `The marker is <!-- notes --> in the middle.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('The marker is')
      expect(notes).toBe('in the middle.')
    })
  })

  describe('trimming behavior', () => {
    it('trims whitespace from body', () => {
      const content = `

Body with leading/trailing space.

<!-- notes -->
Notes.`

      const { body, notes } = extractNotes(content)

      expect(body).toBe('Body with leading/trailing space.')
    })

    it('trims whitespace from notes', () => {
      const content = `Body.

<!-- notes -->

   Notes with extra whitespace.

`

      const { body, notes } = extractNotes(content)

      expect(notes).toBe('Notes with extra whitespace.')
    })
  })
})

describe('hasMermaidDiagrams', () => {
  describe('detection', () => {
    it('returns true when content contains a mermaid block', () => {
      const content = `
Some text

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

More text
`
      expect(hasMermaidDiagrams(content)).toBe(true)
    })

    it('returns false when content has no mermaid blocks', () => {
      const content = `
# Regular Markdown

Some text without diagrams.

\`\`\`typescript
const x = 1;
\`\`\`
`
      expect(hasMermaidDiagrams(content)).toBe(false)
    })

    it('returns false for empty content', () => {
      expect(hasMermaidDiagrams('')).toBe(false)
    })

    it('returns false for content with only regular code blocks', () => {
      const content = `
\`\`\`javascript
console.log('hello');
\`\`\`

\`\`\`python
print('hello')
\`\`\`
`
      expect(hasMermaidDiagrams(content)).toBe(false)
    })

    it('returns true for multiple mermaid blocks', () => {
      const content = `
\`\`\`mermaid
graph LR
    A --> B
\`\`\`

Some text

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\`
`
      expect(hasMermaidDiagrams(content)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('does not match mermaid without newline after language identifier', () => {
      // The pattern requires a newline after ```mermaid
      const content = '\`\`\`mermaidgraph LR\`\`\`'
      expect(hasMermaidDiagrams(content)).toBe(false)
    })

    it('handles mermaid block at start of content', () => {
      const content = `\`\`\`mermaid
graph LR
    A --> B
\`\`\``
      expect(hasMermaidDiagrams(content)).toBe(true)
    })

    it('handles mermaid block at end of content', () => {
      const content = `Text before

\`\`\`mermaid
graph TD
    A --> B
\`\`\``
      expect(hasMermaidDiagrams(content)).toBe(true)
    })

    it('is case-sensitive (Mermaid uppercase not matched)', () => {
      const content = `
\`\`\`Mermaid
graph LR
    A --> B
\`\`\`
`
      expect(hasMermaidDiagrams(content)).toBe(false)
    })

    it('can be called multiple times correctly (handles lastIndex reset)', () => {
      const content = `
\`\`\`mermaid
graph LR
    A --> B
\`\`\`
`
      // Call multiple times to ensure lastIndex is properly reset
      expect(hasMermaidDiagrams(content)).toBe(true)
      expect(hasMermaidDiagrams(content)).toBe(true)
      expect(hasMermaidDiagrams(content)).toBe(true)
    })
  })
})

describe('extractMermaidBlocks', () => {
  describe('single block extraction', () => {
    it('extracts a single mermaid block', () => {
      const content = `
Some text

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

More text
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toBe('graph LR\n    A --> B')
    })

    it('trims whitespace from extracted blocks', () => {
      const content = `
\`\`\`mermaid

  graph TD
      A --> B

\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toBe('graph TD\n      A --> B')
    })
  })

  describe('multiple block extraction', () => {
    it('extracts multiple mermaid blocks', () => {
      const content = `
Some text

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

More text

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\`

Even more text
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toContain('graph LR')
      expect(blocks[0]).toContain('A --> B')
      expect(blocks[1]).toContain('sequenceDiagram')
      expect(blocks[1]).toContain('Alice->>Bob: Hello')
    })

    it('extracts three mermaid blocks', () => {
      const content = `
\`\`\`mermaid
graph LR
    A --> B
\`\`\`

\`\`\`mermaid
pie
    title Pets
    "Dogs" : 386
\`\`\`

\`\`\`mermaid
classDiagram
    class Animal
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(3)
      expect(blocks[0]).toContain('graph LR')
      expect(blocks[1]).toContain('pie')
      expect(blocks[2]).toContain('classDiagram')
    })
  })

  describe('no blocks', () => {
    it('returns empty array when no mermaid blocks', () => {
      const content = 'Just regular text'
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(0)
      expect(blocks).toEqual([])
    })

    it('returns empty array for empty content', () => {
      const blocks = extractMermaidBlocks('')

      expect(blocks).toHaveLength(0)
    })

    it('ignores non-mermaid code blocks', () => {
      const content = `
\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`javascript
console.log('hello');
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty mermaid block', () => {
      const content = `
\`\`\`mermaid
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toBe('')
    })

    it('handles mermaid block with only whitespace', () => {
      const content = `
\`\`\`mermaid



\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toBe('')
    })

    it('preserves complex diagram syntax', () => {
      const content = `
\`\`\`mermaid
graph TB
    subgraph "Group One"
        A[Square] --> B((Circle))
        B --> C{Diamond}
    end
    C -->|Yes| D[Result]
    C -->|No| E[Other]
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toContain('subgraph "Group One"')
      expect(blocks[0]).toContain('A[Square]')
      expect(blocks[0]).toContain('B((Circle))')
      expect(blocks[0]).toContain('C{Diamond}')
      expect(blocks[0]).toContain('-->|Yes|')
    })

    it('handles flowchart with special characters', () => {
      const content = `
\`\`\`mermaid
flowchart LR
    A["Input with (parens)"] --> B["Output with {braces}"]
    B --> C["Text with [brackets]"]
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toContain('flowchart LR')
      expect(blocks[0]).toContain('"Input with (parens)"')
    })

    it('handles sequence diagram syntax', () => {
      const content = `
\`\`\`mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob
    B-->>A: Hi Alice
    A->>B: How are you?
    Note over A,B: This is a note
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(1)
      expect(blocks[0]).toContain('sequenceDiagram')
      expect(blocks[0]).toContain('participant A as Alice')
      expect(blocks[0]).toContain('A->>B:')
      expect(blocks[0]).toContain('Note over A,B:')
    })

    it('can be called multiple times correctly (handles lastIndex reset)', () => {
      const content = `
\`\`\`mermaid
graph LR
    A --> B
\`\`\`
`
      // Call multiple times to ensure lastIndex is properly reset
      expect(extractMermaidBlocks(content)).toHaveLength(1)
      expect(extractMermaidBlocks(content)).toHaveLength(1)
      expect(extractMermaidBlocks(content)).toHaveLength(1)
    })

    it('handles mixed mermaid and other code blocks', () => {
      const content = `
\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

\`\`\`python
print('hello')
\`\`\`

\`\`\`mermaid
pie title Votes
    "A" : 50
    "B" : 30
\`\`\`

\`\`\`bash
echo "hello"
\`\`\`
`
      const blocks = extractMermaidBlocks(content)

      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toContain('graph LR')
      expect(blocks[1]).toContain('pie title Votes')
    })
  })
})

describe('parseSlide', () => {
  beforeAll(() => {
    // Create temp directory
    mkdirSync(TEST_DIR, { recursive: true })
  })

  afterAll(() => {
    // Cleanup temp directory
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('valid slides', () => {
    it('parses a complete slide with all fields', async () => {
      const path = await createTestSlide('01-complete.md', `---
title: Test Slide
bigText: TEST
gradient: fire
transition: glitch
---

{GREEN}Hello{/} World

<!-- notes -->
Test notes here.
`)

      const slide = await parseSlide(path, 0)

      expect(slide.frontmatter.title).toBe('Test Slide')
      expect(slide.frontmatter.bigText).toBe('TEST')
      expect(slide.frontmatter.gradient).toBe('fire')
      expect(slide.frontmatter.transition).toBe('glitch')
      expect(slide.body).toBe('{GREEN}Hello{/} World')
      expect(slide.notes).toBe('Test notes here.')
      expect(slide.sourcePath).toBe(path)
      expect(slide.index).toBe(0)
    })

    it('parses a minimal slide with only title', async () => {
      const path = await createTestSlide('02-minimal.md', `---
title: Minimal Slide
---

Just body content.
`)

      const slide = await parseSlide(path, 5)

      expect(slide.frontmatter.title).toBe('Minimal Slide')
      expect(slide.frontmatter.bigText).toBeUndefined()
      expect(slide.frontmatter.transition).toBe('glitch') // default
      expect(slide.body).toBe('Just body content.')
      expect(slide.notes).toBeUndefined()
      expect(slide.index).toBe(5)
    })

    it('parses slide with bigText as array', async () => {
      const path = await createTestSlide('03-array-bigtext.md', `---
title: Multi-line Title
bigText:
  - LINE ONE
  - LINE TWO
---

Content.
`)

      const slide = await parseSlide(path, 0)

      expect(slide.frontmatter.bigText).toEqual(['LINE ONE', 'LINE TWO'])
    })

    it('parses slide with different transitions', async () => {
      const transitions = ['fade', 'instant', 'typewriter'] as const

      for (const transition of transitions) {
        const path = await createTestSlide(`transition-${transition}.md`, `---
title: ${transition} Test
transition: ${transition}
---

Content.
`)
        const slide = await parseSlide(path, 0)
        expect(slide.frontmatter.transition).toBe(transition)
      }
    })

    it('parses slide with meta field', async () => {
      const path = await createTestSlide('04-meta.md', `---
title: With Meta
meta:
  author: Test Author
  customField: value
---

Body.
`)

      const slide = await parseSlide(path, 0)

      expect(slide.frontmatter.meta).toEqual({
        author: 'Test Author',
        customField: 'value',
      })
    })

    it('parses slide with explicit notes end marker', async () => {
      const path = await createTestSlide('05-notes-end.md', `---
title: Notes End Test
---

Before notes.

<!-- notes -->
The notes.
<!-- /notes -->

After notes.
`)

      const slide = await parseSlide(path, 0)

      expect(slide.body).toBe('Before notes.')
      expect(slide.notes).toBe('The notes.')
    })
  })

  describe('invalid slides', () => {
    it('throws on missing title', async () => {
      const path = await createTestSlide('invalid-no-title.md', `---
bigText: TEST
---

Content without title.
`)

      await expect(parseSlide(path, 0)).rejects.toThrow(/title/)
    })

    it('throws on empty title', async () => {
      const path = await createTestSlide('invalid-empty-title.md', `---
title: ""
---

Content.
`)

      await expect(parseSlide(path, 0)).rejects.toThrow(/title/)
    })

    it('throws on invalid transition type', async () => {
      const path = await createTestSlide('invalid-transition.md', `---
title: Invalid Transition
transition: bounce
---

Content.
`)

      await expect(parseSlide(path, 0)).rejects.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles empty body', async () => {
      const path = await createTestSlide('empty-body.md', `---
title: Empty Body
---
`)

      const slide = await parseSlide(path, 0)

      expect(slide.body).toBe('')
    })

    it('handles body with only whitespace', async () => {
      const path = await createTestSlide('whitespace-body.md', `---
title: Whitespace Body
---



`)

      const slide = await parseSlide(path, 0)

      expect(slide.body).toBe('')
    })

    it('preserves code blocks in body', async () => {
      const path = await createTestSlide('code-block.md', `---
title: Code Example
---

\`\`\`typescript
const x = 1;
console.log(x);
\`\`\`
`)

      const slide = await parseSlide(path, 0)

      expect(slide.body).toContain('```typescript')
      expect(slide.body).toContain('const x = 1;')
    })

    it('handles multiline content with various markdown', async () => {
      const path = await createTestSlide('multiline.md', `---
title: Multi-line
---

# Header

Paragraph with **bold** and *italic*.

- List item 1
- List item 2

> Blockquote

<!-- notes -->
Notes at the end.
`)

      const slide = await parseSlide(path, 0)

      expect(slide.body).toContain('# Header')
      expect(slide.body).toContain('**bold**')
      expect(slide.body).toContain('- List item 1')
      expect(slide.body).toContain('> Blockquote')
      expect(slide.notes).toBe('Notes at the end.')
    })
  })
})

describe('findSlideFiles', () => {
  const SLIDES_DIR = join(__dirname, '.test-slides-find')

  beforeEach(() => {
    mkdirSync(SLIDES_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(SLIDES_DIR, { recursive: true, force: true })
  })

  // Helper to create a test file
  async function createFile(name: string): Promise<void> {
    writeFileSync(join(SLIDES_DIR, name), `---\ntitle: ${name}\n---\n`)
  }

  describe('file discovery', () => {
    it('finds all markdown files in directory', async () => {
      await createFile('01-intro.md')
      await createFile('02-content.md')
      await createFile('03-end.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(3)
      expect(files.map(f => f.name)).toEqual(['01-intro.md', '02-content.md', '03-end.md'])
    })

    it('returns empty array for empty directory', async () => {
      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(0)
    })

    it('returns full path for each file', async () => {
      await createFile('slide.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files[0].path).toBe(join(SLIDES_DIR, 'slide.md'))
    })
  })

  describe('exclusions', () => {
    it('excludes README.md', async () => {
      await createFile('01-intro.md')
      await createFile('README.md')
      await createFile('02-end.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(2)
      expect(files.map(f => f.name)).not.toContain('README.md')
    })

    it('excludes files starting with underscore', async () => {
      await createFile('01-intro.md')
      await createFile('_draft.md')
      await createFile('_template.md')
      await createFile('02-end.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(2)
      expect(files.map(f => f.name)).toEqual(['01-intro.md', '02-end.md'])
    })

    it('excludes both README.md and underscore files', async () => {
      await createFile('README.md')
      await createFile('_draft.md')
      await createFile('01-actual.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('01-actual.md')
    })
  })

  describe('numeric sorting', () => {
    it('sorts files numerically (1, 2, 10 not 1, 10, 2)', async () => {
      // Create files in wrong order
      await createFile('10-tenth.md')
      await createFile('1-first.md')
      await createFile('2-second.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files.map(f => f.name)).toEqual([
        '1-first.md',
        '2-second.md',
        '10-tenth.md',
      ])
    })

    it('sorts with zero-padded numbers', async () => {
      await createFile('03-three.md')
      await createFile('01-one.md')
      await createFile('02-two.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files.map(f => f.name)).toEqual([
        '01-one.md',
        '02-two.md',
        '03-three.md',
      ])
    })

    it('handles mixed naming conventions', async () => {
      await createFile('a-alpha.md')
      await createFile('01-first.md')
      await createFile('b-beta.md')

      const files = await findSlideFiles(SLIDES_DIR)

      // Numeric prefixes come before letters
      expect(files.map(f => f.name)).toEqual([
        '01-first.md',
        'a-alpha.md',
        'b-beta.md',
      ])
    })
  })

  describe('index assignment', () => {
    it('assigns sequential indices starting from 0', async () => {
      await createFile('01-intro.md')
      await createFile('02-middle.md')
      await createFile('03-end.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files[0].index).toBe(0)
      expect(files[1].index).toBe(1)
      expect(files[2].index).toBe(2)
    })

    it('assigns indices after sorting', async () => {
      // Create in reverse order
      await createFile('03-c.md')
      await createFile('01-a.md')
      await createFile('02-b.md')

      const files = await findSlideFiles(SLIDES_DIR)

      // 01-a.md should have index 0 (sorted first)
      expect(files[0].name).toBe('01-a.md')
      expect(files[0].index).toBe(0)

      // 02-b.md should have index 1
      expect(files[1].name).toBe('02-b.md')
      expect(files[1].index).toBe(1)

      // 03-c.md should have index 2
      expect(files[2].name).toBe('03-c.md')
      expect(files[2].index).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('handles single file', async () => {
      await createFile('only-slide.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('only-slide.md')
      expect(files[0].index).toBe(0)
    })

    it('handles files with dots in name', async () => {
      await createFile('01-intro.v2.md')
      await createFile('02-content.final.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(2)
      expect(files.map(f => f.name)).toEqual([
        '01-intro.v2.md',
        '02-content.final.md',
      ])
    })

    it('handles files with spaces in name', async () => {
      await createFile('01 intro.md')
      await createFile('02 content.md')

      const files = await findSlideFiles(SLIDES_DIR)

      expect(files).toHaveLength(2)
    })
  })
})

describe('loadDeckConfig', () => {
  const CONFIG_DIR = join(__dirname, '.test-config')

  beforeEach(() => {
    mkdirSync(CONFIG_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(CONFIG_DIR, { recursive: true, force: true })
  })

  describe('default config fallback', () => {
    it('returns default config when no deck.config.ts exists', async () => {
      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.theme).toEqual(DEFAULT_THEME)
    })

    it('returns default config with DEFAULT_THEME properties', async () => {
      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.theme.name).toBe('matrix')
      expect(config.theme.colors.primary).toBe('#00cc66')
      expect(config.theme.colors.accent).toBe('#ff6600')
    })
  })

  // Skip these tests in Vitest - they require dynamically loading TypeScript files
  // from temp directories, which Vite/esbuild can't handle. These tests work with Bun.
  describe.skip('config file loading', () => {
    it('loads and validates a valid deck.config.ts', async () => {
      const configContent = `
export default {
  title: 'Test Presentation',
  author: 'Test Author',
  theme: ${JSON.stringify(DEFAULT_THEME, null, 2)},
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.title).toBe('Test Presentation')
      expect(config.author).toBe('Test Author')
      expect(config.theme).toEqual(DEFAULT_THEME)
    })

    it('loads config with custom theme', async () => {
      const configContent = `
export default {
  theme: {
    name: 'custom',
    colors: {
      primary: '#ff0000',
      accent: '#00ff00',
      background: '#000000',
      text: '#ffffff',
      muted: '#888888',
    },
    gradients: {
      custom: ['#ff0000', '#00ff00'],
    },
    glyphs: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    animations: {
      revealSpeed: 1.0,
      matrixDensity: 50,
      glitchIterations: 5,
      lineDelay: 30,
      matrixInterval: 80,
    },
  },
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.theme.name).toBe('custom')
      expect(config.theme.colors.primary).toBe('#ff0000')
    })

    it('loads config with settings', async () => {
      const configContent = `
export default {
  theme: ${JSON.stringify(DEFAULT_THEME, null, 2)},
  settings: {
    startSlide: 2,
    loop: true,
    showProgress: true,
  },
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.settings?.startSlide).toBe(2)
      expect(config.settings?.loop).toBe(true)
      expect(config.settings?.showProgress).toBe(true)
    })

    it('loads config with export settings', async () => {
      const configContent = `
export default {
  theme: ${JSON.stringify(DEFAULT_THEME, null, 2)},
  export: {
    width: 160,
    height: 50,
    fps: 24,
  },
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      const config = await loadDeckConfig(CONFIG_DIR)

      expect(config.export?.width).toBe(160)
      expect(config.export?.height).toBe(50)
      expect(config.export?.fps).toBe(24)
    })
  })

  // Skip these tests in Vitest - they require dynamically loading TypeScript files
  // from temp directories, which Vite/esbuild can't handle. These tests work with Bun.
  describe.skip('validation errors', () => {
    it('throws on missing default export', async () => {
      const configContent = `
export const config = { theme: {} }
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      await expect(loadDeckConfig(CONFIG_DIR)).rejects.toThrow(
        'deck.config.ts must export default config'
      )
    })

    it('throws on invalid theme schema', async () => {
      const configContent = `
export default {
  theme: {
    name: 'invalid',
    // Missing required fields
  },
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      await expect(loadDeckConfig(CONFIG_DIR)).rejects.toThrow()
    })

    it('throws on invalid color format', async () => {
      const configContent = `
export default {
  theme: {
    name: 'bad-colors',
    colors: {
      primary: 'not-a-hex',
      accent: '#00ff00',
      background: '#000000',
      text: '#ffffff',
      muted: '#888888',
    },
    gradients: { test: ['#ff0000', '#00ff00'] },
    glyphs: 'ABCDEFGHIJ',
    animations: {},
  },
}
`
      writeFileSync(join(CONFIG_DIR, 'deck.config.ts'), configContent)

      await expect(loadDeckConfig(CONFIG_DIR)).rejects.toThrow(/hex color/)
    })
  })
})

describe('loadDeck', () => {
  const DECK_DIR = join(__dirname, '.test-deck')

  beforeEach(() => {
    mkdirSync(DECK_DIR, { recursive: true })
  })

  afterEach(() => {
    rmSync(DECK_DIR, { recursive: true, force: true })
  })

  // Helper to create a slide file
  async function createSlide(name: string, title: string, body: string = 'Content'): Promise<void> {
    writeFileSync(join(DECK_DIR, name), `---
title: ${title}
---

${body}
`)
  }

  describe('complete deck loading', () => {
    it('loads a complete deck with slides and default config', async () => {
      await createSlide('01-intro.md', 'Introduction')
      await createSlide('02-content.md', 'Main Content')
      await createSlide('03-end.md', 'Conclusion')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides).toHaveLength(3)
      expect(deck.config.theme).toEqual(DEFAULT_THEME)
      expect(deck.basePath).toBe(DECK_DIR)
    })

    it('loads slides in correct numeric order', async () => {
      // Create slides out of order
      await createSlide('10-last.md', 'Last')
      await createSlide('01-first.md', 'First')
      await createSlide('02-second.md', 'Second')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides[0].frontmatter.title).toBe('First')
      expect(deck.slides[1].frontmatter.title).toBe('Second')
      expect(deck.slides[2].frontmatter.title).toBe('Last')
    })

    it('assigns correct indices to slides', async () => {
      await createSlide('01-intro.md', 'Intro')
      await createSlide('02-middle.md', 'Middle')
      await createSlide('03-end.md', 'End')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides[0].index).toBe(0)
      expect(deck.slides[1].index).toBe(1)
      expect(deck.slides[2].index).toBe(2)
    })

    it('preserves slide source paths', async () => {
      await createSlide('01-intro.md', 'Intro')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides[0].sourcePath).toBe(join(DECK_DIR, '01-intro.md'))
    })
  })

  // Note: Custom config tests are prone to Bun's dynamic import caching
  // when using temp directories. Config file loading is tested in loadDeckConfig.
  // loadDeck correctly delegates to loadDeckConfig, and the integration is
  // tested via the 'complete deck loading' tests that use default config.

  describe('parallel slide parsing', () => {
    it('parses multiple slides successfully', async () => {
      // Create many slides to test parallel parsing
      for (let i = 1; i <= 10; i++) {
        const num = i.toString().padStart(2, '0')
        await createSlide(`${num}-slide.md`, `Slide ${i}`, `Content for slide ${i}`)
      }

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides).toHaveLength(10)
      deck.slides.forEach((slide, i) => {
        expect(slide.frontmatter.title).toBe(`Slide ${i + 1}`)
        expect(slide.body).toBe(`Content for slide ${i + 1}`)
      })
    })

    it('preserves slide content and notes', async () => {
      writeFileSync(join(DECK_DIR, '01-intro.md'), `---
title: Introduction
bigText: INTRO
gradient: fire
---

{GREEN}Hello{/} World

- Point one
- Point two

<!-- notes -->
Speaker notes here.
`)

      const deck = await loadDeck(DECK_DIR)

      const slide = deck.slides[0]
      expect(slide.frontmatter.title).toBe('Introduction')
      expect(slide.frontmatter.bigText).toBe('INTRO')
      expect(slide.frontmatter.gradient).toBe('fire')
      expect(slide.body).toContain('{GREEN}Hello{/} World')
      expect(slide.body).toContain('- Point one')
      expect(slide.notes).toBe('Speaker notes here.')
    })
  })

  describe('edge cases', () => {
    it('returns empty slides array for empty directory', async () => {
      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides).toHaveLength(0)
      expect(deck.config.theme).toEqual(DEFAULT_THEME)
      expect(deck.basePath).toBe(DECK_DIR)
    })

    it('excludes README.md and underscore files from slides', async () => {
      await createSlide('01-intro.md', 'Intro')
      writeFileSync(join(DECK_DIR, 'README.md'), `# README\n\nNot a slide.`)
      writeFileSync(join(DECK_DIR, '_draft.md'), `---\ntitle: Draft\n---\n\nDraft content.`)

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides).toHaveLength(1)
      expect(deck.slides[0].frontmatter.title).toBe('Intro')
    })

    it('handles single slide deck', async () => {
      await createSlide('01-only.md', 'Only Slide')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.slides).toHaveLength(1)
      expect(deck.slides[0].index).toBe(0)
    })
  })

  describe('error handling', () => {
    it('throws on invalid slide frontmatter', async () => {
      // Create a slide without required title
      writeFileSync(join(DECK_DIR, '01-invalid.md'), `---
bigText: TEST
---

No title here.
`)

      await expect(loadDeck(DECK_DIR)).rejects.toThrow(/title/)
    })

    // Note: Config file validation tests are covered in loadDeckConfig tests.
    // Testing config errors through loadDeck is problematic due to Bun's
    // dynamic import caching and temp directory path resolution.
  })

  describe('basePath', () => {
    it('returns the correct basePath', async () => {
      await createSlide('01-intro.md', 'Intro')

      const deck = await loadDeck(DECK_DIR)

      expect(deck.basePath).toBe(DECK_DIR)
    })

    it('returns absolute path as basePath', async () => {
      await createSlide('01-intro.md', 'Intro')

      const deck = await loadDeck(DECK_DIR)

      // Path should be absolute (starts with /)
      expect(deck.basePath.startsWith('/')).toBe(true)
    })
  })
})

describe('formatMermaidError', () => {
  describe('error block formatting', () => {
    it('creates bordered error block', () => {
      const code = 'invalid diagram'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).toContain('┌─ Diagram (parse error) ─┐')
      expect(result).toContain('└─────────────────────────┘')
    })

    it('includes diagram code in error block', () => {
      const code = 'graph LR\n    A --> B'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).toContain('graph LR')
    })

    it('truncates long lines to fit border width', () => {
      const code = 'This is a very very very very long line that exceeds the box width'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      // Each content line should be exactly 23 chars truncated then padded
      const lines = result.split('\n')
      const contentLine = lines.find(l => l.includes('This is'))
      // slice(0, 23) gives 23 chars: "This is a very very ver"
      expect(contentLine).toBe('│ This is a very very ver │')
    })

    it('limits to first 5 lines', () => {
      const code = 'line1\nline2\nline3\nline4\nline5\nline6\nline7'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).toContain('line1')
      expect(result).toContain('line5')
      expect(result).toContain('...')
      expect(result).not.toContain('line7')
    })

    it('does not show ellipsis for 5 or fewer lines', () => {
      const code = 'line1\nline2\nline3'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).not.toContain('...')
    })

    it('handles single line code', () => {
      const code = 'single line'
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).toContain('single line')
      expect(result).toContain('┌─ Diagram (parse error) ─┐')
    })

    it('handles empty code', () => {
      const code = ''
      const error = new Error('parse error')
      const result = formatMermaidError(code, error)

      expect(result).toContain('┌─ Diagram (parse error) ─┐')
      expect(result).toContain('└─────────────────────────┘')
    })
  })
})

describe('mermaidToAscii', () => {
  describe('valid diagrams', () => {
    it('converts simple graph LR diagram', () => {
      const code = `graph LR
    A --> B`
      const result = mermaidToAscii(code)

      // Should contain ASCII box drawing characters
      expect(result).toContain('┌')
      expect(result).toContain('└')
      expect(result).toContain('─')
    })

    it('converts graph TD diagram', () => {
      const code = `graph TD
    A --> B`
      const result = mermaidToAscii(code)

      expect(result).toContain('┌')
      expect(result).toContain('└')
    })

    it('converts flowchart diagram', () => {
      const code = `flowchart LR
    Start --> End`
      const result = mermaidToAscii(code)

      expect(result).toContain('Start')
      expect(result).toContain('End')
    })
  })

  describe('invalid diagrams', () => {
    it('returns error block for invalid diagram', () => {
      const code = 'not a valid diagram'
      const result = mermaidToAscii(code)

      expect(result).toContain('┌─ Diagram (parse error) ─┐')
      expect(result).toContain('not a valid diagram')
    })

    it('returns error block for incomplete diagram', () => {
      const code = 'graph'
      const result = mermaidToAscii(code)

      expect(result).toContain('┌─ Diagram (parse error) ─┐')
    })

    it('returns error block for empty content', () => {
      const code = ''
      const result = mermaidToAscii(code)

      expect(result).toContain('┌─ Diagram (parse error) ─┐')
    })
  })
})

describe('processMermaidDiagrams', () => {
  describe('content without mermaid', () => {
    it('returns content unchanged when no mermaid blocks', () => {
      const content = 'Just some text\n\nMore text'
      const result = processMermaidDiagrams(content)

      expect(result).toBe(content)
    })

    it('returns empty string unchanged', () => {
      const content = ''
      const result = processMermaidDiagrams(content)

      expect(result).toBe('')
    })

    it('returns content with other code blocks unchanged', () => {
      const content = `Some text

\`\`\`typescript
const x = 1;
\`\`\`

More text`
      const result = processMermaidDiagrams(content)

      expect(result).toBe(content)
    })
  })

  describe('content with mermaid blocks', () => {
    it('replaces single mermaid block with ASCII', () => {
      const content = `Before

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

After`
      const result = processMermaidDiagrams(content)

      // Should not contain mermaid markers
      expect(result).not.toContain('```mermaid')
      expect(result).not.toContain('```')
      // Should contain ASCII art
      expect(result).toContain('┌')
      // Should preserve surrounding text
      expect(result).toContain('Before')
      expect(result).toContain('After')
    })

    it('replaces multiple mermaid blocks', () => {
      const content = `Text 1

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

Text 2

\`\`\`mermaid
graph TD
    C --> D
\`\`\`

Text 3`
      const result = processMermaidDiagrams(content)

      // Should not contain any mermaid markers
      expect(result).not.toContain('```mermaid')
      // Should preserve all text sections
      expect(result).toContain('Text 1')
      expect(result).toContain('Text 2')
      expect(result).toContain('Text 3')
    })

    it('handles invalid mermaid by showing error block', () => {
      const content = `Before

\`\`\`mermaid
invalid content
\`\`\`

After`
      const result = processMermaidDiagrams(content)

      expect(result).not.toContain('```mermaid')
      expect(result).toContain('┌─ Diagram (parse error) ─┐')
      expect(result).toContain('Before')
      expect(result).toContain('After')
    })

    it('preserves non-mermaid code blocks', () => {
      const content = `\`\`\`typescript
const x = 1;
\`\`\`

\`\`\`mermaid
graph LR
    A --> B
\`\`\`

\`\`\`python
print('hello')
\`\`\``
      const result = processMermaidDiagrams(content)

      // Mermaid should be converted
      expect(result).not.toContain('```mermaid')
      // Other code blocks should remain
      expect(result).toContain('```typescript')
      expect(result).toContain('```python')
    })
  })

  describe('edge cases', () => {
    it('handles mermaid block at start of content', () => {
      const content = `\`\`\`mermaid
graph LR
    A --> B
\`\`\`
After`
      const result = processMermaidDiagrams(content)

      expect(result).not.toContain('```mermaid')
      expect(result).toContain('After')
    })

    it('handles mermaid block at end of content', () => {
      const content = `Before
\`\`\`mermaid
graph LR
    A --> B
\`\`\``
      const result = processMermaidDiagrams(content)

      expect(result).not.toContain('```mermaid')
      expect(result).toContain('Before')
    })

    it('handles mermaid with special regex characters in content', () => {
      const content = `Before

\`\`\`mermaid
graph LR
    A[Input $100] --> B[Output (result)]
\`\`\`

After`
      const result = processMermaidDiagrams(content)

      // Should not throw and should process
      expect(result).not.toContain('```mermaid')
      expect(result).toContain('Before')
      expect(result).toContain('After')
    })
  })
})

describe('normalizeBigText', () => {
  describe('undefined input', () => {
    it('converts undefined to empty array', () => {
      const result = normalizeBigText(undefined)

      expect(result).toEqual([])
    })
  })

  describe('string input', () => {
    it('wraps string in array', () => {
      const result = normalizeBigText('HELLO')

      expect(result).toEqual(['HELLO'])
    })

    it('wraps multi-word string in array', () => {
      const result = normalizeBigText('HELLO WORLD')

      expect(result).toEqual(['HELLO WORLD'])
    })

    it('wraps empty string in array', () => {
      const result = normalizeBigText('')

      // Empty string is falsy, so returns empty array
      expect(result).toEqual([])
    })
  })

  describe('array input', () => {
    it('passes through array unchanged', () => {
      const result = normalizeBigText(['LINE ONE', 'LINE TWO'])

      expect(result).toEqual(['LINE ONE', 'LINE TWO'])
    })

    it('passes through single-element array unchanged', () => {
      const result = normalizeBigText(['HELLO'])

      expect(result).toEqual(['HELLO'])
    })

    it('passes through empty array unchanged', () => {
      const result = normalizeBigText([])

      // Empty array is falsy (length 0), but Array.isArray([]) is true
      // So it returns [] directly
      expect(result).toEqual([])
    })

    it('passes through array with multiple lines unchanged', () => {
      const result = normalizeBigText(['A', 'B', 'C', 'D'])

      expect(result).toEqual(['A', 'B', 'C', 'D'])
    })

    it('preserves order of array elements', () => {
      const result = normalizeBigText(['FIRST', 'SECOND', 'THIRD'])

      expect(result[0]).toBe('FIRST')
      expect(result[1]).toBe('SECOND')
      expect(result[2]).toBe('THIRD')
    })
  })

  describe('edge cases', () => {
    it('handles whitespace-only string', () => {
      const result = normalizeBigText('   ')

      // Whitespace string is truthy, so it wraps in array
      expect(result).toEqual(['   '])
    })

    it('handles array with empty strings', () => {
      const result = normalizeBigText(['', 'HELLO', ''])

      expect(result).toEqual(['', 'HELLO', ''])
    })

    it('handles special characters', () => {
      const result = normalizeBigText('HELLO!@#$%')

      expect(result).toEqual(['HELLO!@#$%'])
    })

    it('handles unicode characters', () => {
      const result = normalizeBigText('HÉLLO WÖRLD')

      expect(result).toEqual(['HÉLLO WÖRLD'])
    })
  })
})
