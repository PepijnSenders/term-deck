// File size limits
export const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1MB per file
export const MAX_TOTAL_SIZE = 5 * 1024 * 1024 // 5MB total

// Allowed file extensions (case-insensitive)
export const ALLOWED_EXTENSIONS = ['.md', '.markdown']

// Allowed MIME types for markdown files
// SECURITY: Do NOT add 'application/octet-stream' - it's overly permissive
// and would allow any file type to bypass MIME validation
export const ALLOWED_MIME_TYPES = [
  'text/markdown',
  'text/x-markdown',
  'text/plain', // Some systems report .md as text/plain
]

export function isAllowedFile(filename: string): boolean {
  const lowerName = filename.toLowerCase()
  return ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType)
}

/**
 * SECURITY: Validate that content is actually text, not binary data.
 * This prevents attacks where a malicious file is renamed to .md.
 *
 * Checks for:
 * 1. Null bytes (definite binary indicator)
 * 2. Ratio of printable characters (text files should be nearly 100%)
 *
 * Allows: ASCII printable (32-126), tabs, newlines, carriage returns,
 * and all unicode characters (> 127) including emojis.
 */
export function isValidTextContent(content: string): boolean {
  // Empty content is valid (edge case)
  if (content.length === 0) {
    return true
  }

  // Check for null bytes which indicate binary content
  if (content.includes('\0')) {
    return false
  }

  // Check that a reasonable portion of the content is printable
  // Binary files typically have many unprintable characters
  const printableCount = content.split('').filter(char => {
    const code = char.charCodeAt(0)
    // Allow: printable ASCII, tabs, newlines, carriage returns, and all unicode (including emojis)
    return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || code > 127
  }).length

  const printableRatio = printableCount / content.length

  // Require at least 90% printable characters (markdown files should be nearly 100%)
  return printableRatio >= 0.9
}
