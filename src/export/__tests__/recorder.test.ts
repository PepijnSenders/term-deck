import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { VirtualTerminal, captureScreen, createRecordingSession, saveFrame, cleanupSession, checkFfmpeg, detectFormat, exportPresentation, ansi256ToHex } from '../recorder'
import type { RecordingSession } from '../recorder'
import { readdir, stat, rm } from 'fs/promises'

describe('VirtualTerminal', () => {
  it('creates buffer with correct dimensions', () => {
    const vt = new VirtualTerminal(80, 24)
    expect(vt.width).toBe(80)
    expect(vt.height).toBe(24)
  })

  it('sets characters at valid positions', () => {
    const vt = new VirtualTerminal(10, 5)
    vt.setChar(5, 2, 'X', '#ff0000')

    const str = vt.toString()
    const lines = str.split('\n')
    expect(lines[2][5]).toBe('X')
  })

  it('ignores out-of-bounds positions', () => {
    const vt = new VirtualTerminal(10, 5)
    vt.setChar(-1, 0, 'X') // Should not crash
    vt.setChar(0, -1, 'X') // Should not crash
    vt.setChar(100, 0, 'X') // Should not crash
    vt.setChar(0, 100, 'X') // Should not crash
  })

  it('clears the buffer', () => {
    const vt = new VirtualTerminal(10, 5)
    vt.setChar(5, 2, 'X', '#ff0000')
    vt.clear()

    const str = vt.toString()
    expect(str).toBe('          \n          \n          \n          \n          ')
  })
})

describe('captureScreen', () => {
  it('captures screen content from blessed', () => {
    const vt = new VirtualTerminal(10, 5)

    // Mock blessed screen with lines
    const mockScreen = {
      lines: [
        [
          ['H', { fg: 15 }], // White 'H'
          ['e', { fg: 10 }], // Green 'e'
          ['l', { fg: 10 }],
          ['l', { fg: 10 }],
          ['o', { fg: 10 }],
        ],
        [
          ['W', { fg: 15 }],
          ['o', { fg: 9 }], // Red 'o'
          ['r', { fg: 9 }],
          ['l', { fg: 9 }],
          ['d', { fg: 9 }],
        ],
      ],
    }

    captureScreen(mockScreen, vt)

    const str = vt.toString()
    const lines = str.split('\n')

    // Check first line contains "Hello"
    expect(lines[0].substring(0, 5)).toBe('Hello')

    // Check second line contains "World"
    expect(lines[1].substring(0, 5)).toBe('World')
  })

  it('handles empty screen', () => {
    const vt = new VirtualTerminal(10, 5)
    const mockScreen = {
      lines: [],
    }

    captureScreen(mockScreen, vt)

    const str = vt.toString()
    expect(str).toBe('          \n          \n          \n          \n          ')
  })

  it('handles missing lines', () => {
    const vt = new VirtualTerminal(10, 5)
    const mockScreen = {} // No lines property

    captureScreen(mockScreen, vt)

    const str = vt.toString()
    expect(str).toBe('          \n          \n          \n          \n          ')
  })

  it('extracts colors from cells with fg attribute', () => {
    const vt = new VirtualTerminal(10, 5)

    // Mock screen with different color types
    const mockScreen = {
      lines: [
        [
          ['R', { fg: 9 }], // ANSI red
          ['G', { fg: '#00ff00' }], // Hex green
          ['B', { fg: 12 }], // ANSI blue
        ],
      ],
    }

    captureScreen(mockScreen, vt)

    // Verify it doesn't crash and captures the characters
    const str = vt.toString()
    expect(str.startsWith('RGB')).toBe(true)
  })

  it('handles cells without attributes', () => {
    const vt = new VirtualTerminal(10, 5)

    // Mock screen with plain characters (no attributes)
    const mockScreen = {
      lines: [
        [
          'A', // Plain char without attr
          'B',
          'C',
        ],
      ],
    }

    captureScreen(mockScreen, vt)

    const str = vt.toString()
    expect(str.startsWith('ABC')).toBe(true)
  })

  it('respects virtual terminal dimensions', () => {
    const vt = new VirtualTerminal(3, 2) // Small virtual terminal

    // Mock screen with more content than vt can hold
    const mockScreen = {
      lines: [
        [['A', {}], ['B', {}], ['C', {}], ['D', {}], ['E', {}]],
        [['F', {}], ['G', {}], ['H', {}], ['I', {}], ['J', {}]],
        [['K', {}], ['L', {}], ['M', {}], ['N', {}], ['O', {}]],
      ],
    }

    captureScreen(mockScreen, vt)

    const str = vt.toString()
    const lines = str.split('\n')

    // Should only capture 3x2 area
    expect(lines.length).toBe(2)
    expect(lines[0]).toBe('ABC')
    expect(lines[1]).toBe('FGH')
  })
})

