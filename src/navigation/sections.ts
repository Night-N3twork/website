import { useSyncExternalStore } from 'react';

export interface RailSection {
  index: number;
  label: string;
  el: HTMLElement;
}

const EMPTY: RailSection[] = [];
let sections: RailSection[] = EMPTY;
const listeners = new Set<() => void>();

function labelOf(el: HTMLElement): string {
  return el.querySelector('h1, h2')?.textContent?.trim() || el.getAttribute('aria-label') || '';
}

export function publishSections(main: HTMLElement): void {
  sections = [...main.querySelectorAll<HTMLElement>('[data-frame]')].map((el, index) => ({ index, label: labelOf(el), el }));
  listeners.forEach((fn) => fn());
}

export function currentSections(): RailSection[] {
  return sections;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSections(): RailSection[] {
  return useSyncExternalStore(subscribe, currentSections, () => EMPTY);
}
