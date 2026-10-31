import type gsap from 'gsap';
import { spinReel } from '@/motion/reel';

export function statReplay(main: HTMLElement, signal: AbortSignal): void {
  const stat = main.querySelector<HTMLElement>('.stat');
  const num = stat?.querySelector('.stat-num');
  if (!stat || !num) return;
  let spin: gsap.core.Timeline | null = null;
  stat.addEventListener('pointerenter', () => {
    if (!document.documentElement.classList.contains('intro-done') || spin?.isActive()) return;
    spin = spinReel(num);
  }, { signal });
}
