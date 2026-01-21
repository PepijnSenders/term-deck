# term-deck

A terminal-based presentation tool with a cyberpunk aesthetic. Create beautiful slideshows in your terminal with matrix rain backgrounds, glitch effects, and ASCII art.

![term-deck demo](https://img.shields.io/badge/bun-ready-pink?logo=bun)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

## Demo

![term-deck demo](./demo.gif)

*Matrix rain backgrounds, glitch animations, and ASCII art in your terminal*

## Features

- 🌊 **Matrix Rain Background** - Animated katakana/symbol rain effects
- ✨ **Glitch Reveal Animations** - Line-by-line scramble effects
- 🎨 **5 Built-in Themes** - Matrix, Neon, Retro, Minimal, Hacker
- 📝 **Markdown Slides** - One file per slide, easy to version control
- 🎯 **Figlet ASCII Art** - Big text rendered with figlet
- 🎭 **Custom Gradients** - Color gradients for headings
- 🔧 **Fully Themeable** - Create custom themes with YAML
- ⚡ **Fast** - Instant startup with minimal dependencies
- 📦 **Type-Safe** - Full TypeScript with Zod validation

## Installation

### Via npm (Recommended)

```bash
npm install -g @pepijnsenders/term-deck
```

Or with pnpm:

```bash
pnpm install -g @pepijnsenders/term-deck
```

### From Source

Requires [Node.js](https://nodejs.org) 18+ and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/PepijnSenders/term-deck.git
cd term-deck
pnpm install
pnpm dev examples/slides-matrix/
```

## Quick Start

### Create Your First Presentation

```bash
# Initialize a new deck
term-deck init my-presentation

# Navigate and present
cd my-presentation
term-deck slides/
```

This creates:
```
my-presentation/
├── slides/
│   ├── 01-intro.md
│   ├── 02-content.md
│   ├── 03-end.md
│   └── deck.config.ts
└── README.md
```

### Try the Examples

```bash
# Clone the repo to see examples
git clone https://github.com/PepijnSenders/term-deck.git
cd term-deck

# Try different themes
term-deck examples/slides-matrix/   # Classic Matrix
term-deck examples/slides-neon/     # Cyberpunk neon
term-deck examples/slides-retro/    # 80s synthwave
term-deck examples/slides-minimal/  # Clean monochrome
term-deck examples/slides-hacker/   # Terminal green
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `Space` / `Enter` / `→` | Next slide |
| `←` / `Backspace` | Previous slide |
| `0-9` | Jump to slide |
| `l` | Show slide list |
| `q` / `Esc` | Quit |

## Slide Format

Each slide is a markdown file with YAML frontmatter:

**01-intro.md**
```markdown
---
title: Welcome
bigText: HELLO
gradient: fire
---

{GREEN}Welcome to my presentation!{/}

This is the body text of the slide.
```

**02-content.md**
```markdown
---
title: Main Point
bigText:
  - MULTI
  - LINE
gradient: cool
---

{WHITE}You can have multiple bigText lines.{/}

{CYAN}And use color tokens for styling.{/}
```

### 3. Add a config file

**deck.config.ts**
```typescript
import { defineConfig } from 'term-deck';
import matrix from 'term-deck/themes/matrix';

export default defineConfig({
  title: 'My Presentation',
  author: 'Your Name',
  theme: matrix,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
```

### 4. Run it

```bash
bun path/to/term-deck/bin/term-deck.ts .
```

## Themes

term-deck includes 5 built-in themes. See [THEMES.md](./THEMES.md) for detailed documentation.

### Quick Comparison

| Theme | Palette | Speed | Best For |
|-------|---------|-------|----------|
| **Matrix** | Green/Orange | Normal | All-purpose, classic cyberpunk |
| **Neon** | Pink/Cyan/Purple | Fast | High energy, product launches |
| **Retro** | Pink/Orange/Purple | Slow | Creative talks, storytelling |
| **Minimal** | Monochrome | Very Slow | Corporate, documentation |
| **Hacker** | All Green | Very Fast | Security talks, live coding |

### Creating Custom Themes

Create a theme file in `themes/`:

**themes/my-theme.ts**
```typescript
import { createTheme } from '../src/core/theme.js';

const yaml = `
name: my-theme
description: My custom theme

colors:
  primary: "#ff0000"
  accent: "#00ff00"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"

gradients:
  fire:
    - "#ff0000"
    - "#ff6600"
    - "#ffcc00"
  cool:
    - "#0000ff"
    - "#0066ff"
    - "#00ccff"
  pink:
    - "#ff00ff"
    - "#ff66ff"
    - "#ffccff"
  hf:
    - "#00ff00"
    - "#66ff66"
    - "#ccffcc"

glyphs: "█▓▒░▀▄▌▐■□▪▫"

animations:
  revealSpeed: 1.0
  matrixDensity: 50
  glitchIterations: 5
  lineDelay: 30
  matrixInterval: 80

window:
  borderStyle: line
  shadow: true
  padding:
    top: 1
    bottom: 1
    left: 2
    right: 2
`;

export default createTheme(yaml);
```

Then use it in your deck config:

```typescript
import myTheme from './themes/my-theme.js';

export default defineConfig({
  title: 'My Presentation',
  theme: myTheme,
});
```

## Slide Format

Slides use markdown with YAML frontmatter:

```markdown
---
title: Slide Title
bigText: BIG TEXT
gradient: fire
transition: glitch
---

Body content goes here.

You can use color tokens:
{GREEN}green text{/}
{ORANGE}orange text{/}
{CYAN}cyan text{/}
{PINK}pink text{/}
{WHITE}white text{/}
{GRAY}gray text{/}

<!-- notes -->
These are presenter notes (optional).
Only visible in notes mode.
```

### Frontmatter Options

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Window title (required) |
| `bigText` | string \| string[] | ASCII art text via figlet |
| `gradient` | string | Gradient for bigText: `fire`, `cool`, `pink`, `hf` |
| `transition` | string | Animation: `glitch`, `fade`, `instant`, `typewriter` |
| `theme` | string | Override theme for this slide |

## Development

### Project Structure

```
term-deck/
├── bin/
│   └── term-deck.ts          # CLI entry point
├── src/
│   ├── cli/                  # CLI commands
│   ├── core/                 # Core logic (deck, slide, theme)
│   ├── renderer/             # TUI rendering
│   ├── presenter/            # Presentation controller
│   ├── export/               # Export to GIF/MP4 (future)
│   ├── schemas/              # Zod validation schemas
│   └── themes/               # Built-in themes
├── themes/                   # User custom themes
├── examples/                 # Example presentations
│   ├── slides/               # Default demo
│   ├── slides-matrix/        # Matrix theme demo
│   ├── slides-neon/          # Neon theme demo
│   ├── slides-retro/         # Retro theme demo
│   ├── slides-minimal/       # Minimal theme demo
│   └── slides-hacker/        # Hacker theme demo
└── package.json
```

### Running Tests

```bash
bun run test
```

### Type Checking

```bash
bun run typecheck
```

## Roadmap

- [ ] Export to GIF/MP4
- [ ] Presenter notes mode (dual terminal)
- [ ] Mermaid diagram support
- [ ] Custom fonts for ASCII art
- [ ] Auto-advance mode
- [ ] Progress bar
- [ ] Remote control (via HTTP)
- [ ] Web viewer

## Why term-deck?

- **For speakers** who want terminal-native presentations
- **For developers** who want to present code without context switching
- **For streamers** who want a cyberpunk aesthetic
- **For anyone** tired of PowerPoint

## Credits

Built with:
- [Node.js](https://nodejs.org) - JavaScript runtime
- [neo-blessed](https://github.com/embarklabs/neo-blessed) - Terminal UI
- [figlet](https://github.com/patorjk/figlet.js) - ASCII art text
- [gradient-string](https://github.com/bokub/gradient-string) - Color gradients
- [Zod](https://github.com/colinhacks/zod) - Schema validation

Inspired by:
- [Slidev](https://sli.dev) - Presentation slides for developers
- [mdp](https://github.com/visit1985/mdp) - Markdown presentation tool
- [present](https://github.com/vinayak-mehta/present) - Terminal presentation tool

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Made with 💚 by the term-deck team
