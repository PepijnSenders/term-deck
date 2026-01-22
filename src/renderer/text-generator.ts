import figlet from 'figlet'
import gradient from 'gradient-string'

/**
 * Generate ASCII art text with gradient.
 * Uses figlet to convert text to ASCII art and applies a gradient color effect.
 * This function is asynchronous because figlet uses a callback-based API.
 *
 * @param text - The text to convert to ASCII art
 * @param gradientColors - Array of hex colors for the gradient effect
 * @param font - Figlet font to use (defaults to 'Standard')
 * @returns Promise resolving to the gradient-colored ASCII art text
 */
export async function generateBigText(
  text: string,
  gradientColors: string[],
  font: string = 'Standard'
): Promise<string> {
  return new Promise((resolve, reject) => {
    figlet.text(text, { font }, (err, result) => {
      if (err || !result) {
        reject(err ?? new Error('Failed to generate figlet text'))
        return
      }

      // Apply gradient
      const gradientFn = gradient(gradientColors)
      resolve(gradientFn(result))
    })
  })
}

/**
 * Generate multi-line big text (for arrays like ['SPEC', 'MACHINE']).
 * Creates ASCII art for each line separately and joins them with newlines.
 * Each line gets the same gradient applied independently.
 *
 * @param lines - Array of text strings to convert to ASCII art
 * @param gradientColors - Array of hex colors for the gradient effect
 * @param font - Figlet font to use (defaults to 'Standard')
 * @returns Promise resolving to the combined gradient-colored ASCII art
 */
export async function generateMultiLineBigText(
  lines: string[],
  gradientColors: string[],
  font: string = 'Standard'
): Promise<string> {
  const results = await Promise.all(
    lines.map((line) => generateBigText(line, gradientColors, font))
  )
  return results.join('\n')
}
