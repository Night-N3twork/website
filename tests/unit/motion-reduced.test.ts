import gsap from 'gsap';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { heroTimeline, pageTimeline } from '@/motion/entrances';
import { buildRouteReveals } from '@/motion/reveals';

beforeEach(() => {
  document.documentElement.className = '';
});

afterEach(() => {
  gsap.globalTimeline.clear();
  document.body.innerHTML = '';
});

describe('reduced motion', () => {
  it('leaves reveal blocks visible and words unsplit', () => {
    document.body.innerHTML = '<main><p data-reveal>Block</p><p data-words>Two words</p></main>';
    const main = document.querySelector('main') as HTMLElement;
    buildRouteReveals(main);
    expect(main.querySelector<HTMLElement>('[data-reveal]')?.style.visibility).not.toBe('hidden');
    expect(main.querySelector('.st-word')).toBeNull();
  });

  it('returns empty entrances but still marks the intro done', () => {
    document.body.innerHTML = '<main><section class="sec"><h1 class="headline" data-intro="headline">Hello there</h1><p data-intro>Lede</p></section></main>';
    const main = document.querySelector('main') as HTMLElement;
    expect(heroTimeline({ chrome: true }).duration()).toBe(0);
    expect(pageTimeline(main).duration()).toBe(0);
    expect(main.querySelector('.hw')).toBeNull();
    expect(document.documentElement.classList.contains('intro-done')).toBe(true);
  });
});
