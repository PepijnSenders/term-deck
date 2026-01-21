/**
 * Tests for CLI help text
 */

import { describe, test, expect } from 'bun:test';
import { Command } from 'commander';
import { presentCommand } from '../commands/present.js';
import { exportCommand } from '../commands/export.js';
import { initCommand } from '../commands/init.js';

describe('CLI help text', () => {
  test('present command has description', () => {
    expect(presentCommand.description()).toBeTruthy();
    expect(presentCommand.description()).toContain('present');
  });

  test('present command has all options', () => {
    const options = presentCommand.options;

    const optionNames = options.map((opt) => opt.long);
    expect(optionNames).toContain('--start');
    expect(optionNames).toContain('--notes');
    expect(optionNames).toContain('--notes-tty');
    expect(optionNames).toContain('--loop');
  });

  test('present command has short options', () => {
    const options = presentCommand.options;

    const shortNames = options.map((opt) => opt.short).filter(Boolean);
    expect(shortNames).toContain('-s');
    expect(shortNames).toContain('-n');
    expect(shortNames).toContain('-l');
  });

  test('present command requires dir argument', () => {
    const args = presentCommand.registeredArguments;
    expect(args.length).toBeGreaterThan(0);
    expect(args[0].name()).toBe('dir');
    expect(args[0].required).toBe(true);
  });

  test('export command has description', () => {
    expect(exportCommand.description()).toBeTruthy();
    expect(exportCommand.description().toLowerCase()).toContain('export');
  });

  test('export command has all options', () => {
    const options = exportCommand.options;

    const optionNames = options.map((opt) => opt.long);
    expect(optionNames).toContain('--output');
    expect(optionNames).toContain('--width');
    expect(optionNames).toContain('--height');
    expect(optionNames).toContain('--fps');
    expect(optionNames).toContain('--slide-time');
    expect(optionNames).toContain('--quality');
  });

  test('export command has short options', () => {
    const options = exportCommand.options;

    const shortNames = options.map((opt) => opt.short).filter(Boolean);
    expect(shortNames).toContain('-o');
    expect(shortNames).toContain('-w');
    expect(shortNames).toContain('-h');
    expect(shortNames).toContain('-t');
    expect(shortNames).toContain('-q');
  });

  test('export command requires dir argument', () => {
    const args = exportCommand.registeredArguments;
    expect(args.length).toBeGreaterThan(0);
    expect(args[0].name()).toBe('dir');
    expect(args[0].required).toBe(true);
  });

  test('export command requires output option', () => {
    const outputOption = exportCommand.options.find((opt) => opt.long === '--output');
    expect(outputOption).toBeTruthy();
    expect(outputOption?.required).toBe(true);
  });

  test('init command has description', () => {
    expect(initCommand.description()).toBeTruthy();
    expect(initCommand.description()).toContain('presentation deck');
  });

  test('init command has theme option', () => {
    const options = initCommand.options;

    const optionNames = options.map((opt) => opt.long);
    expect(optionNames).toContain('--theme');
  });

  test('init command has short theme option', () => {
    const options = initCommand.options;

    const shortNames = options.map((opt) => opt.short).filter(Boolean);
    expect(shortNames).toContain('-t');
  });

  test('init command requires name argument', () => {
    const args = initCommand.registeredArguments;
    expect(args.length).toBeGreaterThan(0);
    expect(args[0].name()).toBe('name');
    expect(args[0].required).toBe(true);
  });

  test('main program would have version', () => {
    // Test that version can be imported from package.json
    const pkg = require('../../../package.json');
    expect(pkg.version).toBeTruthy();
    expect(typeof pkg.version).toBe('string');
  });

  test('main program would have name', () => {
    const pkg = require('../../../package.json');
    expect(pkg.name).toBeTruthy();
    expect(pkg.name).toBe('term-deck');
  });

  test('all commands have help text', () => {
    const commands = [presentCommand, exportCommand, initCommand];

    for (const cmd of commands) {
      // Commander automatically generates help
      const helpInfo = cmd.helpInformation();
      expect(helpInfo).toBeTruthy();
      expect(helpInfo.length).toBeGreaterThan(0);
    }
  });

  test('present command help includes options descriptions', () => {
    const helpInfo = presentCommand.helpInformation();

    expect(helpInfo).toContain('start');
    expect(helpInfo).toContain('notes');
    expect(helpInfo).toContain('loop');
  });

  test('export command help includes options descriptions', () => {
    const helpInfo = exportCommand.helpInformation();

    expect(helpInfo).toContain('output');
    expect(helpInfo).toContain('width');
    expect(helpInfo).toContain('height');
    expect(helpInfo).toContain('fps');
  });

  test('init command help includes options descriptions', () => {
    const helpInfo = initCommand.helpInformation();

    expect(helpInfo).toContain('theme');
    expect(helpInfo).toContain('name');
  });
});
