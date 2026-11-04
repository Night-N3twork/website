import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

const LENIS = { lerp: 0.085, autoRaf: false };
const GLIDE = 1.4;

let lenis: Lenis | null = null;
let ready = false;

export const motionEnabled = (): boolean => document.documentElement.classList.contains('motion');
export const getLenis = (): Lenis | null => lenis;

export function initMotion(): void {
  if (ready) return;
  ready = true;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('smooth', '0.22,1,0.36,1');
  CustomEase.create('reel', '0.16,1,0.3,1');
  CustomEase.create('pop', '0.34,1.45,0.64,1');
  ScrollTrigger.clearScrollMemory('manual');
  if (!motionEnabled()) return;
  void import('lenis').then(({ default: Lenis }) => {
    const instance = new Lenis(LENIS);
    instance.stop();
    instance.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => instance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis = instance;
  });
}

export function glide(target: number | HTMLElement): void {
  if (lenis) {
    lenis.scrollTo(target, { duration: GLIDE });
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior: 'auto' });
}

export function jumpTo(top: number): void {
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(top, { immediate: true, force: true });
  } else scrollTo(0, top);
}

export const jumpToTop = (): void => jumpTo(0);
