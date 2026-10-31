import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { motionEnabled } from './core';
import { spinReel } from './reel';

gsap.registerPlugin(SplitText);

interface Parts {
  chars?: Element[];
  words?: Element[];
}

function split(heading: HTMLElement | null): Parts | null {
  if (!heading) return null;
  if (heading.dataset.introSplit === 'chars') return { chars: SplitText.create(heading, { type: 'chars', charsClass: 'name-char' }).chars };
  return { words: SplitText.create(heading, { type: 'words', mask: 'words', wordsClass: 'hw' }).words };
}

function markDone(): void {
  document.documentElement.classList.add('intro-done');
}

export function heroTimeline({ chrome }: { chrome: boolean }): gsap.core.Timeline {
  if (!motionEnabled()) {
    markDone();
    return gsap.timeline({ paused: true });
  }
  const words = SplitText.create('.headline', { type: 'words', mask: 'words', wordsClass: 'hw' }).words;
  gsap.set(['.headline', '.sec-hero .actions', '.stat'], { autoAlpha: 1 });
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'smooth' } });
  if (chrome) tl.from('.nav', { autoAlpha: 0, y: -14, duration: 0.8, clearProps: 'all' }, 0);
  tl.from('.pill', { autoAlpha: 0, y: 12, scale: 0.96, duration: 0.6, ease: 'pop' }, 0.04)
    .from(words, { yPercent: 110, filter: 'blur(6px)', duration: 1.1, ease: 'expo.out', stagger: 0.06, clearProps: 'filter' }, 0.12)
    .from('.sec-hero .actions .btn', { autoAlpha: 0, y: 12, filter: 'blur(3px)', duration: 0.5, stagger: 0.04, clearProps: 'filter' }, 0.5)
    .from('.stat-rule', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.9, ease: 'expo.out' }, 0.55)
    .from('.stat-num', { autoAlpha: 0, duration: 0.3 }, 0.6);
  const stat = document.querySelector('.stat-num');
  if (stat) tl.add(spinReel(stat), 0.6);
  tl.from(['.stat-unit', '.stat-line'], { autoAlpha: 0, y: 8, filter: 'blur(2px)', duration: 0.5, ease: 'pop', stagger: 0.07, clearProps: 'filter' }, 0.85)
    .from('.cue', { autoAlpha: 0, y: -8, duration: 0.6 }, 1.1);
  if (chrome && document.querySelector('.rail-tick')) tl.from('.rail', { autoAlpha: 0, x: 12, duration: 0.6 }, 1);
  markDone();
  return tl;
}

export function pageTimeline(main: HTMLElement): gsap.core.Timeline {
  const tl = gsap.timeline({ defaults: { ease: 'smooth' } });
  markDone();
  const first = main.querySelector<HTMLElement>('.sec');
  if (!first || !motionEnabled()) return tl;
  const heading = first.querySelector<HTMLElement>('[data-intro="headline"]');
  const parts = split(heading);
  const rest = [...first.querySelectorAll<HTMLElement>('[data-intro]:not([data-intro="headline"])')];
  const before = heading ? rest.filter((el) => el.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) : [];
  const after = rest.filter((el) => !before.includes(el));
  if (before.length) tl.from(before, { autoAlpha: 0, y: 14, filter: 'blur(3px)', duration: 0.6, stagger: 0.06, clearProps: 'filter' }, 0);
  if (parts?.chars) tl.from(parts.chars, { autoAlpha: 0, yPercent: 60, rotationX: -55, filter: 'blur(10px)', transformOrigin: '50% 100%', duration: 1.1, ease: 'expo.out', stagger: 0.04, clearProps: 'filter' }, 0.1);
  if (parts?.words) tl.from(parts.words, { yPercent: 110, filter: 'blur(6px)', duration: 1.1, ease: 'expo.out', stagger: 0.06, clearProps: 'filter' }, 0.1);
  if (after.length) tl.from(after, { autoAlpha: 0, y: 18, filter: 'blur(3px)', duration: 0.7, stagger: 0.08, clearProps: 'filter' }, 0.38);
  first.querySelectorAll('.reel').forEach((r) => tl.add(spinReel(r), 0.3));
  return tl;
}
