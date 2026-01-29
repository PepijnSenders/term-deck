import { defineConfig, neonTheme } from '@pep/term-deck';

export default defineConfig({
  title: 'term-deck Demo [NEON]',
  author: 'term-deck',
  theme: neonTheme,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
