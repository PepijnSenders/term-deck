import { defineConfig, minimalTheme } from '@pep/term-deck';

export default defineConfig({
  title: 'term-deck Demo [MINIMAL]',
  author: 'term-deck',
  theme: minimalTheme,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
