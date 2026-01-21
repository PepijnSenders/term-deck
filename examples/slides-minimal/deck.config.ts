import { defineConfig } from '../src/index.js';
import minimal from '../themes/minimal.js';

export default defineConfig({
  title: 'term-deck Demo [MINIMAL]',
  author: 'term-deck',
  theme: minimal,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
