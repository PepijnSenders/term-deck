/**
 * Screen Capture Module
 *
 * Handles capturing blessed screen content to various formats.
 * Separated from recorder.ts to follow Single Responsibility Principle.
 */

import { hexToAnsi256, extractColor } from '../utils/color-conversion.js';
import type { VirtualTerminal } from '../utils/virtual-terminal.js';

/**
 * Capture blessed screen content to virtual terminal
 *
 * This parses the blessed screen's internal buffer and writes it to a VirtualTerminal.
 * Each cell contains a character and color information that gets extracted and applied.
 *
 * @param screen - The neo-blessed screen to capture
 * @param vt - The virtual terminal to write to
 */
export function captureScreen(
  screen: any, // neo-blessed screen type
  vt: VirtualTerminal
): void {
  const lines = screen.lines || [];

  for (let y = 0; y < Math.min(lines.length, vt.height); y++) {
    const line = lines[y];
    if (!line) continue;

    for (let x = 0; x < Math.min(line.length, vt.width); x++) {
      const cell = line[x];
      if (!cell) continue;

      // Cell format: [char, attr] or just char
      const char = Array.isArray(cell) ? cell[0] : cell;
      const attr = Array.isArray(cell) ? cell[1] : null;

      // Extract color from attr (blessed-specific format)
      const color = extractColor(attr) || '#ffffff';

      vt.setChar(x, y, char || ' ', color);
    }
  }
}

/**
 * Capture blessed screen content as ANSI escape sequence string
 *
 * This generates a string with ANSI color codes that can be played back
 * in a terminal or saved to an asciicast file.
 *
 * @param screen - The neo-blessed screen to capture
 * @returns ANSI-encoded string representation of the screen
 */
export function captureScreenAsAnsi(screen: any): string {
  const lines = screen.lines || [];
  const output: string[] = [];

  // Clear screen and reset cursor
  output.push('\x1b[2J\x1b[H');

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y];
    if (!line) {
      output.push('\n');
      continue;
    }

    let lineStr = '';
    let lastColor: string | null = null;

    for (let x = 0; x < line.length; x++) {
      const cell = line[x];
      if (!cell) {
        lineStr += ' ';
        continue;
      }

      // Cell format: [char, attr] or just char
      const char = Array.isArray(cell) ? cell[0] : cell;
      const attr = Array.isArray(cell) ? cell[1] : null;

      // Extract color
      const color = extractColor(attr);

      // Apply color if changed
      if (color && color !== lastColor) {
        // Convert hex to ANSI 256-color code
        lineStr += hexToAnsi256(color);
        lastColor = color;
      }

      lineStr += char || ' ';
    }

    // Reset color at end of line
    if (lastColor) {
      lineStr += '\x1b[0m';
    }

    output.push(lineStr);
    if (y < lines.length - 1) {
      output.push('\n');
    }
  }

  return output.join('');
}
