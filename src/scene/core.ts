import { type FrameName, isFrameName } from './frames';
import { sectionProgress, spansOf } from './path';

export type SceneEvent = 'ready' | 'intro:move' | 'intro:land';

export interface SceneCore {
  setSections(sections: HTMLElement[], options: { home: boolean }): void;
  sections(): HTMLElement[];
  frames(): FrameName[];
  home(): boolean;
  progress(mid: number): number;
  frameTarget(mid: number): FrameName | null;
  on(event: SceneEvent, fn: () => void): () => void;
  emit(event: SceneEvent): void;
}

const STICKY: ReadonlySet<SceneEvent> = new Set(['ready']);

export function createSceneCore(): SceneCore {
  const listeners = new Map<SceneEvent, Set<() => void>>();
  const fired = new Set<SceneEvent>();
  let sections: HTMLElement[] = [];
  let frames: FrameName[] = [];
  let home = true;

  const progress = (mid: number): number => sectionProgress(spansOf(sections, innerHeight), mid);

  return {
    setSections(next, options) {
      sections = next.filter((el) => isFrameName(el.dataset.frame));
      frames = sections.map((el) => el.dataset.frame as FrameName);
      home = options.home;
    },
    sections: () => sections,
    frames: () => frames,
    home: () => home,
    progress,
    frameTarget: (mid) => frames[Math.round(progress(mid))] ?? null,
    on(event, fn) {
      const set = listeners.get(event) ?? new Set();
      set.add(fn);
      listeners.set(event, set);
      if (fired.has(event)) fn();
      return () => set.delete(fn);
    },
    emit(event) {
      if (STICKY.has(event)) fired.add(event);
      listeners.get(event)?.forEach((fn) => fn());
    },
  };
}
