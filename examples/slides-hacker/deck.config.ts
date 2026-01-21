import { defineConfig } from '../src/index.js';
import hacker from '../themes/hacker.js';

export default defineConfig({
  title: 'term-deck Demo [HACKER]',
  author: 'term-deck',
  theme: hacker,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
