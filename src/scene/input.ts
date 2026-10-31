import { MathUtils } from 'three';
import { damp } from './curves';
import { INTERACTIVE, SPIN } from './frames';
import type { SpringState } from './springs';

const QUICK_PX = 6;
const QUICK_MS = 320;

export interface Pointer {
  x: number;
  y: number;
  tx: number;
  ty: number;
  cx: number;
  cy: number;
  moved: boolean;
  overUi: boolean;
}

export interface Input {
  pointer: Pointer;
  dragging(): boolean;
  hover(): number;
  update(dt: number): void;
  dispose(): void;
}

interface InputOptions {
  spin: SpringState;
  hitTest(x: number, y: number): boolean;
  onKick(): void;
}

interface Drag {
  active: boolean;
  pending: boolean;
  lastX: number;
  lastT: number;
  moved: number;
  downAt: number;
}

const setCursor = (state: string): void => {
  document.body.dataset.glass = state;
};

function trackPointer(pointer: Pointer, drag: Drag, spin: SpringState, signal: AbortSignal): void {
  addEventListener('pointermove', (e) => {
    Object.assign(pointer, { tx: (e.clientX / innerWidth) * 2 - 1, ty: (e.clientY / innerHeight) * 2 - 1, cx: e.clientX, cy: e.clientY, moved: true });
    pointer.overUi = Boolean((e.target as Element | null)?.closest?.(INTERACTIVE));
    if (!drag.active) return;
    const now = performance.now();
    const dx = e.clientX - drag.lastX;
    spin.x += dx * SPIN.drag;
    spin.v = MathUtils.clamp((dx * SPIN.drag) / Math.max((now - drag.lastT) / 1000, 1 / 240), -SPIN.max, SPIN.max);
    Object.assign(drag, { moved: drag.moved + Math.abs(dx), lastX: e.clientX, lastT: now });
  }, { signal });
  document.addEventListener('pointerleave', () => {
    pointer.tx = 0;
    pointer.ty = 0;
  }, { signal });
}

function trackDrag(drag: Drag, { hitTest, onKick }: Omit<InputOptions, 'spin'>, hovered: () => boolean, signal: AbortSignal): void {
  addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as Element | null)?.closest?.(INTERACTIVE) || !hitTest(e.clientX, e.clientY)) return;
    const now = performance.now();
    Object.assign(drag, { active: e.pointerType !== 'touch', pending: true, lastX: e.clientX, lastT: now, moved: 0, downAt: now });
    if (!drag.active) return;
    e.preventDefault();
    setCursor('drag');
  }, { signal });
  const release = (): void => {
    if (!drag.pending) return;
    const quick = drag.moved < QUICK_PX && performance.now() - drag.downAt < QUICK_MS;
    drag.active = false;
    drag.pending = false;
    if (quick) onKick();
    setCursor(hovered() ? 'hover' : '');
  };
  addEventListener('pointerup', release, { signal });
  addEventListener('pointercancel', release, { signal });
}

export function createInput({ spin, hitTest, onKick }: InputOptions): Input {
  const abort = new AbortController();
  const pointer: Pointer = { x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0, moved: false, overUi: true };
  const drag: Drag = { active: false, pending: false, lastX: 0, lastT: 0, moved: 0, downAt: 0 };
  let hovered = false;
  let hover = 0;
  trackPointer(pointer, drag, spin, abort.signal);
  trackDrag(drag, { hitTest, onKick }, () => hovered, abort.signal);

  return {
    pointer,
    dragging: () => drag.active,
    hover: () => hover,
    update(dt) {
      pointer.x += (pointer.tx - pointer.x) * damp(4, dt);
      pointer.y += (pointer.ty - pointer.y) * damp(4, dt);
      if (pointer.moved && !drag.active) {
        pointer.moved = false;
        const next = !pointer.overUi && hitTest(pointer.cx, pointer.cy);
        if (next !== hovered) setCursor(next ? 'hover' : '');
        hovered = next;
      }
      hover += ((hovered || drag.active ? 1 : 0) - hover) * damp(8, dt);
    },
    dispose() {
      abort.abort();
      delete document.body.dataset.glass;
    },
  };
}
