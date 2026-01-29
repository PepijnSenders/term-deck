import { createTheme } from '../../core/theme'

const yaml = `
name: matrix
description: Default cyberpunk/matrix theme
author: term-deck
version: 1.0.0

colors:
  primary: "#00cc66"
  accent: "#ff6600"
  background: "#0a0a0a"
  text: "#ffffff"
  muted: "#666666"

gradients:
  fire:
    - "#ff6600"
    - "#ff3300"
    - "#ff0066"
  cool:
    - "#00ccff"
    - "#0066ff"
    - "#6600ff"
  pink:
    - "#ff0066"
    - "#ff0099"
    - "#cc00ff"
  hf:
    - "#99cc00"
    - "#00cc66"
    - "#00cccc"

glyphs: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789"

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
`

export default createTheme(yaml)
