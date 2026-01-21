import { defineConfig } from '../src/index.js';
import neon from '../themes/neon.js';

export default defineConfig({
  title: 'term-deck Demo [NEON]',
  author: 'term-deck',
  theme: neon,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
