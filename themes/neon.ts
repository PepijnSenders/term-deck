import { createTheme } from '../src/core/theme.js';

const yaml = `
name: neon
description: Hot pink and electric blue neon cyberpunk theme
author: term-deck
version: 1.0.0

colors:
  primary: "#ff0099"
  accent: "#00ffff"
  background: "#0a0014"
  text: "#ffffff"
  muted: "#9933ff"

gradients:
  fire:
    - "#ff0099"
    - "#ff0066"
    - "#ff3399"
  cool:
    - "#00ffff"
    - "#0099ff"
    - "#6600ff"
  pink:
    - "#ff0099"
    - "#ff33cc"
    - "#ff66ff"
  hf:
    - "#ff0099"
    - "#00ffff"
    - "#9933ff"

glyphs: "▓▒░█▀▄▌▐■□▪▫●○◊◘◙♦♣♠♥★☆⌂ⁿ²³ÆØ∞≈≠±×÷"

animations:
  revealSpeed: 1.2
  matrixDensity: 60
  glitchIterations: 7
  lineDelay: 25
  matrixInterval: 70

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
