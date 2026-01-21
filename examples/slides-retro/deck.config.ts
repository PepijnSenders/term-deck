import { defineConfig } from '../src/index.js';
import retro from '../themes/retro.js';

export default defineConfig({
  title: 'term-deck Demo [RETRO]',
  author: 'term-deck',
  theme: retro,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
