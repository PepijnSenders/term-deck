import { createTheme } from '../src/core/theme.js';

const yaml = `
name: minimal
description: Clean monochrome theme with minimal animations
author: term-deck
version: 1.0.0

colors:
  primary: "#ffffff"
  accent: "#888888"
  background: "#000000"
  text: "#e0e0e0"
  muted: "#555555"

gradients:
  fire:
    - "#ffffff"
    - "#cccccc"
    - "#aaaaaa"
  cool:
    - "#ffffff"
    - "#bbbbbb"
    - "#888888"
  pink:
    - "#e0e0e0"
    - "#c0c0c0"
    - "#a0a0a0"
  hf:
    - "#ffffff"
    - "#d0d0d0"
    - "#999999"

glyphs: "│─┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬"

animations:
  revealSpeed: 0.5
  matrixDensity: 20
  glitchIterations: 2
  lineDelay: 50
  matrixInterval: 120

window:
  borderStyle: line
  shadow: false
  padding:
    top: 1
    bottom: 1
    left: 2
    right: 2
`;

export default createTheme(yaml);
