import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { glide, motionEnabled } from '@/motion/core';

const FILTER_REVEAL = 120;

let running: gsap.core.Timeline | null = null;

export function stopGroups(): void {
  running?.progress(1).kill();
  running = null;
}

function reveal(groups: HTMLElement[]): void {
  const index = groups[0]?.parentElement;
  if (index && index.getBoundingClientRect().top < FILTER_REVEAL) glide(index);
}

function settle(): void {
  running = null;
  ScrollTrigger.refresh();
}

export function flipGroups(groups: HTMLElement[], apply: () => void): gsap.core.Timeline | null {
  stopGroups();
  reveal(groups);
  if (!motionEnabled()) {
    apply();
    settle();
    return null;
  }
  gsap.registerPlugin(Flip);
  const state = Flip.getState(groups);
  apply();
  running = Flip.from(state, {
    duration: 0.6,
    ease: 'smooth',
    absoluteOnLeave: true,
    stagger: 0.04,
    onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'smooth' }),
    onLeave: (els) => gsap.to(els, { autoAlpha: 0, y: -8, duration: 0.25, ease: 'power2.in' }),
    onComplete: settle,
  });
  return running;
}
