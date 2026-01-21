/**
 * Tests for init command
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initDeck } from '../commands/init.js';

const TEST_DECK_NAME = 'test-deck-init';
const TEST_DECK_PATH = join(process.cwd(), TEST_DECK_NAME);

describe('initDeck', () => {
  beforeEach(() => {
    // Clean up if test directory exists
    if (existsSync(TEST_DECK_PATH)) {
      rmSync(TEST_DECK_PATH, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after test
    if (existsSync(TEST_DECK_PATH)) {
      rmSync(TEST_DECK_PATH, { recursive: true, force: true });
    }
  });

  test('creates deck directory structure', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    // Check directories
    expect(existsSync(TEST_DECK_PATH)).toBe(true);
    expect(existsSync(join(TEST_DECK_PATH, 'slides'))).toBe(true);
  });

  test('creates deck.config.ts', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const configPath = join(TEST_DECK_PATH, 'slides', 'deck.config.ts');
    expect(existsSync(configPath)).toBe(true);

    const content = await Bun.file(configPath).text();
    expect(content).toContain('import { defineConfig }');
    expect(content).toContain('import matrix from');
    expect(content).toContain(`title: '${TEST_DECK_NAME}'`);
  });

  test('creates sample slides', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slidesDir = join(TEST_DECK_PATH, 'slides');
    expect(existsSync(join(slidesDir, '01-intro.md'))).toBe(true);
    expect(existsSync(join(slidesDir, '02-content.md'))).toBe(true);
    expect(existsSync(join(slidesDir, '03-end.md'))).toBe(true);
  });

  test('slides have valid frontmatter', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slidesDir = join(TEST_DECK_PATH, 'slides');
    const slide1 = await Bun.file(join(slidesDir, '01-intro.md')).text();
    const slide2 = await Bun.file(join(slidesDir, '02-content.md')).text();
    const slide3 = await Bun.file(join(slidesDir, '03-end.md')).text();

    // Check frontmatter structure
    expect(slide1).toMatch(/^---\s*\ntitle:/);
    expect(slide1).toContain('bigText:');
    expect(slide1).toContain('gradient:');

    expect(slide2).toMatch(/^---\s*\ntitle:/);
    expect(slide2).toContain('bigText:');
    expect(slide2).toContain('gradient:');

    expect(slide3).toMatch(/^---\s*\ntitle:/);
    expect(slide3).toContain('bigText:');
    expect(slide3).toContain('gradient:');
  });

  test('slide 2 includes presenter notes', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slidesDir = join(TEST_DECK_PATH, 'slides');
    const slide2 = await Bun.file(join(slidesDir, '02-content.md')).text();

    expect(slide2).toContain('<!-- notes -->');
  });

  test('creates README.md', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const readmePath = join(TEST_DECK_PATH, 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const content = await Bun.file(readmePath).text();
    expect(content).toContain(`# ${TEST_DECK_NAME}`);
    expect(content).toContain('term-deck present');
    expect(content).toContain('term-deck export');
    expect(content).toContain('Hotkeys');
  });

  test('uses deck name in slide titles', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slide1 = await Bun.file(
      join(TEST_DECK_PATH, 'slides', '01-intro.md'),
    ).text();

    expect(slide1).toContain(TEST_DECK_NAME.toUpperCase());
  });
});
