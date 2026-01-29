import type { DeckBundle } from '@/schemas/deck-bundle'
import { DEFAULT_THEME } from '@/schemas/theme'

export const DEMO_DECK: DeckBundle = {
  version: 1,
  id: 'demo',
  createdAt: new Date().toISOString(),
  config: {
    title: 'term-deck Demo',
    author: 'term-deck',
    theme: DEFAULT_THEME,
  },
  slides: [
    {
      frontmatter: {
        title: 'Welcome',
        bigText: 'TERM-DECK',
        gradient: 'hf',
        transition: 'glitch',
      },
      body: `{GREEN}Terminal presentations{/} for the modern age

Create beautiful presentations that run in:
  → Your terminal (full TUI experience)
  → The web browser (share with anyone)

{CYAN}Press → or Space to continue{/}`,
      index: 0,
    },
    {
      frontmatter: {
        title: 'Features',
        bigText: 'FEATURES',
        gradient: 'fire',
        transition: 'glitch',
      },
      body: `{ORANGE}▶ Matrix Rain{/} - Animated cyberpunk background
{ORANGE}▶ BigText{/} - ASCII art headers with gradients
{ORANGE}▶ Transitions{/} - Glitch, fade, typewriter
{ORANGE}▶ Color Tokens{/} - {GREEN}Green{/}, {CYAN}Cyan{/}, {PINK}Pink{/}
{ORANGE}▶ Themes{/} - Fully customizable
{ORANGE}▶ Export{/} - GIF and MP4 support`,
      index: 1,
    },
    {
      frontmatter: {
        title: 'Easy to Use',
        bigText: 'EASY',
        gradient: 'cool',
        transition: 'fade',
      },
      body: `{CYAN}Create slides with Markdown:{/}

┌─────────────────────────────────┐
│  ---                            │
│  title: My Slide                │
│  bigText: HELLO                 │
│  gradient: fire                 │
│  ---                            │
│                                 │
│  Your content here...           │
│                                 │
└─────────────────────────────────┘

{GRAY}Supports frontmatter for all settings{/}`,
      index: 2,
    },
    {
      frontmatter: {
        title: 'Try It',
        bigText: ['GET', 'STARTED'],
        gradient: 'pink',
        transition: 'typewriter',
      },
      body: `{GREEN}$ npm install -g @pep/term-deck{/}

{GREEN}$ term-deck init my-talk{/}

{GREEN}$ cd my-talk && term-deck present .{/}

{PINK}Or upload your slides at:{/}
{CYAN}term-deck-web.vercel.app/upload{/}`,
      index: 3,
    },
  ],
}
