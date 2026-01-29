import { z, ZodError } from 'zod'

/**
 * Custom error class for validation failures.
 * Extends Error with a specific name for easy identification.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Format Zod errors into user-friendly messages.
 * Formats each issue with its field path and message.
 *
 * @param error - The ZodError to format
 * @param context - A description of what was being validated (e.g., "theme", "slide frontmatter")
 * @returns A formatted string with all validation issues
 *
 * @example
 * const error = new ZodError([...])
 * formatZodError(error, 'theme')
 * // Returns:
 * // "Invalid theme:
 * //   - colors.primary: Color must be a valid hex color (e.g., #ff0066)
 * //   - name: Theme name is required"
 */
export function formatZodError(error: ZodError, context: string): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.')
    return `  - ${path ? `${path}: ` : ''}${issue.message}`
  })

  return `Invalid ${context}:\n${issues.join('\n')}`
}

/**
 * Parse data with a Zod schema and throw a ValidationError with friendly messages on failure.
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @param context - A description of what's being validated (e.g., "theme", "slide frontmatter")
 * @returns The parsed and validated data
 * @throws {ValidationError} If validation fails
 *
 * @example
 * const theme = safeParse(ThemeSchema, rawData, 'theme')
 * // Throws ValidationError with formatted message if invalid
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new ValidationError(formatZodError(result.error, context))
  }

  return result.data
}
