import { describe, it, expect, mock, spyOn } from 'bun:test';
import { jumpToSlide, nextSlide, prevSlide } from '../main';
import type { Presenter } from '../main';
import { createRenderer, destroyRenderer } from '../../renderer/screen';
import { DEFAULT_THEME } from '../../schemas/theme';
import type { Deck } from '../../core/slide';
import type { Slide } from '../../schemas/slide';

/**
 * Create a test presenter with a real renderer but mocked navigation
 */
function createTestPresenter(slideCount: number): Presenter {
  const slides: Slide[] = Array.from({ length: slideCount }, (_, i) => ({
    frontmatter: { title: `Slide ${i}` },
    body: `Content for slide ${i}`,
    notes: '',
    sourcePath: `/slides/${i}.md`,
    index: i,
  }));

  const deck: Deck = {
    slides,
    config: {
      title: 'Test Deck',
      author: 'Test Author',
      theme: DEFAULT_THEME,
      settings: {
        startSlide: 0,
        loop: false,
        autoAdvance: 0,
        showSlideNumbers: true,
        showProgress: true,
      },
    },
    basePath: '/slides',
  };

  const renderer = createRenderer(DEFAULT_THEME);

  return {
    deck,
    renderer,
    currentSlide: 0,
    isAnimating: false,
    notesWindow: null,
    autoAdvanceTimer: null,
    progressBar: null,
  };
}

describe('Presenter Navigation', () => {
  describe('jumpToSlide', () => {
    it('checks bounds - accepts valid index', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 0;

      await jumpToSlide(presenter, 5);

      expect(presenter.currentSlide).toBe(5);
      destroyRenderer(presenter.renderer);
    });

    it('checks bounds - ignores negative index', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 5;

      await jumpToSlide(presenter, -1);

      // Should remain at current slide
      expect(presenter.currentSlide).toBe(5);
      destroyRenderer(presenter.renderer);
    });

    it('checks bounds - ignores index beyond deck length', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 5;

      await jumpToSlide(presenter, 10);

      // Should remain at current slide
      expect(presenter.currentSlide).toBe(5);
      destroyRenderer(presenter.renderer);
    });

    it('checks bounds - ignores index far beyond deck length', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 5;

      await jumpToSlide(presenter, 100);

      // Should remain at current slide
      expect(presenter.currentSlide).toBe(5);
      destroyRenderer(presenter.renderer);
    });

    it('updates currentSlide when jumping', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 0;

      await jumpToSlide(presenter, 7);

      expect(presenter.currentSlide).toBe(7);
      destroyRenderer(presenter.renderer);
    });

    it('handles jump to first slide', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 5;

      await jumpToSlide(presenter, 0);

      expect(presenter.currentSlide).toBe(0);
      destroyRenderer(presenter.renderer);
    });

    it('handles jump to last slide', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 0;

      await jumpToSlide(presenter, 9);

      expect(presenter.currentSlide).toBe(9);
      destroyRenderer(presenter.renderer);
    });

    it('handles jump to same slide', async () => {
      const presenter = createTestPresenter(10);
      presenter.currentSlide = 5;

      await jumpToSlide(presenter, 5);

      expect(presenter.currentSlide).toBe(5);
      destroyRenderer(presenter.renderer);
    });

    it('handles single-slide deck', async () => {
      const presenter = createTestPresenter(1);

      await jumpToSlide(presenter, 0);

      expect(presenter.currentSlide).toBe(0);
      destroyRenderer(presenter.renderer);
    });

    it('rejects invalid index in single-slide deck', async () => {
      const presenter = createTestPresenter(1);

      await jumpToSlide(presenter, 1);

      expect(presenter.currentSlide).toBe(0);
      destroyRenderer(presenter.renderer);
    });

    it('preserves window stack by re-rendering from start', async () => {
      const presenter = createTestPresenter(5);
      presenter.currentSlide = 0;

      await jumpToSlide(presenter, 3);

      // Should have created windows for slides 0-3 (4 windows total)
      expect(presenter.renderer.windowStack.length).toBe(4);
      destroyRenderer(presenter.renderer);
    });
  });

  describe('nextSlide', () => {
    it('advances to next slide', async () => {
      const presenter = createTestPresenter(5);
      presenter.currentSlide = 0;

      await nextSlide(presenter);

      expect(presenter.currentSlide).toBe(1);
      destroyRenderer(presenter.renderer);
    });

    it('does not advance past last slide when loop is disabled', async () => {
      const presenter = createTestPresenter(3);
      presenter.currentSlide = 2;

      await nextSlide(presenter);

      // Should stay at slide 2
      expect(presenter.currentSlide).toBe(2);
      destroyRenderer(presenter.renderer);
    });

    it('loops to first slide when loop is enabled', async () => {
      const presenter = createTestPresenter(3);
      presenter.deck.config.settings = { loop: true } as any;
      presenter.currentSlide = 2;

      await nextSlide(presenter);

      expect(presenter.currentSlide).toBe(0);
      destroyRenderer(presenter.renderer);
    });
  });

  describe('prevSlide', () => {
    it('goes to previous slide', async () => {
      const presenter = createTestPresenter(5);
      presenter.currentSlide = 2;

      await prevSlide(presenter);

      expect(presenter.currentSlide).toBe(1);
      destroyRenderer(presenter.renderer);
    });

    it('does not go before first slide when loop is disabled', async () => {
      const presenter = createTestPresenter(3);
      presenter.currentSlide = 0;

      await prevSlide(presenter);

      // Should stay at slide 0
      expect(presenter.currentSlide).toBe(0);
      destroyRenderer(presenter.renderer);
    });

    it('loops to last slide when loop is enabled', async () => {
      const presenter = createTestPresenter(3);
      presenter.deck.config.settings = { loop: true } as any;
      presenter.currentSlide = 0;

      await prevSlide(presenter);

      expect(presenter.currentSlide).toBe(2);
      destroyRenderer(presenter.renderer);
    });

    it('re-renders from start to preserve stacking', async () => {
      const presenter = createTestPresenter(5);
      presenter.currentSlide = 3;

      await prevSlide(presenter);

      // Should have windows for slides 0, 1, 2 (3 windows)
      expect(presenter.renderer.windowStack.length).toBe(3);
      destroyRenderer(presenter.renderer);
    });
  });
});
