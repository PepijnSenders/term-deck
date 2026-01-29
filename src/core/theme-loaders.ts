import { readFile, access } from 'fs/promises'
import type { ThemeObject } from './theme'
import type { PartialTheme, Theme } from '../schemas/theme'
import { ThemeSchema } from '../schemas/theme'
import { safeParse } from '../schemas/validation'
import { createTheme, createThemeFromMerge } from './theme'

/**
 * Theme package structure for npm packages or local theme files.
 * Contains the raw YAML source, parsed theme, and package metadata.
 */
export interface ThemePackage {
  /** Raw YAML content of the theme file */
  yaml: string

  /** Parsed and validated theme object */
  theme: ThemeObject

  /** Package metadata */
  meta: {
    /** Package or theme name */
    name: string
    /** Package version */
    version: string
    /** Path to the theme file or package */
    path: string
  }
}

/**
 * Load a theme from a YAML file on the filesystem.
 * Reads the file contents and passes them to createTheme for parsing and validation.
 *
 * @param path - The filesystem path to the YAML theme file
 * @returns A validated ThemeObject with extend() method
 * @throws {Error} If the file cannot be read (e.g., file not found, permission denied)
 * @throws {Error} If the YAML syntax is invalid
 * @throws {ValidationError} If the parsed data doesn't match ThemeSchema
 *
 * @example
 * const theme = await loadThemeFromFile('./themes/matrix.yml')
 * const customTheme = theme.extend({ colors: { primary: '#ff0066' } })
 */
export async function loadThemeFromFile(path: string): Promise<ThemeObject> {
  try {
    await access(path)
  } catch {
    throw new Error(`Theme file not found: ${path}`)
  }

  const content = await readFile(path, 'utf-8')
  return createTheme(content)
}

/**
 * Load a theme from an npm package.
 * Packages must export a default ThemeObject.
 *
 * @param name - The npm package name (e.g., '@term-deck/theme-retro')
 * @returns A validated ThemeObject with extend() method
 * @throws {Error} If the package doesn't export a default theme
 * @throws {Error} If the package is not installed (with helpful install message)
 * @throws {ValidationError} If the exported theme doesn't match ThemeSchema
 *
 * @example
 * const theme = await loadThemeFromPackage('@term-deck/theme-retro')
 * const customTheme = theme.extend({ colors: { primary: '#ff0066' } })
 */
export async function loadThemeFromPackage(name: string): Promise<ThemeObject> {
  try {
    // Dynamic import of npm package
    const pkg = await import(name)

    if (!pkg.default) {
      throw new Error(`Theme package "${name}" must export a default theme`)
    }

    // Validate the exported theme
    const validated = safeParse(ThemeSchema, pkg.default, `theme from ${name}`)

    return {
      ...validated,
      extend(overrides: PartialTheme): ThemeObject {
        return createThemeFromMerge(validated, overrides)
      },
    }
  } catch (error) {
    // Handle module not found with helpful message
    const err = error as { message?: string; code?: string }
    const isModuleNotFound =
      err.message?.includes('Cannot find package') ||
      err.message?.includes('Cannot find module') ||
      err.message?.includes('Failed to load url') ||
      err.code === 'MODULE_NOT_FOUND' ||
      err.code === 'ERR_MODULE_NOT_FOUND'

    if (isModuleNotFound) {
      throw new Error(
        `Theme package "${name}" not found. Install it with: npm install ${name}`
      )
    }
    throw error
  }
}
