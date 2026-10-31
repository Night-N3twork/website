import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MARQUEE = { base: 0.55, boost: 400, maxBoost: 7, decay: 0.92, skew: 300, maxSkew: 7, rest: 120 };
const FRAME = 16.67;

export function marqueeChapter(main: HTMLElement): () => void {
  const track = main.querySelector<HTMLElement>('.marquee .marquee-track');
  const el = track?.closest<HTMLElement>('.marquee');
  if (!track || !el) return () => undefined;
  const setX = gsap.quickSetter(track, 'x', 'px') as (value: number) => void;
  const skewTo = gsap.quickTo(track, 'skewX', { duration: 0.6, ease: 'power3' });
  const state = { x: 0, dir: 1, boost: 0, half: 0, active: false, rest: 0 };
  const measure = (): void => void (state.half = track.scrollWidth / 2);
  measure();
  ScrollTrigger.addEventListener('refresh', measure);
  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => void (state.active = self.isActive),
    onUpdate: (self) => {
      const v = self.getVelocity();
      state.dir = self.direction;
      state.boost = gsap.utils.clamp(0, MARQUEE.maxBoost, Math.abs(v) / MARQUEE.boost);
      skewTo(gsap.utils.clamp(-MARQUEE.maxSkew, MARQUEE.maxSkew, -v / MARQUEE.skew));
      clearTimeout(state.rest);
      state.rest = window.setTimeout(() => skewTo(0), MARQUEE.rest);
    },
  });
  const tick = (_time: number, delta: number): void => {
    if (!state.active || !state.half) return;
    state.x = gsap.utils.wrap(-state.half, 0, state.x - state.dir * (MARQUEE.base + state.boost) * (delta / FRAME));
    state.boost *= MARQUEE.decay;
    setX(state.x);
  };
  gsap.ticker.add(tick);
  return () => {
    ScrollTrigger.removeEventListener('refresh', measure);
    gsap.ticker.remove(tick);
    clearTimeout(state.rest);
  };
}
