import { motionEnabled } from '@/motion/core';
import { withScene } from '@/scene/slot';
import { trackCursor } from './cursor';
import { liftGroups } from './lift';
import { magnetic } from './magnetic';
import { statReplay } from './stat';
import { tilt } from './tilt';
import { footWave } from './wave';

const NUDGE_TARGETS = 'a.index-row, a.row, a.partner';

export interface RouteMicroOptions {
  nudge?: () => void;
}

let mounted = false;

const finePointer = (): boolean => matchMedia('(hover: hover) and (pointer: fine)').matches;
const sceneNudge = (): void => withScene((scene) => scene.nudge('hover'));

export function mountGlobalMicro(): void {
  if (mounted || !finePointer() || !motionEnabled()) return;
  mounted = true;
  liftGroups();
  trackCursor();
  footWave();
}

function rowNudges(main: HTMLElement, signal: AbortSignal, nudge: () => void): void {
  main.addEventListener('pointerover', (event) => {
    const link = (event.target as Element | null)?.closest?.(NUDGE_TARGETS);
    if (link && !link.contains(event.relatedTarget as Node | null)) nudge();
  }, { signal });
}

export function mountRouteMicro(main: HTMLElement, signal: AbortSignal, { nudge = sceneNudge }: RouteMicroOptions = {}): void {
  if (!finePointer()) return;
  rowNudges(main, signal, nudge);
  if (!motionEnabled()) return;
  magnetic(main, signal);
  tilt(main, signal);
  statReplay(main, signal);
}
