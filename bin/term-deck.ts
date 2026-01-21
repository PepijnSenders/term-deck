#!/usr/bin/env bun
/**
 * CLI Entry Point for term-deck
 *
 * Terminal presentation tool with a cyberpunk aesthetic.
 * Provides commands for presenting, exporting, and initializing decks.
 */

import { Command } from 'commander';
import { version } from '../package.json';
import { presentCommand } from '../src/cli/commands/present.js';
import { exportCommand } from '../src/cli/commands/export.js';
import { initCommand } from '../src/cli/commands/init.js';
import { handleError } from '../src/cli/errors.js';

const program = new Command();

program
  .name('term-deck')
  .description('Terminal presentation tool with a cyberpunk aesthetic')
  .version(version);

// Register commands
program.addCommand(presentCommand);
program.addCommand(exportCommand);
program.addCommand(initCommand);

// Default action: present if directory given, else show help
program
  .argument('[dir]', 'Slides directory to present')
  .action(async (dir) => {
    if (dir) {
      // Default action: present the deck
      try {
        const { present } = await import('../src/presenter/main.js');
        await present(dir, {});
      } catch (error) {
        handleError(error);
      }
    } else {
      program.help();
    }
  });

program.parse();
