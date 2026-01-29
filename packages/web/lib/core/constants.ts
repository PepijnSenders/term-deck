/**
 * Characters used for glitch effect.
 * These characters create a cyberpunk glitch aesthetic when scrambling text.
 */
export const GLITCH_CHARS =
  '█▓▒░▀▄▌▐■□▪▫●○◊◘◙♦♣♠♥★☆⌂ⁿ²³ÆØ∞≈≠±×÷αβγδεζηθλμπσφωΔΣΩｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ'

/**
 * Characters to never glitch.
 * Protects structural characters like spaces, punctuation, box drawing.
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
