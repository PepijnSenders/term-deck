/**
 * Custom Help Display
 *
 * Provides a beautiful, styled help output that matches
 * the cyberpunk aesthetic of term-deck.
 */

import pc from 'picocolors';

/**
 * Show styled help message
 */
export function showHelp(): void {
  console.log('');

  // Header box
  const boxTop = pc.bold(pc.green('┌─────────────────────────────────────────────────────────────┐'));
  const boxTitle =
    pc.bold(pc.green('│')) +
    pc.bold('                       ') +
    pc.bold(pc.cyan('term-deck')) +
    pc.bold('                          ') +
    pc.bold(pc.green('│'));
  const boxLine1 = `${pc.bold(pc.green('│'))}  ${pc.dim('Terminal presentation tool with a cyberpunk aesthetic')}  ${pc.bold(pc.green('│'))}`;
  const boxBottom = pc.bold(pc.green('└─────────────────────────────────────────────────────────────┘'));

  console.log(boxTop);
  console.log(boxTitle);
  console.log(boxLine1);
  console.log(boxBottom);
  console.log('');

  // Quick Start
  console.log(pc.bold(pc.magenta('▶ QUICK START:')));
  console.log('');
  console.log(pc.cyan('  ⚡  Create a new deck'));
  console.log(pc.dim('      term-deck init my-talk'));
  console.log('');
  console.log(pc.cyan('  🎬  Start presenting'));
  console.log(pc.dim('      cd my-talk && term-deck present .'));
  console.log('');
  console.log(pc.cyan('  📹  Export to video'));
  console.log(pc.dim('      term-deck export . -o presentation.mp4'));
  console.log('');

  // Commands
  console.log(pc.bold(pc.yellow('▶ COMMANDS:')));
  console.log('');
  console.log(pc.green('  present') + pc.dim(' <dir>        ') + pc.white('Start a presentation'));
  console.log(pc.dim('    -s, --start <n>       ') + pc.white('Start at slide number'));
  console.log(pc.dim('    -n, --notes           ') + pc.white('Show presenter notes'));
  console.log(pc.dim('    -l, --loop            ') + pc.white('Loop back after last slide'));
  console.log('');
  console.log(pc.green('  export') + pc.dim(' <dir>         ') + pc.white('Export to GIF or MP4'));
  console.log(pc.dim('    -o, --output <file>   ') + pc.white('Output file (.mp4 or .gif)'));
  console.log(pc.dim('    -w, --width <n>       ') + pc.white('Terminal width (default: 120)'));
  console.log(pc.dim('    -h, --height <n>      ') + pc.white('Terminal height (default: 40)'));
  console.log(pc.dim('    --fps <n>             ') + pc.white('Frames per second (default: 30)'));
  console.log(pc.dim('    -t, --slide-time <n>  ') + pc.white('Seconds per slide (default: 3)'));
  console.log(pc.dim('    -q, --quality <n>     ') + pc.white('Quality 1-100 (default: 80)'));
  console.log('');
  console.log(pc.green('  init') + pc.dim(' <name>          ') + pc.white('Create a new presentation deck'));
  console.log(pc.dim('    -t, --theme <name>    ') + pc.white('Theme preset (default: matrix)'));
  console.log('');

  // Hotkeys
  console.log(pc.bold(pc.cyan('▶ HOTKEYS:')));
  console.log('');
  console.log(pc.dim('  Space / →   ') + pc.white('Next slide'));
  console.log(pc.dim('  ←           ') + pc.white('Previous slide'));
  console.log(pc.dim('  0-9         ') + pc.white('Jump to slide'));
  console.log(pc.dim('  l           ') + pc.white('Show slide list'));
  console.log(pc.dim('  q           ') + pc.white('Quit'));
  console.log('');

  // Slide Format
  console.log(pc.bold(pc.blue('▶ SLIDE FORMAT:')));
  console.log('');
  console.log(pc.dim('  Slides are Markdown files with YAML frontmatter:'));
  console.log('');
  console.log(pc.green('  ---'));
  console.log(pc.yellow('  title: ') + pc.white('MY SLIDE'));
  console.log(pc.yellow('  bigText: ') + pc.white('HELLO'));
  console.log(pc.yellow('  gradient: ') + pc.white('fire'));
  console.log(pc.green('  ---'));
  console.log(pc.dim('  Your slide content here...'));
  console.log('');

  // Colors
  console.log(pc.bold(pc.red('▶ TEXT COLORS:')));
  console.log('');
  console.log(pc.dim('  Use tags in your slides:'));
  console.log(`  ${pc.green('{GREEN}')}text${pc.green('{/}')}  ${pc.cyan('{CYAN}')}text${pc.cyan('{/}')}  ${pc.red('{RED}')}text${pc.red('{/}')}  ${pc.yellow('{ORANGE}')}text${pc.yellow('{/}')}`);
  console.log('');

  // Footer
  console.log(pc.green('✨') + pc.dim(' Happy presenting!'));
  console.log('');
}

/**
 * Show version info
 */
export function showVersion(version: string): void {
  console.log('');
  console.log(pc.bold(pc.cyan('term-deck')) + pc.dim(` v${version}`));
  console.log('');
}
