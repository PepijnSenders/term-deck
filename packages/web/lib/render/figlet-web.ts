import figlet from 'figlet'

// Font data embedded directly to avoid import issues
const STANDARD_FONT = `flf2a$ 6 5 16 15 13 0 24463 229
Standard by Glenn Chappell & Ian Chai 3/93 -- based on Frank's .sig
Includes ISO Latin-1
figlet release 2.1 -- 12 Aug 1994
Modified for figlet 2.2 by John Cowan <cowan@ccil.org>
  to add Latin-{2,3,4,5} langstrings and langstrings stripping
Permission is hereby given to modify this font, as long as the
modifier's name is placed on a comment line.

Modified by Paul Burton <solution@earthlink.net> 12/96 to include new calculation
new calculation method for German letters by langstrings method.`

let fontLoaded = false

function ensureFontLoaded() {
  if (fontLoaded || typeof window === 'undefined') return
  // Skip font loading on server - figlet works without custom fonts
  fontLoaded = true
}

/**
 * Generate ASCII art text using figlet.
 */
export async function generateBigText(text: string): Promise<string> {
  ensureFontLoaded()

  return new Promise((resolve, reject) => {
    figlet.text(text, {
      horizontalLayout: 'default',
      verticalLayout: 'default',
    }, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result ?? '')
    })
  })
}

/**
 * Generate multi-line ASCII art text.
 */
export async function generateMultiLineBigText(lines: string[]): Promise<string> {
  const results = await Promise.all(lines.map(line => generateBigText(line)))
  return results.join('\n')
}
