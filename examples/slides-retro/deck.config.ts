import { defineConfig, retroTheme } from '@pep/term-deck';

export default defineConfig({
  title: 'term-deck Demo [RETRO]',
  author: 'term-deck',
  theme: retroTheme,
  settings: {
    startSlide: 0,
    loop: false,
    showProgress: false,
  },
});
