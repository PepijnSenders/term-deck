import { z } from 'zod'

/**
 * Schema for validating hex color strings.
 * Accepts 6-digit hex colors with # prefix (e.g., #ff0066)
 */
export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  message: 'Color must be a valid hex color (e.g., #ff0066)',
})

export type HexColor = z.infer<typeof HexColorSchema>

/**
 * Schema for validating gradient color arrays.
 * A gradient requires at least 2 hex colors.
 */
export const GradientSchema = z.array(HexColorSchema).min(2, {
  message: 'Gradient must have at least 2 colors',
})

export type Gradient = z.infer<typeof GradientSchema>

/**
 * Schema for validating theme objects.
 * Defines the visual appearance of the presentation deck.
 */
export const ThemeSchema = z.object({
  // Theme metadata
  name: z.string().min(1, { message: 'Theme name is required' }),
  description: z.string().optional(),
  author: z.string().optional(),
  version: z.string().optional(),

  // Color palette
  colors: z.object({
    primary: HexColorSchema,
    secondary: HexColorSchema.optional(),
    accent: HexColorSchema,
    background: HexColorSchema,
    text: HexColorSchema,
    muted: HexColorSchema,
    success: HexColorSchema.optional(),
    warning: HexColorSchema.optional(),
    error: HexColorSchema.optional(),
  }),

  // Named gradients for bigText
  gradients: z.record(z.string(), GradientSchema).refine(
    (g) => Object.keys(g).length >= 1,
    { message: 'At least one gradient must be defined' }
  ),

  // Glyph set for matrix rain background
  glyphs: z.string().min(10, {
    message: 'Glyph set must have at least 10 characters',
  }),

  // Animation settings
  animations: z.object({
    // Speed multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed)
    revealSpeed: z.number().min(0.1).max(5.0).default(1.0),
    // Matrix rain density (number of drops)
    matrixDensity: z.number().min(10).max(200).default(50),
    // Glitch effect iterations
    glitchIterations: z.number().min(1).max(20).default(5),
    // Delay between lines during reveal (ms)
    lineDelay: z.number().min(0).max(500).default(30),
    // Matrix rain update interval (ms)
    matrixInterval: z.number().min(20).max(200).default(80),
  }),

  // Window appearance
  window: z.object({
    // Border style
    borderStyle: z.enum(['line', 'double', 'rounded', 'none']).default('line'),
    // Shadow effect
    shadow: z.boolean().default(true),
    // Padding inside windows
    padding: z.object({
      top: z.number().min(0).max(5).default(1),
      bottom: z.number().min(0).max(5).default(1),
      left: z.number().min(0).max(10).default(2),
      right: z.number().min(0).max(10).default(2),
    }).optional(),
  }).optional(),
})

export type Theme = z.infer<typeof ThemeSchema>

// ============================================================================
// Color Token System
// ============================================================================

/**
 * Valid color tokens for inline styling in slide body content.
 * Tokens can be either:
 * - Built-in colors: GREEN, ORANGE, CYAN, PINK, WHITE, GRAY
 * - Theme-mapped colors: PRIMARY, SECONDARY, ACCENT, MUTED, TEXT, BACKGROUND
 *
 * Usage in slides: {GREEN}colored text{/}
 */
export const ColorTokens = [
  'GREEN',
  'ORANGE',
  'CYAN',
  'PINK',
  'WHITE',
  'GRAY',
  'PRIMARY',    // Maps to theme.colors.primary
  'SECONDARY',  // Maps to theme.colors.secondary
  'ACCENT',     // Maps to theme.colors.accent
  'MUTED',      // Maps to theme.colors.muted
  'TEXT',       // Maps to theme.colors.text
  'BACKGROUND', // Maps to theme.colors.background
] as const

/**
 * Type for valid color token names.
 */
export type ColorToken = typeof ColorTokens[number]

/**
 * Pattern for matching color tokens in slide content.
 * Matches: {GREEN}, {ORANGE}, {CYAN}, {PINK}, {WHITE}, {GRAY},
 *          {PRIMARY}, {SECONDARY}, {ACCENT}, {MUTED}, {TEXT}, {BACKGROUND}, {/}
 *
 * The {/} token closes any open color tag.
 */
export const COLOR_TOKEN_PATTERN = /\{(GREEN|ORANGE|CYAN|PINK|WHITE|GRAY|PRIMARY|SECONDARY|ACCENT|MUTED|TEXT|BACKGROUND|\/)\}/g

// ============================================================================
// Partial Theme for Extension
// ============================================================================

/**
 * Deep partial utility type that makes all nested properties optional.
 * Used for theme extension where only specific fields need to be overridden.
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

/**
 * Partial theme type for use with theme.extend() functionality.
 * All fields (including nested) become optional.
 */
export type PartialTheme = DeepPartial<Theme>

/**
 * Schema for validating partial theme objects.
 * All fields become optional recursively, allowing partial overrides.
 * Used for theme extension validation.
 */
export const PartialThemeSchema = ThemeSchema.deepPartial()

// ============================================================================
// Default Theme
// ============================================================================

/**
 * Default matrix/cyberpunk theme.
 * Used when no theme is specified or as a base for theme extension.
 */
export const DEFAULT_THEME: Theme = {
  name: 'matrix',
  description: 'Default cyberpunk/matrix theme',

  colors: {
    primary: '#00cc66',
    accent: '#ff6600',
    background: '#0a0a0a',
    text: '#ffffff',
    muted: '#666666',
  },

  gradients: {
    fire: ['#ff6600', '#ff3300', '#ff0066'],
    cool: ['#00ccff', '#0066ff', '#6600ff'],
    pink: ['#ff0066', '#ff0099', '#cc00ff'],
    hf: ['#99cc00', '#00cc66', '#00cccc'],
  },

  glyphs: 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789',

  animations: {
    revealSpeed: 1.0,
    matrixDensity: 50,
    glitchIterations: 5,
    lineDelay: 30,
    matrixInterval: 80,
  },

  window: {
    borderStyle: 'line',
    shadow: true,
    padding: {
      top: 1,
      bottom: 1,
      left: 2,
      right: 2,
    },
  },
}
