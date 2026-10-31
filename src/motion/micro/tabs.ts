import gsap from 'gsap';
import { motionEnabled } from '@/motion/core';

export function fadePanel(panel: HTMLElement | null): void {
  if (!panel || !motionEnabled()) return;
  gsap.fromTo(panel.children, { autoAlpha: 0, y: 8, filter: 'blur(2px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.35, ease: 'smooth', stagger: 0.04, overwrite: true, clearProps: 'opacity,visibility,transform,filter' });
}
