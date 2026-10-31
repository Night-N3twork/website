import { motionEnabled } from '@/motion/core';
import { deckChapter } from './deck';
import { heroExit } from './hero-exit';
import { marqueeChapter } from './marquee';
import { navState } from './nav-state';

export interface ChapterOptions {
  entered: Promise<void>;
  context: gsap.Context;
}

let global = false;

export function buildGlobalChapters(): void {
  if (global) return;
  global = Boolean(navState());
}

export function buildRouteChapters(main: HTMLElement, { entered, context }: ChapterOptions): () => void {
  const cleanups = [deckChapter(main)];
  if (motionEnabled()) {
    cleanups.push(marqueeChapter(main));
    let live = true;
    cleanups.push(() => void (live = false));
    void entered.then(() => {
      if (live) context.add(() => heroExit(main));
    });
  }
  return () => cleanups.forEach((off) => off());
}
