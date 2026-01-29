import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { DeckBundleSchema, type DeckBundle } from '@/schemas/deck-bundle'
import { DEFAULT_THEME } from '@/schemas/theme'
import { uploadDeck } from '@/lib/storage/blob'
import matter from 'gray-matter'

// Rate limiting: track uploads per IP
const uploadCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // uploads per hour
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = uploadCounts.get(ip)

  if (!record || now > record.resetAt) {
    uploadCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const title = formData.get('title') as string | null
    const author = formData.get('author') as string | null

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Parse slides from uploaded files
    const slides: DeckBundle['slides'] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await file.text()

      try {
        const { data, content: body } = matter(content)

        // Extract notes from body
        let slideBody = body
        let notes: string | undefined

        const notesMatch = body.match(/<!--\s*notes\s*-->([\s\S]*?)(?:<!--\s*\/notes\s*-->|$)/i)
        if (notesMatch) {
          notes = notesMatch[1].trim()
          slideBody = body.replace(/<!--\s*notes\s*-->[\s\S]*?(?:<!--\s*\/notes\s*-->|$)/gi, '').trim()
        }

        slides.push({
          frontmatter: {
            title: data.title || `Slide ${i + 1}`,
            bigText: data.bigText,
            gradient: data.gradient,
            theme: data.theme,
            transition: data.transition || 'glitch',
            meta: data.meta,
          },
          body: slideBody,
          notes,
          index: i,
        })
      } catch (parseError) {
        return NextResponse.json(
          { error: `Failed to parse slide ${i + 1}: ${parseError}` },
          { status: 400 }
        )
      }
    }

    // Create deck bundle
    const id = nanoid(8)
    const deck: DeckBundle = {
      version: 1,
      id,
      createdAt: new Date().toISOString(),
      config: {
        title: title || undefined,
        author: author || undefined,
        theme: DEFAULT_THEME,
      },
      slides,
    }

    // Validate
    const validation = DeckBundleSchema.safeParse(deck)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid deck format', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Upload to storage
    await uploadDeck(deck)

    return NextResponse.json({
      id,
      url: `/d/${id}`,
      slideCount: slides.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
