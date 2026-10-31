import gsap from 'gsap';

const STEP = 5;
const CYCLE = 10;

const strips = (reel: Element): HTMLElement[] => [...reel.querySelectorAll<HTMLElement>('.reel-strip')];
const at = (digit: number, cycle: number): number => -(digit + cycle * CYCLE) * STEP;

export function spinReel(reel: Element, { delay = 0 }: { delay?: number } = {}): gsap.core.Timeline {
  const list = strips(reel);
  list.forEach((strip) => (strip.dataset.cycle = '1'));
  const tl = gsap.timeline({ delay });
  tl.fromTo(list, { y: 0, yPercent: (_i: number, el: HTMLElement) => at(Number(el.dataset.d), 0) }, {
    yPercent: (_i: number, el: HTMLElement) => at(Number(el.dataset.d), 1),
    duration: 1.4,
    ease: 'reel',
    stagger: 0.09,
  }, 0);
  tl.fromTo(reel.querySelector('.reel-track'), { filter: 'blur(3px)' }, { filter: 'blur(0px)', duration: 1.1, ease: 'reel', clearProps: 'filter' }, 0.1);
  return tl;
}

export function setReel(reel: Element, text: string, { instant = false }: { instant?: boolean } = {}): void {
  const digits = [...text].filter((ch) => /\d/.test(ch)).map(Number);
  const label = reel.querySelector('.sr-only');
  if (label) label.textContent = text;
  strips(reel).forEach((strip, i) => {
    const next = digits[i];
    if (next === undefined || Number(strip.dataset.d) === next) return;
    strip.dataset.d = String(next);
    strip.style.setProperty('--d', String(next));
    const yPercent = at(next, Number(strip.dataset.cycle ?? 0));
    if (instant) gsap.set(strip, { y: 0, yPercent });
    else gsap.to(strip, { y: 0, yPercent, duration: 0.5, ease: 'pop', overwrite: true });
  });
}
