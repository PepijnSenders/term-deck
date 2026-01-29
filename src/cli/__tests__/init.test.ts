/**
 * Tests for init command
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { rmSync, existsSync, readFileSync } from 'node:fs';
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

  test('creates deck directory', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    expect(existsSync(TEST_DECK_PATH)).toBe(true);
  });

  test('creates deck.config.js', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const configPath = join(TEST_DECK_PATH, 'deck.config.js');
    expect(existsSync(configPath)).toBe(true);

    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('export default');
    expect(content).toContain(`title: '${TEST_DECK_NAME}'`);
    expect(content).toContain('themePreset');
  });

  test('creates sample slides', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    expect(existsSync(join(TEST_DECK_PATH, '01-intro.md'))).toBe(true);
    expect(existsSync(join(TEST_DECK_PATH, '02-content.md'))).toBe(true);
    expect(existsSync(join(TEST_DECK_PATH, '03-end.md'))).toBe(true);
  });

  test('slides have valid frontmatter', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slide1 = readFileSync(join(TEST_DECK_PATH, '01-intro.md'), 'utf-8');
    const slide2 = readFileSync(join(TEST_DECK_PATH, '02-content.md'), 'utf-8');
    const slide3 = readFileSync(join(TEST_DECK_PATH, '03-end.md'), 'utf-8');

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

  test('slides include presenter notes', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slide1 = readFileSync(join(TEST_DECK_PATH, '01-intro.md'), 'utf-8');
    const slide2 = readFileSync(join(TEST_DECK_PATH, '02-content.md'), 'utf-8');
    const slide3 = readFileSync(join(TEST_DECK_PATH, '03-end.md'), 'utf-8');

    expect(slide1).toContain('<!-- notes -->');
    expect(slide2).toContain('<!-- notes -->');
    expect(slide3).toContain('<!-- notes -->');
  });

  test('creates README.md', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const readmePath = join(TEST_DECK_PATH, 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const content = readFileSync(readmePath, 'utf-8');
    expect(content).toContain(`# ${TEST_DECK_NAME}`);
    expect(content).toContain('term-deck present');
    expect(content).toContain('term-deck export');
    expect(content).toContain('Hotkeys');
  });

  test('uses deck name in slide titles', async () => {
    await initDeck(TEST_DECK_NAME, 'matrix');

    const slide1 = readFileSync(
      join(TEST_DECK_PATH, '01-intro.md'),
      'utf-8',
    );

    expect(slide1).toContain(TEST_DECK_NAME.toUpperCase());
  });
});
