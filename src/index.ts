/**
 * Public API for term-deck
 *
 * Exports functions and types for use in deck.config.ts files
 * and external integrations.
 */

import { DeckConfigSchema, type DeckConfig } from './schemas/config.js';
import { type Theme } from './schemas/theme.js';
import { type Slide, type SlideFrontmatter } from './schemas/slide.js';
import { createTheme, type ThemeObject } from './core/theme.js';

/**
 * Define deck configuration with validation
 *
 * Usage in deck.config.ts:
 * ```typescript
 * import { defineConfig } from 'term-deck'
 * import matrix from '@term-deck/theme-matrix'
 *
 * export default defineConfig({
 *   title: 'My Presentation',
 *   theme: matrix,
 * })
 * ```
 */
export function defineConfig(config: DeckConfig): DeckConfig {
  return DeckConfigSchema.parse(config);
}

// Re-export theme creation
export { createTheme };
export type { ThemeObject };

// Re-export built-in themes
export { default as matrix } from './themes/matrix/index.js';

// Re-export types for consumers
export type { DeckConfig, Theme, Slide, SlideFrontmatter };
