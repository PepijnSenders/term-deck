import { createTheme } from '../src/core/theme.js';

const yaml = `
name: hacker
description: Classic green terminal hacker aesthetic
author: term-deck
version: 1.0.0

colors:
  primary: "#00ff00"
  accent: "#00cc00"
  background: "#001100"
  text: "#00ff00"
  muted: "#006600"

gradients:
  fire:
    - "#00ff00"
    - "#00ee00"
    - "#00dd00"
  cool:
    - "#00ff00"
    - "#00cc00"
    - "#009900"
  pink:
    - "#00ff00"
    - "#00dd00"
    - "#00bb00"
  hf:
    - "#00ff00"
    - "#00cc00"
    - "#008800"

glyphs: "01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ"

animations:
  revealSpeed: 1.5
  matrixDensity: 70
  glitchIterations: 8
  lineDelay: 15
  matrixInterval: 60

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
