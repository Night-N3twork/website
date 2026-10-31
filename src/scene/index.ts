import { createSceneCore, type SceneEvent } from './core';
import type { FrameName } from './frames';
import type { Backdrop } from './sky';
import { createStage } from './stage';

export type { FrameName } from './frames';
export type { Backdrop } from './sky';
export type { SceneEvent } from './core';

export interface Scene {
  setSections(sections: HTMLElement[], options: { home: boolean }): void;
  nudge(kind: 'route' | 'hover'): void;
  startIntro(): void;
  startMove(): void;
  frameTarget(): FrameName | null;
  on(event: SceneEvent, fn: () => void): () => void;
  dispose(): void;
}

export interface SceneOptions {
  backdrop: Backdrop;
  still: boolean;
}

export function mountScene(canvas: HTMLCanvasElement, { backdrop, still }: SceneOptions): Scene {
  const core = createSceneCore();
  const stage = createStage({ canvas, core, backdrop, still });
  return {
    setSections(sections, options) {
      core.setSections(sections, options);
      stage.rebuild();
    },
    nudge: stage.nudge,
    startIntro: stage.startIntro,
    startMove: stage.startMove,
    frameTarget: () => core.frameTarget(innerHeight / 2),
    on: core.on,
    dispose: stage.dispose,
  };
}
