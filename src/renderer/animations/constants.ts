/**
 * Characters used for glitch effect (avoiding box drawing).
 * These characters create a cyberpunk glitch aesthetic when scrambling text.
 * Includes: block characters, shapes, math symbols, Greek letters, and katakana.
 */
export const GLITCH_CHARS =
  '█▓▒░▀▄▌▐■□▪▫●○◊◘◙♦♣♠♥★☆⌂ⁿ²³ÆØ∞≈≠±×÷αβγδεζηθλμπσφωΔΣΩｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'

/**
 * Characters to never glitch.
 * Protects structural characters like spaces, punctuation, box drawing,
 * and arrows to maintain readability and layout integrity during glitch effects.
 */
export const PROTECTED_CHARS = new Set([
  ' ', '\t', '\n', '{', '}', '-', '/', '#', '[', ']', '(', ')', ':', ';',
  ',', '.', '!', '?', "'", '"', '`', '_', '|', '\\', '<', '>', '=', '+',
  '*', '&', '^', '%', '$', '@', '~',
  // Box drawing
  '┌', '┐', '└', '┘', '│', '─', '├', '┤', '┬', '┴', '┼', '═', '║',
  '╔', '╗', '╚', '╝', '╠', '╣', '╦', '╩', '╬', '╭', '╮', '╯', '╰',
  // Arrows
  '→', '←', '↑', '↓', '▶', '◀', '▲', '▼', '►', '◄',
])
