import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { DeckBundleSchema, type DeckBundle } from '@/schemas/deck-bundle'
import { DEFAULT_THEME } from '@/schemas/theme'
import { uploadDeck } from '@/lib/storage/blob'
import matter from 'gray-matter'

// Note: Rate limiting is handled by Vercel WAF (configured in dashboard)

// File size limits
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB per file
const MAX_TOTAL_SIZE = 5 * 1024 * 1024 // 5MB total

// Allowed file extensions (case-insensitive)
const ALLOWED_EXTENSIONS = ['.md', '.markdown']

// Allowed MIME types for markdown files
// SECURITY: Do NOT add 'application/octet-stream' - it's overly permissive
// and would allow any file type to bypass MIME validation
const ALLOWED_MIME_TYPES = [
  'text/markdown',
  'text/x-markdown',
  'text/plain', // Some systems report .md as text/plain
]

function isAllowedFile(filename: string): boolean {
  const lowerName = filename.toLowerCase()
  return ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

// SECURITY: Validate that content is actually text, not binary data
// This prevents attacks where a malicious file is renamed to .md
function isValidTextContent(content: string): boolean {
  // Check for null bytes which indicate binary content
  if (content.includes('\0')) {
    return false
  }
  // Check that a reasonable portion of the content is printable ASCII or common unicode
  // Binary files typically have many unprintable characters
  const printableRatio = content.split('').filter(char => {
    const code = char.charCodeAt(0)
    // Allow: printable ASCII, tabs, newlines, carriage returns, and common unicode
    return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || code > 127
  }).length / content.length

  // Require at least 90% printable characters (markdown files should be nearly 100%)
  return printableRatio >= 0.9
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate file types and sizes to prevent malicious uploads and DoS attacks
    let totalSize = 0
    for (const file of files) {
      // Server-side file type validation - don't trust client-side validation
      // Check both extension and MIME type for defense in depth
      if (!isAllowedFile(file.name)) {
        return NextResponse.json(
          { error: `Invalid file type. Only markdown files (.md, .markdown) are allowed.` },
          { status: 400 }
        )
      }
      if (!isAllowedMimeType(file.type)) {
        return NextResponse.json(
          { error: `Invalid file MIME type "${file.type}". Only text/markdown or text/plain files are allowed.` },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
      totalSize += file.size
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: `Total upload size exceeds maximum of ${MAX_TOTAL_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Parse slides from uploaded files
    const slides: DeckBundle['slides'] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const content = await file.text()

      // SECURITY: Validate content is actually text, not binary masquerading as markdown
      if (!isValidTextContent(content)) {
        return NextResponse.json(
          { error: `File "${file.name}" appears to contain binary data. Only text markdown files are allowed.` },
          { status: 400 }
        )
      }

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
