import { describe, it, expect } from 'bun:test'
import { z, ZodError } from 'zod'
import { ValidationError, formatZodError, safeParse } from '../validation'

describe('ValidationError', () => {
  it('extends Error', () => {
    const error = new ValidationError('test message')
    expect(error).toBeInstanceOf(Error)
  })

  it('has name "ValidationError"', () => {
    const error = new ValidationError('test message')
    expect(error.name).toBe('ValidationError')
  })

  it('stores the message', () => {
    const error = new ValidationError('Something went wrong')
    expect(error.message).toBe('Something went wrong')
  })

  it('can be caught as Error', () => {
    let caught: Error | null = null
    try {
      throw new ValidationError('test')
    } catch (e) {
      if (e instanceof Error) {
        caught = e
      }
    }
    expect(caught).not.toBeNull()
    expect(caught?.name).toBe('ValidationError')
  })

  it('can be identified by instanceof', () => {
    const error = new ValidationError('test')
    expect(error instanceof ValidationError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })
})

describe('formatZodError', () => {
  it('formats single field error with path', () => {
    const schema = z.object({
      name: z.string().min(1, { message: 'Name is required' }),
    })
    const result = schema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'config')
      expect(formatted).toBe('Invalid config:\n  - name: Name is required')
    }
  })

  it('formats nested field error with dotted path', () => {
    const schema = z.object({
      colors: z.object({
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, {
          message: 'Must be a valid hex color',
        }),
      }),
    })
    const result = schema.safeParse({ colors: { primary: 'red' } })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'theme')
      expect(formatted).toBe('Invalid theme:\n  - colors.primary: Must be a valid hex color')
    }
  })

  it('formats multiple errors', () => {
    const schema = z.object({
      name: z.string().min(1, { message: 'Name is required' }),
      age: z.number().min(0, { message: 'Age must be positive' }),
    })
    const result = schema.safeParse({ name: '', age: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'person')
      expect(formatted).toContain('Invalid person:')
      expect(formatted).toContain('name: Name is required')
      expect(formatted).toContain('age: Age must be positive')
    }
  })

  it('formats error without path (root level)', () => {
    const schema = z.string().min(1, { message: 'Value is required' })
    const result = schema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'input')
      expect(formatted).toBe('Invalid input:\n  - Value is required')
    }
  })

  it('formats deeply nested paths', () => {
    const schema = z.object({
      settings: z.object({
        display: z.object({
          theme: z.object({
            color: z.string().min(1, { message: 'Color is required' }),
          }),
        }),
      }),
    })
    const result = schema.safeParse({
      settings: { display: { theme: { color: '' } } },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'config')
      expect(formatted).toContain('settings.display.theme.color: Color is required')
    }
  })

  it('formats array index in path', () => {
    const schema = z.object({
      items: z.array(z.string().min(1, { message: 'Item cannot be empty' })),
    })
    const result = schema.safeParse({ items: ['valid', ''] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'list')
      expect(formatted).toContain('items.1: Item cannot be empty')
    }
  })

  it('includes context in error message', () => {
    const schema = z.object({ name: z.string() })
    const result = schema.safeParse({ name: 123 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const formatted = formatZodError(result.error, 'slide frontmatter')
      expect(formatted).toStartWith('Invalid slide frontmatter:')
    }
  })
})

describe('safeParse', () => {
  it('returns parsed data for valid input', () => {
    const schema = z.object({
      name: z.string(),
      count: z.number().default(0),
    })
    const result = safeParse(schema, { name: 'test' }, 'config')
    expect(result).toEqual({ name: 'test', count: 0 })
  })

  it('applies schema defaults', () => {
    const schema = z.object({
      enabled: z.boolean().default(true),
      value: z.number().default(42),
    })
    const result = safeParse(schema, {}, 'settings')
    expect(result).toEqual({ enabled: true, value: 42 })
  })

  it('throws ValidationError for invalid input', () => {
    const schema = z.object({
      name: z.string().min(1),
    })
    expect(() => safeParse(schema, { name: '' }, 'config')).toThrow(ValidationError)
  })

  it('thrown error contains formatted message', () => {
    const schema = z.object({
      email: z.string().email({ message: 'Invalid email format' }),
    })
    try {
      safeParse(schema, { email: 'not-an-email' }, 'user')
      expect(true).toBe(false) // Should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      if (e instanceof ValidationError) {
        expect(e.message).toContain('Invalid user:')
        expect(e.message).toContain('email: Invalid email format')
      }
    }
  })

  it('thrown error has name ValidationError', () => {
    const schema = z.number()
    try {
      safeParse(schema, 'not a number', 'value')
      expect(true).toBe(false) // Should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      if (e instanceof ValidationError) {
        expect(e.name).toBe('ValidationError')
      }
    }
  })

  it('works with complex schemas', () => {
    const schema = z.object({
      name: z.string().min(1),
      colors: z.object({
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
      settings: z.object({
        enabled: z.boolean().default(false),
      }).optional(),
    })

    const validData = {
      name: 'test',
      colors: {
        primary: '#ff0066',
        accent: '#00ff66',
      },
    }

    const result = safeParse(schema, validData, 'theme')
    expect(result.name).toBe('test')
    expect(result.colors.primary).toBe('#ff0066')
    expect(result.settings).toBeUndefined()
  })

  it('preserves type inference', () => {
    const schema = z.object({
      count: z.number(),
      name: z.string(),
      items: z.array(z.string()),
    })
    const result = safeParse(schema, { count: 5, name: 'test', items: ['a', 'b'] }, 'data')

    // Type inference test - these should compile without errors
    const count: number = result.count
    const name: string = result.name
    const items: string[] = result.items

    expect(count).toBe(5)
    expect(name).toBe('test')
    expect(items).toEqual(['a', 'b'])
  })

  it('handles union types', () => {
    const schema = z.object({
      value: z.union([z.string(), z.array(z.string())]),
    })

    const stringResult = safeParse(schema, { value: 'hello' }, 'config')
    expect(stringResult.value).toBe('hello')

    const arrayResult = safeParse(schema, { value: ['a', 'b'] }, 'config')
    expect(arrayResult.value).toEqual(['a', 'b'])
  })

  it('rejects invalid union types with clear error', () => {
    const schema = z.object({
      value: z.union([z.string(), z.number()]),
    })

    expect(() => safeParse(schema, { value: [] }, 'config')).toThrow(ValidationError)
  })
})
