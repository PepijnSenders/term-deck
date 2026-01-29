import { defineConfig, matrixTheme } from '@pep/term-deck';

export default defineConfig({
  title: 'term-deck Demo',
  author: 'term-deck',
  theme: matrixTheme,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
