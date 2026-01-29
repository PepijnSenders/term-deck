/**
 * Screen Type Extensions
 *
 * This module extends the blessed Screen type to include properties that
 * exist at runtime but aren't typed in the @types/blessed package.
 */

import type blessed from 'neo-blessed';

/**
 * Extended Screen interface that includes width and height properties.
 * These properties exist on blessed Screen objects at runtime but aren't
 * included in the TypeScript type definitions.
 */
export interface ExtendedScreen extends blessed.Widgets.Screen {
  width: number
  height: number
}

/**
 * Type guard to check if a screen has width and height properties
 */
export function hasScreenDimensions(
  screen: blessed.Widgets.Screen
): screen is ExtendedScreen {
  return (
    typeof (screen as any).width === 'number' &&
    typeof (screen as any).height === 'number'
  );
}

/**
 * Safely set screen dimensions
 *
 * @param screen - Blessed screen instance
 * @param width - Width in characters
 * @param height - Height in characters
 */
export function setScreenDimensions(
  screen: blessed.Widgets.Screen,
  width: number,
  height: number
): void {
  (screen as ExtendedScreen).width = width;
  (screen as ExtendedScreen).height = height;
}