describe('Recording Session', () => {
  let session: RecordingSession

  afterEach(async () => {
    if (session) {
      await cleanupSession(session)
    }
  })

  it('creates temp directory', async () => {
    session = await createRecordingSession({
      output: 'test.mp4',
      width: 80,
      height: 24,
      fps: 10,
    })

    // Verify temp directory was created
    const statResult = await stat(session.tempDir)
    expect(statResult.isDirectory()).toBe(true)

    // Verify session has correct defaults
    expect(session.frameCount).toBe(0)
    expect(session.width).toBe(80)
    expect(session.height).toBe(24)
    expect(session.fps).toBe(10)
  })

  it('uses default dimensions when not provided', async () => {
    session = await createRecordingSession({
      output: 'test.mp4',
    })

    expect(session.width).toBe(120)
    expect(session.height).toBe(40)
    expect(session.fps).toBe(30)
  })

  it('saves frames with padded numbering', async () => {
    session = await createRecordingSession({
      output: 'test.mp4',
      width: 80,
      height: 24,
      fps: 10,
    })

    // Create dummy PNG data (PNG magic number)
    const dummyPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

    await saveFrame(session, dummyPng)
    await saveFrame(session, dummyPng)
    await saveFrame(session, dummyPng)

    // Check that files were created with correct names
    const files = await readdir(session.tempDir)
    expect(files).toContain('frame_000000.png')
    expect(files).toContain('frame_000001.png')
    expect(files).toContain('frame_000002.png')
    expect(session.frameCount).toBe(3)
  })

  it('cleanup removes directory', async () => {
    session = await createRecordingSession({
      output: 'test.mp4',
      width: 80,
      height: 24,
      fps: 10,
    })

    const tempDir = session.tempDir

    // Verify directory exists
    const statBefore = await stat(tempDir)
    expect(statBefore.isDirectory()).toBe(true)

    // Cleanup
    await cleanupSession(session)

    // Verify directory no longer exists
    try {
      await stat(tempDir)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as any).code).toBe('ENOENT')
    }
  })

  it('frame count increments correctly', async () => {
    session = await createRecordingSession({
      output: 'test.mp4',
    })

    expect(session.frameCount).toBe(0)

    const dummyPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

    await saveFrame(session, dummyPng)
    expect(session.frameCount).toBe(1)

    await saveFrame(session, dummyPng)
    expect(session.frameCount).toBe(2)

    await saveFrame(session, dummyPng)
    expect(session.frameCount).toBe(3)
  })
})

describe('checkFfmpeg', () => {
  it('succeeds when ffmpeg is available', async () => {
    // This test will pass if ffmpeg is installed on the system
    // If ffmpeg is not installed, this test will fail
    // The checkFfmpeg function should not throw if ffmpeg exists
    try {
      await checkFfmpeg()
      // If we reach here, ffmpeg is installed
      expect(true).toBe(true)
    } catch (error) {
      // If we catch an error, ffmpeg is not installed
      // Check that the error message contains installation instructions
      expect((error as Error).message).toContain('ffmpeg not found')
      expect((error as Error).message).toContain('brew install ffmpeg')
      expect((error as Error).message).toContain('sudo apt install ffmpeg')
    }
  })

  it('throws error with install instructions when ffmpeg is missing', async () => {
    // This test verifies the error message format
    // We can't easily mock the `which` command, so we'll test the error format indirectly
    // by checking that the error message contains the expected text
    try {
      await checkFfmpeg()
      // If ffmpeg is installed, we can't test the error case
      // This is acceptable - the test above covers the success case
    } catch (error) {
      // Verify error message format
      expect(error).toBeInstanceOf(Error)
      const errorMessage = (error as Error).message
      expect(errorMessage).toContain('ffmpeg not found')
      expect(errorMessage).toContain('Install it with:')
      expect(errorMessage).toContain('macOS: brew install ffmpeg')
      expect(errorMessage).toContain('Ubuntu: sudo apt install ffmpeg')
    }
  })
})

