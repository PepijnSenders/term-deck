import type blessed from 'neo-blessed'
import type { Theme } from '../../schemas/theme.js'

/**
 * Matrix rain drop.
 * Represents a single falling column of glyphs in the matrix background.
 */
export interface MatrixDrop {
  /** Horizontal position (column) */
  x: number
  /** Vertical position (row, can be fractional for smooth animation) */
  y: number
  /** Fall speed (rows per animation frame) */
  speed: number
  /** Array of glyph characters forming the drop's trail */
  trail: string[]
}

/**
 * Matrix rain state.
 * Manages the matrix rain animation state and resources.
 */
export interface MatrixRainState {
  /** Box element for matrix rain background */
  matrixBox: blessed.Widgets.BoxElement
  /** Array of matrix rain drops for animation */
  matrixDrops: MatrixDrop[]
  /** Interval timer for matrix rain animation (null if stopped) */
  matrixInterval: NodeJS.Timer | null
  /** Active theme for rendering */
  theme: Theme
}

/**
 * Generate a trail of random glyphs.
 * Randomly selects glyphs from the theme's glyph set to form a drop trail.
 *
 * @param glyphs - String of available glyphs to choose from
 * @param length - Number of characters in the trail
 * @returns Array of random glyph characters
 */
function generateTrail(glyphs: string, length: number): string[] {
  return Array.from({ length }, () =>
    glyphs[Math.floor(Math.random() * glyphs.length)]
  )
}

/**
 * Render one frame of matrix rain.
 * Updates the matrix background with falling glyph trails.
 * This function is called repeatedly by the animation interval.
 *
 * @param screen - The blessed screen instance
 * @param state - Matrix rain state
 */
export function renderMatrixRain(
  screen: blessed.Widgets.Screen,
  state: MatrixRainState
): void {
  const { matrixBox, matrixDrops, theme } = state
  const width = Math.max(20, (screen.width as number) || 80)
  const height = Math.max(10, (screen.height as number) || 24)

  // Create grid for positioning characters
  const grid: string[][] = Array.from({ length: height }, () =>
    Array(width).fill(' ')
  )

  // Update and render drops
  for (const drop of matrixDrops) {
    drop.y += drop.speed

    // Reset if off screen
    if (drop.y > height + drop.trail.length) {
      drop.y = -drop.trail.length
      drop.x = Math.floor(Math.random() * width)
    }

    // Draw trail
    for (let i = 0; i < drop.trail.length; i++) {
      const y = Math.floor(drop.y) - i
      if (y >= 0 && y < height && drop.x < width) {
        grid[y][drop.x] = drop.trail[i]
      }
    }
  }

  // Convert grid to string with colors
  let output = ''
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = grid[y][x]
      if (char !== ' ') {
        const brightness = Math.random() > 0.7 ? '{bold}' : ''
        output += `${brightness}{${theme.colors.primary}-fg}${char}{/}`
      } else {
        output += ' '
      }
    }
    if (y < height - 1) output += '\n'
  }

  matrixBox.setContent(output)
}

/**
 * Initialize matrix rain drops.
 * Creates the initial set of drops and starts the animation loop.
 *
 * @param screen - The blessed screen instance
 * @param state - Matrix rain state to initialize
 */
export function initMatrixRain(
  screen: blessed.Widgets.Screen,
  state: MatrixRainState
): void {
  const { theme } = state
  const width = (screen.width as number) || 80
  const height = (screen.height as number) || 24
  const density = theme.animations.matrixDensity

  state.matrixDrops = []

  for (let i = 0; i < density; i++) {
    state.matrixDrops.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      speed: 0.3 + Math.random() * 0.7,
      trail: generateTrail(theme.glyphs, 5 + Math.floor(Math.random() * 10)),
    })
  }

  // Start animation loop
  state.matrixInterval = setInterval(() => {
    renderMatrixRain(screen, state)
    screen.render()
  }, theme.animations.matrixInterval)
}

/**
 * Stop matrix rain animation.
 * Clears the animation interval and resets state.
 *
 * @param state - Matrix rain state to stop
 */
export function stopMatrixRain(state: MatrixRainState): void {
  if (state.matrixInterval) {
    clearInterval(state.matrixInterval)
    state.matrixInterval = null
  }
}

/**
 * Create matrix rain background box.
 * Creates a full-screen box element for the matrix rain effect.
 *
 * @param screen - The blessed screen instance
 * @returns The created matrix box element
 */
export function createMatrixBox(
  screen: blessed.Widgets.Screen
): blessed.Widgets.BoxElement {
  const matrixBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    tags: true,
  })
  screen.append(matrixBox)
  return matrixBox
}
