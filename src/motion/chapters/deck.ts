import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { glide, motionEnabled } from '@/motion/core';
import { setReel } from '@/motion/reel';
import { slidePill } from '@/ui/glass/pill';

const pad = (n: number): string => String(n).padStart(2, '0');

const parts = (root: ParentNode) => ({
  slides: [...root.querySelectorAll<HTMLElement>('.deck-slide')],
  buttons: [...root.querySelectorAll<HTMLElement>('.deck-index button')],
  marker: root.querySelector<HTMLElement>('.deck-marker'),
  reel: root.querySelector<HTMLElement>('.deck-reel'),
});

function swapSlide(slides: HTMLElement[], from: number, to: number): void {
  const out = slides[from];
  const incoming = slides[to];
  gsap.to(out.children, { autoAlpha: 0, y: -4, filter: 'blur(2px)', duration: 0.15, ease: 'power2.in', overwrite: true, onComplete: () => void (out.hidden = true) });
  incoming.hidden = false;
  gsap.fromTo(incoming.children, { autoAlpha: 0, y: 8, filter: 'blur(3px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'smooth', stagger: 0.04, delay: 0.1, overwrite: true, clearProps: 'filter' });
}

export function syncDeck(root: ParentNode, next: number, { instant = false, from }: { instant?: boolean; from?: number } = {}): void {
  const { slides, buttons, marker, reel } = parts(root);
  buttons.forEach((b, i) => (i === next ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
  const item = buttons[next]?.parentElement;
  if (marker && item) slidePill(marker, item, instant, 'y');
  if (reel) setReel(reel, pad(next + 1), { instant });
  if (instant || from === undefined) {
    slides.forEach((s, i) => (s.hidden = i !== next));
    return;
  }
  swapSlide(slides, from, next);
  slides.forEach((s, i) => {
    if (i !== from && i !== next) s.hidden = true;
  });
}

export function deckChapter(main: HTMLElement): () => void {
  const sec = main.querySelector<HTMLElement>('.sec-products');
  if (!sec) return () => undefined;
  const { slides, buttons } = parts(sec);
  const bar = sec.querySelector<HTMLElement>('.deck-bar span');
  const n = slides.length;
  const motion = motionEnabled();
  const stepAt = (progress: number): number => Math.min(n - 1, Math.floor(progress * n));
  let current = 0;
  gsap.set(slides.flatMap((s) => [...s.children]), { clearProps: 'opacity,visibility,transform,filter' });
  const st = ScrollTrigger.create({
    trigger: sec,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      bar?.style.setProperty('transform', `scaleX(${self.progress.toFixed(4)})`);
      const next = stepAt(self.progress);
      if (next === current) return;
      syncDeck(sec, next, { instant: !motion, from: current });
      current = next;
    },
  });
  const jumps = buttons.map((b, i) => {
    const jump = (): void => glide(st.start + (st.end - st.start) * ((i + 0.5) / n));
    b.addEventListener('click', jump);
    return () => b.removeEventListener('click', jump);
  });
  current = stepAt(st.progress);
  syncDeck(sec, current, { instant: true });
  const place = (): void => {
    const marker = sec.querySelector<HTMLElement>('.deck-marker');
    const item = buttons[current]?.parentElement;
    if (marker && item) slidePill(marker, item, true, 'y');
  };
  place();
  ScrollTrigger.addEventListener('refresh', place);
  return () => {
    jumps.forEach((off) => off());
    ScrollTrigger.removeEventListener('refresh', place);
    st.kill();
  };
}