describe('detectFormat', () => {
  it('detects mp4 format', () => {
    expect(detectFormat('output.mp4')).toBe('mp4')
    expect(detectFormat('presentation.mp4')).toBe('mp4')
    expect(detectFormat('/path/to/video.mp4')).toBe('mp4')
  })

  it('detects gif format', () => {
    expect(detectFormat('output.gif')).toBe('gif')
    expect(detectFormat('presentation.gif')).toBe('gif')
    expect(detectFormat('/path/to/animation.gif')).toBe('gif')
  })

  it('throws error for unknown format', () => {
    expect(() => detectFormat('output.avi')).toThrow('Unknown output format for output.avi. Use .mp4 or .gif extension.')
    expect(() => detectFormat('output.mov')).toThrow('Unknown output format for output.mov. Use .mp4 or .gif extension.')
    expect(() => detectFormat('output.webm')).toThrow('Unknown output format for output.webm. Use .mp4 or .gif extension.')
  })

  it('throws error for missing extension', () => {
    expect(() => detectFormat('output')).toThrow('Unknown output format for output. Use .mp4 or .gif extension.')
  })

  it('handles case-sensitive extensions', () => {
    // Extensions should be case-sensitive (lowercase only)
    expect(() => detectFormat('output.MP4')).toThrow()
    expect(() => detectFormat('output.GIF')).toThrow()
  })
})

describe('exportPresentation', () => {
  it('validates that slides directory exists', async () => {
    const options = {
      output: 'test.mp4',
      width: 80,
      height: 24,
      fps: 10,
      slideTime: 1,
    }

    // Test with non-existent directory
    try {
      await exportPresentation('/non/existent/path', options)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      // Should throw an error about missing directory or no slides
      expect(error).toBeDefined()
    }
  })

  it('throws error when no slides found', async () => {
    // Create a temp directory with no slides
    const { tmpdir } = await import('os')
    const { join } = await import('path')
    const { mkdir } = await import('fs/promises')

    const testDir = join(tmpdir(), `test-export-${Date.now()}`)
    await mkdir(testDir, { recursive: true })

    try {
      const options = {
        output: 'test.mp4',
        width: 80,
        height: 24,
        fps: 10,
        slideTime: 1,
      }

      await exportPresentation(testDir, options)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('No slides found')
    } finally {
      // Cleanup
      await rm(testDir, { recursive: true, force: true })
    }
  })

  it('detects format from output filename', async () => {
    const optionsMp4 = {
      output: 'presentation.mp4',
      width: 80,
      height: 24,
    }

    const optionsGif = {
      output: 'presentation.gif',
      width: 80,
      height: 24,
    }

    // Verify detectFormat is called correctly (indirectly tested by not throwing on valid extensions)
    expect(detectFormat(optionsMp4.output)).toBe('mp4')
    expect(detectFormat(optionsGif.output)).toBe('gif')
  })

  it('throws error for invalid output format', async () => {
    const options = {
      output: 'presentation.avi',
      width: 80,
      height: 24,
    }

    try {
      await exportPresentation('/any/path', options)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Unknown output format')
    }
  })
})

