/**
 * Play Command
 *
 * Plays a presentation from a term-deck web URL.
 * Downloads the deck JSON and presents it in the terminal.
 */

import { Command } from 'commander'
import { present } from '../../presenter/main.js'
import { handleError } from '../errors.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

interface DeckBundle {
  version: number
  id: string
  createdAt: string
  config: {
    title?: string
    author?: string
    theme: Record<string, unknown>
  }
  slides: Array<{
    frontmatter: {
      title: string
      bigText?: string | string[]
      gradient?: string
      theme?: string
      transition?: string
      meta?: Record<string, unknown>
    }
    body: string
    notes?: string
    index: number
  }>
}

async function fetchDeck(url: string): Promise<DeckBundle> {
  // Parse the URL to extract the deck ID
  let apiUrl: string

  try {
    const urlObj = new URL(url)

    // Handle different URL formats:
    // - Full URL: https://termdeck.vercel.app/d/abc123
    // - Short path: /d/abc123
    // - Just ID: abc123

    if (urlObj.pathname.startsWith('/d/')) {
      // Extract ID from /d/[id] path
      const id = urlObj.pathname.split('/d/')[1]
      apiUrl = `${urlObj.origin}/api/deck/${id}/raw`
    } else if (urlObj.pathname.startsWith('/api/deck/')) {
      // Already an API URL
      apiUrl = url
    } else {
      throw new Error('Invalid deck URL format')
    }
  } catch {
    // If URL parsing fails, assume it's just an ID
    apiUrl = `https://term-deck-web.vercel.app/api/deck/${url}/raw`
  }

  const response = await fetch(apiUrl)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Deck not found')
    }
    throw new Error(`Failed to fetch deck: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<DeckBundle>
}

async function writeTempSlides(deck: DeckBundle): Promise<string> {
  // Create temp directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'term-deck-'))

  // Write each slide as a markdown file
  for (const slide of deck.slides) {
    const frontmatter = Object.entries(slide.frontmatter)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: ${value}`
        }
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`
        }
        return `${key}: ${JSON.stringify(value)}`
      })
      .join('\n')

    let content = `---\n${frontmatter}\n---\n\n${slide.body}`

    if (slide.notes) {
      content += `\n\n<!-- notes -->\n${slide.notes}\n<!-- /notes -->`
    }

    const filename = `${String(slide.index + 1).padStart(2, '0')}-${slide.frontmatter.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.md`

    await fs.writeFile(path.join(tempDir, filename), content, 'utf-8')
  }

  // Write theme file if present
  if (deck.config.theme) {
    const themeContent = `import { defineTheme } from '@pep/term-deck'

export default defineTheme(${JSON.stringify(deck.config.theme, null, 2)})
`
    await fs.writeFile(path.join(tempDir, 'theme.ts'), themeContent, 'utf-8')
  }

  return tempDir
}

async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true })
  } catch {
    // Ignore cleanup errors
  }
}

export const playCommand = new Command('play')
  .description('Play a presentation from a term-deck web URL')
  .argument('<url>', 'Deck URL (e.g., https://termdeck.vercel.app/d/abc123 or just abc123)')
  .option('-s, --start <n>', 'Start at slide number', '0')
  .option('-n, --notes', 'Show presenter notes in separate terminal')
  .option('--notes-tty <path>', 'TTY device for notes window')
  .option('-l, --loop', 'Loop back to first slide after last')
  .action(async (url, options) => {
    let tempDir: string | null = null

    try {
      console.log('Fetching deck...')
      const deck = await fetchDeck(url)

      console.log(`Playing: ${deck.config.title || 'Untitled Deck'}`)
      if (deck.config.author) {
        console.log(`By: ${deck.config.author}`)
      }
      console.log(`Slides: ${deck.slides.length}\n`)

      tempDir = await writeTempSlides(deck)

      await present(tempDir, {
        startSlide: Number.parseInt(options.start, 10),
        showNotes: options.notes,
        notesTty: options.notesTty,
        loop: options.loop,
      })
    } catch (error) {
      handleError(error)
    } finally {
      if (tempDir) {
        await cleanupTempDir(tempDir)
      }
    }
  })
