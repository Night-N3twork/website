import gsap from 'gsap';
import { motionEnabled } from '@/motion/core';

const LEAVE = { duration: 0.45, ease: 'power2.in', y: -24, blur: 6, stagger: 0.04, fadeAt: 0.05 };
const BAR = { in: 0.55, out: 0.7, ease: 'expo.inOut' };

const routeBar = (): HTMLElement | null => document.querySelector('.route-bar');

function visibleSections(main: HTMLElement): HTMLElement[] {
  return [...main.querySelectorAll<HTMLElement>('.sec:not(.sec-products)')].filter((el) => {
    const { top, bottom } = el.getBoundingClientRect();
    return bottom > 0 && top < innerHeight;
  });
}

export function restoreRoute(main: HTMLElement): void {
  gsap.set(main, { clearProps: 'opacity,visibility' });
  gsap.set(main.querySelectorAll('.sec'), { clearProps: 'transform,filter' });
}

export function leaveRoute(main: HTMLElement, signal: AbortSignal): Promise<void> {
  if (!motionEnabled() || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const tl = gsap.timeline({ defaults: { duration: LEAVE.duration, ease: LEAVE.ease }, onComplete: () => resolve() });
    const sections = visibleSections(main);
    if (sections.length) tl.to(sections, { y: LEAVE.y, filter: `blur(${LEAVE.blur}px)`, stagger: LEAVE.stagger }, 0);
    tl.to(main, { autoAlpha: 0 }, LEAVE.fadeAt);
    const bar = routeBar();
    if (bar) tl.fromTo(bar, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: BAR.in, ease: BAR.ease }, 0);
    signal.addEventListener('abort', () => {
      tl.kill();
      restoreRoute(main);
      resolve();
    }, { once: true });
  });
}

export function enterRoute(main: HTMLElement): void {
  restoreRoute(main);
  const bar = routeBar();
  if (!bar || !motionEnabled()) return;
  gsap.fromTo(bar, { scaleX: 1, transformOrigin: '100% 50%' }, { scaleX: 0, duration: BAR.out, ease: BAR.ease, overwrite: true });
}
