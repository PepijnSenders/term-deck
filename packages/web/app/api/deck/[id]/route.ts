import { NextResponse } from 'next/server'
import { getDeck } from '@/lib/storage/blob'
import { DEMO_DECK } from '@/lib/demo-deck'
import type { DeckMetadata } from '@/schemas/deck-bundle'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params

  // Serve the built-in demo deck
  const deck = id === 'demo' ? DEMO_DECK : await getDeck(id)

  if (!deck) {
    return NextResponse.json(
      { error: 'Deck not found' },
      { status: 404 }
    )
  }

  const metadata: DeckMetadata = {
    id: deck.id,
    title: deck.config.title,
    author: deck.config.author,
    slideCount: deck.slides.length,
    createdAt: deck.createdAt,
  }

  return NextResponse.json(metadata)
}
