import { createTheme } from '../src/core/theme.js';

const yaml = `
name: retro
description: 80s synthwave retro theme with purple and orange
author: term-deck
version: 1.0.0

colors:
  primary: "#ff6ec7"
  accent: "#ffa600"
  background: "#1a0033"
  text: "#ffd5ff"
  muted: "#7d4e9f"

gradients:
  fire:
    - "#ffa600"
    - "#ff6ec7"
    - "#ff0080"
  cool:
    - "#00d4ff"
    - "#7d4e9f"
    - "#ff0080"
  pink:
    - "#ff6ec7"
    - "#ff99dd"
    - "#ffccff"
  hf:
    - "#ffa600"
    - "#ff6ec7"
    - "#00d4ff"

glyphs: "▲▼◄►♪♫■□▪▫●○◊★☆⌂∴∵≈≠±×÷αβγδλπσφω"

animations:
  revealSpeed: 0.8
  matrixDensity: 40
  glitchIterations: 4
  lineDelay: 40
  matrixInterval: 90

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
