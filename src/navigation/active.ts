import type { Controller } from './controller';

let active: Controller | null = null;

export function setActiveController(controller: Controller | null): void {
  active = controller;
}

export function activeController(): Controller | null {
  return active;
}
