import type { Scene } from './index';

let current: Scene | null = null;
const waiting: Array<(scene: Scene) => void> = [];

export function setScene(scene: Scene | null): void {
  current = scene;
  if (!scene) return;
  waiting.splice(0).forEach((fn) => fn(scene));
}

export function withScene(fn: (scene: Scene) => void): void {
  if (current) fn(current);
  else waiting.push(fn);
}
