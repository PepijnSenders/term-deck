import { defineConfig } from '../src/index.js';
import matrix from '../src/themes/matrix/index.js';

export default defineConfig({
  title: 'term-deck Demo',
  author: 'term-deck',
  theme: matrix,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
