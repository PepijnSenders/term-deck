'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { DeckBundle } from '@/schemas/deck-bundle'

const SlideViewer = dynamic(
  () => import('@/components/slides/SlideViewer').then(mod => mod.SlideViewer),
  { ssr: false }
)

export default function DeckPage() {
  const params = useParams()
  const id = params.id as string
  const [deck, setDeck] = useState<DeckBundle | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const response = await fetch(`/api/deck/${id}/raw`)
        if (!response.ok) {
          setError(true)
          return
        }
        const data = await response.json()
        setDeck(data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchDeck()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-cyber-green">Loading deck...</div>
      </div>
    )
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="cyber-window p-8 text-center max-w-md">
          <h1 className="text-4xl text-cyber-orange mb-4">404</h1>
          <p className="text-cyber-muted mb-6">
            Deck not found. It may have been deleted or the URL is incorrect.
          </p>
          <a href="/" className="cyber-button inline-block">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return <SlideViewer deck={deck} />
}
