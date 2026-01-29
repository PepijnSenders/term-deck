import { z } from 'zod'
import { ThemeSchema } from './theme'
import { SlideFrontmatterSchema } from './slide'

/**
 * Schema for a deck bundle stored in Vercel Blob.
 * This is the format used for sharing decks via URL.
 */
export const DeckBundleSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  config: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    theme: ThemeSchema,
  }),
  slides: z.array(z.object({
    frontmatter: SlideFrontmatterSchema,
    body: z.string(),
    notes: z.string().optional(),
    index: z.number(),
  })),
})

export type DeckBundle = z.infer<typeof DeckBundleSchema>

/**
 * Metadata for a deck (returned by /api/deck/[id])
 */
export const DeckMetadataSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  author: z.string().optional(),
  slideCount: z.number(),
  createdAt: z.string(),
})

export type DeckMetadata = z.infer<typeof DeckMetadataSchema>
