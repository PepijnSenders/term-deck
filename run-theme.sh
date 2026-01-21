#!/usr/bin/env bash

# Quick launcher script for different themes

if [ -z "$1" ]; then
  echo "Usage: ./run-theme.sh [matrix|neon|retro|minimal|hacker]"
  echo ""
  echo "Available themes:"
  echo "  matrix  - Classic green Matrix aesthetic (default)"
  echo "  neon    - Hot pink and cyan cyberpunk"
  echo "  retro   - 80s synthwave purple and orange"
  echo "  minimal - Clean monochrome"
  echo "  hacker  - Classic green terminal"
  exit 1
fi

THEME=$1

case $THEME in
  matrix)
    echo "🟢 Launching MATRIX theme..."
    bun bin/term-deck.ts examples/slides-matrix/
    ;;
  neon)
    echo "💗 Launching NEON theme..."
    bun bin/term-deck.ts examples/slides-neon/
    ;;
  retro)
    echo "🌆 Launching RETRO theme..."
    bun bin/term-deck.ts examples/slides-retro/
    ;;
  minimal)
    echo "⚪ Launching MINIMAL theme..."
    bun bin/term-deck.ts examples/slides-minimal/
    ;;
  hacker)
    echo "💚 Launching HACKER theme..."
    bun bin/term-deck.ts examples/slides-hacker/
    ;;
  *)
    echo "Unknown theme: $THEME"
    echo "Available: matrix, neon, retro, minimal, hacker"
    exit 1
    ;;
esac
