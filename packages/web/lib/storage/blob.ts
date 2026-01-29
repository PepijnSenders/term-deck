import { put, list, del } from '@vercel/blob'
import type { DeckBundle } from '@/schemas/deck-bundle'

const DECK_PREFIX = 'decks/'

// Support both env var names (Vercel adds custom prefix)
const getToken = () =>
  process.env.BLOB_READ_WRITE_TOKEN || process.env.TERM_DECK_READ_WRITE_TOKEN

/**
 * Upload a deck bundle to Vercel Blob storage.
 */
export async function uploadDeck(deck: DeckBundle): Promise<string> {
  const path = `${DECK_PREFIX}${deck.id}.json`
  const content = JSON.stringify(deck)

  const blob = await put(path, content, {
    access: 'public',
    contentType: 'application/json',
    token: getToken(),
    addRandomSuffix: false,
  })

  return blob.url
}

/**
 * Get a deck bundle from Vercel Blob storage.
 */
export async function getDeck(id: string): Promise<DeckBundle | null> {
  const path = `${DECK_PREFIX}${id}.json`

  try {
    // List blobs to find the one we want
    const { blobs } = await list({ prefix: path, token: getToken() })

    if (blobs.length === 0) {
      return null
    }

    const response = await fetch(blobs[0].url)
    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data as DeckBundle
  } catch {
    return null
  }
}

/**
 * Delete a deck from Vercel Blob storage.
 */
export async function deleteDeck(id: string): Promise<boolean> {
  const path = `${DECK_PREFIX}${id}.json`

  try {
    const { blobs } = await list({ prefix: path, token: getToken() })

    if (blobs.length === 0) {
      return false
    }

    await del(blobs[0].url, { token: getToken() })
    return true
  } catch {
    return false
  }
}

/**
 * Check if a deck exists in storage.
 */
export async function deckExists(id: string): Promise<boolean> {
  const path = `${DECK_PREFIX}${id}.json`

  try {
    const { blobs } = await list({ prefix: path, token: getToken() })
    return blobs.length > 0
  } catch {
    return false
  }
}
