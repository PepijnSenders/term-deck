import { z } from 'zod'

/**
 * Schema for validating slide frontmatter.
 * Defines the metadata for a single slide.
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
    'glitch',      // Default: glitch reveal line by line
    'fade',        // Fade in
    'instant',     // No animation
    'typewriter',  // Character by character
  ]).default('glitch'),

  // Custom metadata (ignored by renderer, useful for tooling)
  meta: z.record(z.string(), z.unknown()).optional(),
})

export type SlideFrontmatter = z.infer<typeof SlideFrontmatterSchema>

/**
 * Schema for a complete slide after parsing.
 * Includes the parsed frontmatter, body content, optional notes, and metadata.
 */
export const SlideSchema = z.object({
  // Parsed frontmatter
  frontmatter: SlideFrontmatterSchema,
  // Markdown body content
  body: z.string(),
  // Presenter notes (extracted from <!-- notes --> block)
  notes: z.string().optional(),
  // Source file path
  sourcePath: z.string(),
  // Slide index in deck (0-indexed)
  index: z.number(),
})

export type Slide = z.infer<typeof SlideSchema>
