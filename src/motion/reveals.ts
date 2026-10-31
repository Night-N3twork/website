import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { motionEnabled } from './core';

gsap.registerPlugin(SplitText);

const hasCut = (el: Element): boolean => el.matches('.cut') || Boolean(el.querySelector('.cut'));
const expand = (el: HTMLElement): Element[] => (el.dataset.reveal === 'children' ? [...el.querySelectorAll(':scope > :not([aria-hidden])')] : [el]);
const within = (main: HTMLElement, selector: string): HTMLElement[] => [...main.querySelectorAll<HTMLElement>(selector)];

function blocks(main: HTMLElement): void {
  const items = within(main, '[data-reveal]').flatMap(expand);
  if (!items.length) return;
  gsap.set(items.filter((el) => !hasCut(el)), { autoAlpha: 0, y: 16, filter: 'blur(3px)' });
  gsap.set(items.filter(hasCut), { autoAlpha: 0, y: 24, scale: 0.97 });
  const show = (els: Element[], vars: gsap.TweenVars): void => {
    if (els.length) gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'smooth', stagger: 0.06, overwrite: 'auto', ...vars });
  };
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      show(batch.filter((el) => !hasCut(el)), { filter: 'blur(0px)', clearProps: 'transform,filter' });
      show(batch.filter(hasCut), { scale: 1, duration: 0.8 });
    },
  });
}

function titles(main: HTMLElement): void {
  within(main, '[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines,words',
      mask: 'lines',
      linesClass: 'line',
      wordsClass: 'word',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.words, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
    });
  });
}

function statement(main: HTMLElement): void {
  const [el] = within(main, '[data-words]');
  if (!el) return;
  const { words } = SplitText.create(el, { type: 'words', wordsClass: 'st-word' });
  gsap.fromTo(words, { opacity: 0.14, filter: 'blur(4px)' }, {
    opacity: 1,
    filter: 'blur(0px)',
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
  });
}

function mega(main: HTMLElement): void {
  const [el] = within(main, '[data-chars]');
  if (!el) return;
  const { chars } = SplitText.create(el, { type: 'chars', charsClass: 'mega-char' });
  gsap.from(chars, {
    autoAlpha: 0,
    yPercent: 60,
    rotationX: -50,
    filter: 'blur(10px)',
    transformOrigin: '50% 100%',
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.06,
    clearProps: 'filter',
    scrollTrigger: { trigger: el, start: 'top 80%', once: true },
  });
}

function stream(main: HTMLElement): void {
  const lines = within(main, '[data-stream]');
  const term = lines[0]?.closest('.term');
  if (!term) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: term, start: 'top 72%', once: true } });
  lines.forEach((line) => {
    const { words } = SplitText.create(line, { type: 'words', wordsClass: 'tw' });
    tl.from(line.previousElementSibling, { autoAlpha: 0, x: -6, duration: 0.3, ease: 'smooth' }, '>-0.05')
      .from(words, { autoAlpha: 0, filter: 'blur(1px)', duration: 0.35, ease: 'smooth', stagger: 0.06, clearProps: 'filter' }, '<0.08');
  });
  tl.call(() => term.classList.add('is-typed'));
}

export function buildRouteReveals(main: HTMLElement): void {
  if (!motionEnabled()) return;
  [blocks, titles, statement, mega, stream].forEach((build) => build(main));
}

export function buildGlobalReveals(): void {
  const chars = document.querySelectorAll('.foot-word .foot-char');
  if (!motionEnabled() || !chars.length) return;
  gsap.from(chars, { yPercent: 80, opacity: 0, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: '.foot', start: 'top 90%', end: 'bottom bottom', scrub: 0.8 } });
}
