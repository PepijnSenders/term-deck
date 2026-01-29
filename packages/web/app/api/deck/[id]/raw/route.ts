import { NextResponse } from 'next/server'
import { getDeck } from '@/lib/storage/blob'
import { DEMO_DECK } from '@/lib/demo-deck'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params

  // Serve the built-in demo deck
  if (id === 'demo') {
    return NextResponse.json(DEMO_DECK)
  }

  const deck = await getDeck(id)

  if (!deck) {
    return NextResponse.json(
      { error: 'Deck not found' },
      { status: 404 }
    )
  }

  // Return raw deck JSON for CLI consumption
  return NextResponse.json(deck)
}