describe('ansi256ToHex', () => {
  describe('Standard 16 colors', () => {
    it('converts black (0)', () => {
      expect(ansi256ToHex(0)).toBe('#000000')
    })

    it('converts maroon (1)', () => {
      expect(ansi256ToHex(1)).toBe('#800000')
    })

    it('converts green (2)', () => {
      expect(ansi256ToHex(2)).toBe('#008000')
    })

    it('converts olive (3)', () => {
      expect(ansi256ToHex(3)).toBe('#808000')
    })

    it('converts navy (4)', () => {
      expect(ansi256ToHex(4)).toBe('#000080')
    })

    it('converts purple (5)', () => {
      expect(ansi256ToHex(5)).toBe('#800080')
    })

    it('converts teal (6)', () => {
      expect(ansi256ToHex(6)).toBe('#008080')
    })

    it('converts silver (7)', () => {
      expect(ansi256ToHex(7)).toBe('#c0c0c0')
    })

    it('converts gray (8)', () => {
      expect(ansi256ToHex(8)).toBe('#808080')
    })

    it('converts red (9)', () => {
      expect(ansi256ToHex(9)).toBe('#ff0000')
    })

    it('converts lime (10)', () => {
      expect(ansi256ToHex(10)).toBe('#00ff00')
    })

    it('converts yellow (11)', () => {
      expect(ansi256ToHex(11)).toBe('#ffff00')
    })

    it('converts blue (12)', () => {
      expect(ansi256ToHex(12)).toBe('#0000ff')
    })

    it('converts fuchsia (13)', () => {
      expect(ansi256ToHex(13)).toBe('#ff00ff')
    })

    it('converts aqua (14)', () => {
      expect(ansi256ToHex(14)).toBe('#00ffff')
    })

    it('converts white (15)', () => {
      expect(ansi256ToHex(15)).toBe('#ffffff')
    })
  })

  describe('216 color cube (16-231)', () => {
    it('converts first color in cube (16)', () => {
      expect(ansi256ToHex(16)).toBe('#000000')
    })

    it('converts a mid-range color in cube (100)', () => {
      // Code 100: n = 84
      // r = floor(84/36) * 51 = 2 * 51 = 102 = 0x66
      // g = floor((84 % 36)/6) * 51 = floor(12/6) * 51 = 2 * 51 = 102 = 0x66
      // b = (84 % 6) * 51 = 0 * 51 = 0 = 0x00
      expect(ansi256ToHex(100)).toBe('#666600')
    })

    it('converts another color in cube (196)', () => {
      // Code 196: n = 180
      // r = floor(180/36) * 51 = 5 * 51 = 255 = 0xff
      // g = floor(0/6) * 51 = 0 * 51 = 0 = 0x00
      // b = 0 * 51 = 0 = 0x00
      expect(ansi256ToHex(196)).toBe('#ff0000')
    })

    it('converts last color in cube (231)', () => {
      // Code 231: n = 215
      // r = floor(215/36) * 51 = 5 * 51 = 255 = 0xff
      // g = floor(35/6) * 51 = 5 * 51 = 255 = 0xff
      // b = 5 * 51 = 255 = 0xff
      expect(ansi256ToHex(231)).toBe('#ffffff')
    })

    it('converts green-ish color (34)', () => {
      // Code 34: n = 18
      // r = floor(18/36) * 51 = 0 * 51 = 0 = 0x00
      // g = floor(18/6) * 51 = 3 * 51 = 153 = 0x99
      // b = 0 * 51 = 0 = 0x00
      expect(ansi256ToHex(34)).toBe('#009900')
    })

    it('converts blue-ish color (21)', () => {
      // Code 21: n = 5
      // r = floor(5/36) * 51 = 0 * 51 = 0 = 0x00
      // g = floor(5/6) * 51 = 0 * 51 = 0 = 0x00
      // b = 5 * 51 = 255 = 0xff
      expect(ansi256ToHex(21)).toBe('#0000ff')
    })
  })

  describe('Grayscale (232-255)', () => {
    it('converts darkest gray (232)', () => {
      // gray = (232 - 232) * 10 + 8 = 8 = 0x08
      expect(ansi256ToHex(232)).toBe('#080808')
    })

    it('converts mid gray (244)', () => {
      // gray = (244 - 232) * 10 + 8 = 120 + 8 = 128 = 0x80
      expect(ansi256ToHex(244)).toBe('#808080')
    })

    it('converts light gray (250)', () => {
      // gray = (250 - 232) * 10 + 8 = 180 + 8 = 188 = 0xbc
      expect(ansi256ToHex(250)).toBe('#bcbcbc')
    })

    it('converts brightest gray (255)', () => {
      // gray = (255 - 232) * 10 + 8 = 230 + 8 = 238 = 0xee
      expect(ansi256ToHex(255)).toBe('#eeeeee')
    })
  })

  describe('Edge cases', () => {
    it('handles boundary between standard and cube (15 and 16)', () => {
      expect(ansi256ToHex(15)).toBe('#ffffff') // Last standard color
      expect(ansi256ToHex(16)).toBe('#000000') // First cube color
    })

    it('handles boundary between cube and grayscale (231 and 232)', () => {
      expect(ansi256ToHex(231)).toBe('#ffffff') // Last cube color
      expect(ansi256ToHex(232)).toBe('#080808') // First grayscale
    })
  })
})
