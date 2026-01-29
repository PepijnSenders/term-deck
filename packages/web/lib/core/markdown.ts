/**
 * Process markdown syntax in slide content.
 * Converts markdown to HTML-safe content for rendering.
 */

/**
 * Process code blocks (``` ... ```)
 * Returns content with code blocks wrapped in pre tags
 */
export function processCodeBlocks(content: string): string {
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g

  return content.replace(codeBlockPattern, (_match, _lang, code) => {
    const escaped = code.trimEnd()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre class="code-block">${escaped}</pre>`
  })
}

/**
 * Process inline markdown formatting
 * Converts **bold**, *italic*, `code`, etc.
 */
export function processMarkdownInline(content: string): string {
  let result = content

  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  result = result.replace(/(?<![*\w])\*([^*]+)\*(?![*\w])/g, '<em>$1</em>')
  result = result.replace(/(?<![_\w])_([^_]+)_(?![_\w])/g, '<em>$1</em>')

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Strikethrough: ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // Headers: # Header (convert to bold)
  result = result.replace(/^(#{1,6})\s+(.+)$/gm, '<strong>$2</strong>')

  // Horizontal rules: --- or *** or ___
  result = result.replace(/^[-*_]{3,}$/gm, '<hr class="my-2 border-current opacity-30" />')

  // Lists: - item or * item
  result = result.replace(/^[\s]*[-*+]\s+(.+)$/gm, '  • $1')

  // Numbered lists: 1. item
  result = result.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '  $1. $2')

  return result
}

/**
 * Full markdown processing pipeline
 */
export function processMarkdown(content: string): string {
  let result = content

  // Process code blocks first (before inline processing)
  result = processCodeBlocks(result)

  // Process inline markdown
  result = processMarkdownInline(result)

  return result
}
