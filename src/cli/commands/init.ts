/**
 * Init Command
 *
 * Creates a new presentation deck with sample slides and configuration.
 */

import { Command } from 'commander';
import { join } from 'node:path';
import { mkdir, writeFile } from 'fs/promises';
import { intro, outro, log } from '@clack/prompts';
import { handleError } from '../errors.js';

export const initCommand = new Command('init')
  .description('Create a new presentation deck')
  .argument('<name>', 'Deck name (will create directory)')
  .option('-t, --theme <name>', 'Theme to use', 'matrix')
  .action(async (name, options) => {
    try {
      intro(`Creating ${name}`);

      await initDeck(name, options.theme);

      log.success(`Created ${name}/`);
      log.step('cd ' + name);
      log.step('term-deck present .');

      outro('Ready to present!');
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Initialize a new deck directory
 *
 * Creates the directory, configuration file, sample slides,
 * and README for a new presentation deck.
 */
export async function initDeck(name: string, theme: string): Promise<void> {
  const deckDir = join(process.cwd(), name);

  // Create directory
  await mkdir(deckDir, { recursive: true });

  // Create minimal deck.config.js
  const configContent = `// Deck configuration
// Documentation: https://github.com/PepijnSenders/term-deck

export default {
  title: '${name}',

  // Theme preset (defaults to 'matrix')
  // Available presets: 'matrix'
  themePreset: 'matrix',

  // Advanced: Custom theme object
  // Uncomment to override theme completely:
  // theme: {
  //   name: 'custom',
  //   colors: {
  //     primary: '#00cc66',
  //     accent: '#ff6600',
  //     background: '#0a0a0a',
  //     text: '#ffffff',
  //     muted: '#666666',
  //   },
  //   gradients: {
  //     fire: ['#ff6600', '#ff3300', '#ff0066'],
  //   },
  //   glyphs: 'ｱｲｳｴｵｶｷｸｹｺ0123456789',
  // },
}
`;
  await writeFile(join(deckDir, 'deck.config.js'), configContent);

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

  await writeFile(join(deckDir, '01-intro.md'), slide1);
  await writeFile(join(deckDir, '02-content.md'), slide2);
  await writeFile(join(deckDir, '03-end.md'), slide3);

  // Create README
  const readme = `# ${name}

A term-deck presentation.

## Usage

\`\`\`bash
term-deck present .
\`\`\`

## Export

\`\`\`bash
term-deck export . -o ${name}.mp4
term-deck export . -o ${name}.gif
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
