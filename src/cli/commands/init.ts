/**
 * Init Command
 *
 * Creates a new presentation deck with sample slides and configuration.
 */

import { Command } from 'commander';
import { join } from 'node:path';
import { mkdir, writeFile } from 'fs/promises';
import { handleError } from '../errors.js';

export const initCommand = new Command('init')
  .description('Create a new presentation deck')
  .argument('<name>', 'Deck name (will create directory)')
  .option('-t, --theme <name>', 'Theme to use', 'matrix')
  .action(async (name, options) => {
    try {
      await initDeck(name, options.theme);
      console.log(`Created deck: ${name}/`);
      console.log('\nNext steps:');
      console.log(`  cd ${name}/slides`);
      console.log('  term-deck present .');
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Initialize a new deck directory
 *
 * Creates the directory structure, configuration file, sample slides,
 * and README for a new presentation deck.
 */
export async function initDeck(name: string, theme: string): Promise<void> {
  const deckDir = join(process.cwd(), name);
  const slidesDir = join(deckDir, 'slides');

  // Create directories
  await mkdir(slidesDir, { recursive: true });
  await writeFile(join(slidesDir, '.gitkeep'), '');

  // Create deck.config.js that imports theme from package
  const configContent = `// Deck configuration
// Documentation: https://github.com/PepijnSenders/term-deck

import { matrix } from '@pep/term-deck'

export default {
  title: '${name}',
  theme: matrix,
}
`;
  await writeFile(join(slidesDir, 'deck.config.js'), configContent);

  // Create sample slides
  const slide1 = `---
title: ${name.toUpperCase()}
bigText: ${name.toUpperCase()}
gradient: fire
---

{GREEN}Welcome to your presentation{/}

Press {CYAN}Space{/} or {CYAN}→{/} to advance
`;

  const slide2 = `---
title: SLIDE TWO
bigText: HELLO
gradient: cool
---

{WHITE}This is the second slide{/}

- Point one
- Point two
- Point three

<!-- notes -->
Remember to explain each point clearly.
`;

  const slide3 = `---
title: THE END
bigText: FIN
gradient: pink
---

{ORANGE}Thank you!{/}

Press {CYAN}q{/} to exit
`;

  await writeFile(join(slidesDir, '01-intro.md'), slide1);
  await writeFile(join(slidesDir, '02-content.md'), slide2);
  await writeFile(join(slidesDir, '03-end.md'), slide3);

  // Create README
  const readme = `# ${name}

A term-deck presentation.

## Usage

\`\`\`bash
cd slides
term-deck present .
\`\`\`

## Export

\`\`\`bash
term-deck export slides/ -o ${name}.mp4
term-deck export slides/ -o ${name}.gif
\`\`\`

## Hotkeys

| Key | Action |
|-----|--------|
| Space / → | Next slide |
| ← | Previous slide |
| 0-9 | Jump to slide |
| l | Show slide list |
| q | Quit |
`;

  await writeFile(join(deckDir, 'README.md'), readme);
}
