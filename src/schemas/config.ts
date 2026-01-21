import { z } from 'zod'
import { ThemeSchema } from './theme'

/**
 * Schema for presentation settings.
 * Controls how the presentation behaves during runtime.
 */
export const SettingsSchema = z.object({
  // Start slide (0-indexed)
  startSlide: z.number().min(0).default(0),
  // Loop back to first slide after last
  loop: z.boolean().default(false),
  // Auto-advance slides (ms, 0 = disabled)
  autoAdvance: z.number().min(0).default(0),
  // Show slide numbers
  showSlideNumbers: z.boolean().default(false),
  // Show progress bar
  showProgress: z.boolean().default(false),
})

export type Settings = z.infer<typeof SettingsSchema>

/**
 * Schema for export settings.
 * Controls the output dimensions and quality of exported videos/GIFs.
 */
export const ExportSettingsSchema = z.object({
  // Output width in characters (min 80, max 400)
  width: z.number().min(80).max(400).default(120),
  // Output height in characters (min 24, max 100)
  height: z.number().min(24).max(100).default(40),
  // Frames per second for video (min 10, max 60)
  fps: z.number().min(10).max(60).default(30),
})

export type ExportSettings = z.infer<typeof ExportSettingsSchema>

/**
 * Schema for validating deck configuration (deck.config.ts).
 * Defines the complete configuration for a presentation deck.
 */
export const DeckConfigSchema = z.object({
  // Presentation metadata
  title: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),

  // Theme (already validated Theme object)
  theme: ThemeSchema,

  // Presentation settings
  settings: SettingsSchema.optional(),

  // Export settings
  export: ExportSettingsSchema.optional(),
})

export type DeckConfig = z.infer<typeof DeckConfigSchema>
