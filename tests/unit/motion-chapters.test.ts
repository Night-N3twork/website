import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initMotion } from '@/motion/core';
import { describe, expect, it, vi } from 'vitest';
import { buildRouteChapters } from '@/motion/chapters';
import { deckChapter, syncDeck } from '@/motion/chapters/deck';

vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined }));

function deck(n: number): HTMLElement {
  const root = document.createElement('section');
  root.className = 'sec sec-products';
  const buttons = Array.from({ length: n }, (_, i) => `<li><button data-index="${i}"${i ? '' : ' aria-current="step"'}>p${i}</button></li>`).join('');
  const slides = Array.from({ length: n }, (_, i) => `<div class="deck-slide"${i ? ' hidden' : ''}><h3>p${i}</h3></div>`).join('');
  root.innerHTML = `<ol class="deck-index"><li class="deck-marker"></li>${buttons}</ol><span class="deck-reel reel"><span class="sr-only">01</span><span class="reel-track"><span class="reel-digit"><span class="reel-strip" data-d="0"></span></span><span class="reel-digit"><span class="reel-strip" data-d="1"></span></span></span></span><div class="deck-slides">${slides}</div><div class="deck-bar"><span></span></div>`;
  return root;
}

describe('deck', () => {
  it('deck slide follows the active step', () => {
    const root = deck(4);
    syncDeck(root, 2, { instant: true });
    const slides = [...root.querySelectorAll<HTMLElement>('.deck-slide')];
    expect(slides.map((s) => s.hidden)).toEqual([true, true, false, true]);
    expect(root.querySelector('[aria-current="step"]')?.getAttribute('data-index')).toBe('2');
    expect(root.querySelector('.deck-reel .sr-only')?.textContent).toBe('03');
  });
});

describe('deckChapter', () => {
  it('resyncs reused deck markup to the scroll position on mount', () => {
    initMotion();
    const main = document.createElement('main');
    const root = deck(3);
    main.append(root);
    document.body.append(main);
    syncDeck(root, 2, { instant: true });
    const first = root.querySelector<HTMLElement>('.deck-slide h3')!;
    first.style.visibility = 'hidden';
    first.style.opacity = '0';
    const ctx = gsap.context(() => undefined);
    let cleanup = (): void => undefined;
    ctx.add(() => {
      cleanup = deckChapter(main);
    });
    const slides = [...root.querySelectorAll<HTMLElement>('.deck-slide')];
    expect(slides.map((s) => s.hidden)).toEqual([false, true, true]);
    expect(root.querySelector('[aria-current="step"]')?.getAttribute('data-index')).toBe('0');
    expect(first.style.visibility).toBe('');
    expect(first.style.opacity).toBe('');
    cleanup();
    ctx.revert();
    main.remove();
  });
});

describe('chapter cleanup', () => {
  it('leaves no scroll triggers behind', () => {
    initMotion();
    const main = document.createElement('main');
    main.append(deck(3));
    main.insertAdjacentHTML('beforeend', '<div class="marquee"><div class="marquee-track"></div></div>');
    document.body.append(main);
    const before = ScrollTrigger.getAll().length;
    const cleanup = buildRouteChapters(main, { entered: new Promise(() => undefined), context: gsap.context(() => undefined) });
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(before);
    cleanup();
    expect(ScrollTrigger.getAll().length).toBe(before);
    main.remove();
  });
});

describe('buildRouteChapters', () => {
  it('chapters are a no-op without their sections', () => {
    const main = document.createElement('main');
    const ctx = gsap.context(() => undefined);
    const cleanup = buildRouteChapters(main, { entered: Promise.resolve(), context: ctx });
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
    ctx.revert();
  });
});

describe('route chapters', () => {
  it('leave no triggers after the route context reverts', () => {
    initMotion();
    const main = document.createElement('main');
    main.append(deck(3));
    document.body.append(main);
    const before = ScrollTrigger.getAll().length;
    const ctx = gsap.context(() => undefined);
    let cleanup = (): void => undefined;
    ctx.add(() => {
      cleanup = buildRouteChapters(main, { entered: Promise.resolve(), context: ctx });
    });
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(before);
    cleanup();
    ctx.revert();
    expect(ScrollTrigger.getAll().length).toBe(before);
    main.remove();
  });
});
