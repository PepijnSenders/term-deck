# term-deck Theme Showcase

This directory contains 5 different themed versions of the spec-machine presentation, each with a unique visual style.

## Available Themes

### 1. Matrix (Default)
**Directory:** `slides-matrix/`

Classic Matrix aesthetic with green katakana rain.

**Colors:**
- Primary: Green (#00cc66)
- Accent: Orange (#ff6600)
- Background: Nearly black (#0a0a0a)

**Characteristics:**
- Medium animation speed
- 50 matrix rain drops
- 5 glitch iterations
- Japanese katakana characters

**Run:**
```bash
bun bin/term-deck.ts slides-matrix/
```

---

### 2. Neon
**Directory:** `slides-neon/`

Hot pink and electric blue cyberpunk neon theme.

**Colors:**
- Primary: Hot Pink (#ff0099)
- Accent: Cyan (#00ffff)
- Background: Deep purple (#0a0014)
- Muted: Purple (#9933ff)

**Characteristics:**
- Faster animations (1.2x speed)
- Denser matrix rain (60 drops)
- More glitch iterations (7)
- Block/geometric characters

**Run:**
```bash
bun bin/term-deck.ts slides-neon/
```

---

### 3. Retro
**Directory:** `slides-retro/`

80s synthwave aesthetic with purple and orange gradients.

**Colors:**
- Primary: Pink (#ff6ec7)
- Accent: Orange (#ffa600)
- Background: Deep purple (#1a0033)
- Text: Light pink (#ffd5ff)

**Characteristics:**
- Slower, smooth animations (0.8x speed)
- Less dense rain (40 drops)
- Fewer glitch iterations (4)
- Geometric/musical symbols

**Run:**
```bash
bun bin/term-deck.ts slides-retro/
```

---

### 4. Minimal
**Directory:** `slides-minimal/`

Clean monochrome theme with minimal animations.

**Colors:**
- Primary: White (#ffffff)
- Accent: Gray (#888888)
- Background: Pure black (#000000)
- Text: Light gray (#e0e0e0)

**Characteristics:**
- Slowest animations (0.5x speed)
- Minimal rain (20 drops)
- Subtle glitch (2 iterations)
- Box drawing characters only
- No shadow effects

**Run:**
```bash
bun bin/term-deck.ts slides-minimal/
```

---

### 5. Hacker
**Directory:** `slides-hacker/`

Classic green terminal hacker aesthetic.

**Colors:**
- Primary: Bright Green (#00ff00)
- Accent: Green (#00cc00)
- Background: Dark green (#001100)
- Everything is green

**Characteristics:**
- Fastest animations (1.5x speed)
- Densest rain (70 drops)
- Maximum glitch (8 iterations)
- Binary digits and katakana

**Run:**
```bash
bun bin/term-deck.ts slides-hacker/
```

---

## Quick Comparison

| Theme    | Speed | Rain Density | Glitch | Color Palette       |
|----------|-------|--------------|--------|---------------------|
| Matrix   | 1.0x  | 50 drops     | 5      | Green/Orange        |
| Neon     | 1.2x  | 60 drops     | 7      | Pink/Cyan/Purple    |
| Retro    | 0.8x  | 40 drops     | 4      | Pink/Orange/Purple  |
| Minimal  | 0.5x  | 20 drops     | 2      | Monochrome          |
| Hacker   | 1.5x  | 70 drops     | 8      | All Green           |

## Creating Your Own Theme

Themes are defined in `themes/` directory. Each theme is a TypeScript file that exports a YAML configuration:

```typescript
import { createTheme } from '../src/core/theme.js';

const yaml = `
name: my-theme
description: My custom theme
author: Your Name
version: 1.0.0

colors:
  primary: "#ff0000"
  accent: "#00ff00"
  background: "#000000"
  text: "#ffffff"
  muted: "#666666"

gradients:
  fire:
    - "#ff0000"
    - "#ff3300"
    - "#ff6600"
  cool:
    - "#0000ff"
    - "#0033ff"
    - "#0066ff"
  pink:
    - "#ff00ff"
    - "#ff33ff"
    - "#ff66ff"
  hf:
    - "#00ff00"
    - "#00cc00"
    - "#009900"

glyphs: "█▓▒░▀▄▌▐■□"

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

## Theme Properties Explained

### Colors
- **primary**: Main accent color for borders and highlights
- **accent**: Secondary accent color
- **background**: Window background color
- **text**: Main text color
- **muted**: Subdued text color

### Gradients
Four gradient definitions used for bigText:
- **fire**: Warm colors (reds, oranges)
- **cool**: Cool colors (blues, purples)
- **pink**: Pink/magenta range
- **hf**: HelloFresh brand gradient

### Animations
- **revealSpeed**: Multiplier for animation speed (0.5 = half speed, 2.0 = double speed)
- **matrixDensity**: Number of matrix rain drops (10-100)
- **glitchIterations**: Number of scramble frames during reveal (0-10)
- **lineDelay**: Milliseconds between revealing lines (10-100)
- **matrixInterval**: Milliseconds between matrix rain updates (50-150)

### Glyphs
String of characters used for the matrix rain background. Can be:
- Japanese katakana: `ｱｲｳｴｵｶｷｸｹｺ`
- Box drawing: `│─┌┐└┘├┤┬┴┼`
- Blocks: `█▓▒░`
- Symbols: `★☆◊●○`
- Binary: `01`
- Or any Unicode characters

## Tips

1. **Dark backgrounds** work best for readability
2. **High contrast** between text and background is essential
3. **Gradients** should have smooth color transitions
4. **Glyphs** should be visually interesting but not distracting
5. **Animation speed** affects perceived energy - faster for intense themes, slower for elegant themes

## Which Theme Should You Use?

- **Matrix**: All-purpose, balanced, classic cyberpunk
- **Neon**: High energy, modern, attention-grabbing
- **Retro**: Nostalgic, smooth, 80s vibes
- **Minimal**: Professional, clean, distraction-free
- **Hacker**: Maximum intensity, classic terminal feel

Try them all and see which fits your presentation style!
