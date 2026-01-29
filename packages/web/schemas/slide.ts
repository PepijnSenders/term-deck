import { z } from 'zod'

/**
 * Schema for validating slide frontmatter.
 */
export const SlideFrontmatterSchema = z.object({
  // Required: window title
  title: z.string().min(1, {
    message: 'Slide must have a title',
  }),

  // ASCII art text (figlet) - can be a single line or multiple lines
  bigText: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),

  // Which gradient to use for bigText
  gradient: z.string().optional(),

  // Override theme for this slide
  theme: z.string().optional(),

  // Transition effect
  transition: z.enum([
    'glitch',
    'fade',
    'instant',
    'typewriter',
  ]).default('glitch'),

  // Custom metadata
  meta: z.record(z.string(), z.unknown()).optional(),
})

export type SlideFrontmatter = z.infer<typeof SlideFrontmatterSchema>

/**
 * Schema for a complete slide after parsing.
 */
export const SlideSchema = z.object({
  frontmatter: SlideFrontmatterSchema,
  body: z.string(),
  notes: z.string().optional(),
  index: z.number(),
})

export type Slide = z.infer<typeof SlideSchema>
