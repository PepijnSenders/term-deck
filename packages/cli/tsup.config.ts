import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'bin/term-deck': 'bin/term-deck.ts',
    'index': 'src/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  shims: true,
  splitting: false,
  treeshake: true,
  external: [
    'neo-blessed',
    'canvas',
  ],
});
