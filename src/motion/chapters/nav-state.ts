import { ScrollTrigger } from 'gsap/ScrollTrigger';

const NAV_SOLID = 40;
const NAV_HIDE = 160;

export function navState(): ScrollTrigger | null {
  const nav = document.querySelector<HTMLElement>('.nav');
  if (!nav) return null;
  return ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > NAV_SOLID);
      nav.classList.toggle('is-hidden', y > NAV_HIDE && self.direction > 0 && !nav.contains(document.activeElement));
      document.body.classList.toggle('scrolled', y > NAV_SOLID);
    },
  });
}
