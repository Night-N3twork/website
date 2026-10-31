import { INTRO } from './frames';

export interface IntroState {
  started: boolean;
  bright: number;
  lift: number;
  stars: number;
  glow: number;
  zoom: number;
}

export interface MoveState {
  t: number;
  reach: number;
  grow: number;
  flip: number;
}

export const clamp01 = (x: number): number => Math.min(Math.max(x, 0), 1);
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);
export const easeOutExpo = (x: number): number => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(x)));
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
export const wrapAngle = (a: number): number => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

export function backOut(x: number, c: number): number {
  const u = clamp01(x) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

export function introState(start: number | null, now: number, still: boolean): IntroState {
  if (start === null) return { started: false, bright: 0, lift: 1, stars: 0, glow: 0, zoom: 1.09 };
  if (still) return { started: true, bright: 1, lift: 0, stars: 1, glow: 1, zoom: 1 };
  const it = (now - start) / 1000;
  return {
    started: it > 0.3,
    bright: easeOutCubic(it / 1.4),
    lift: 1 - easeOutExpo((it - 0.35) / 1.9),
    stars: clamp01((it - 0.9) / 1.4),
    glow: clamp01((it - 0.8) / 1.2),
    zoom: 1 + 0.09 * (1 - easeOutCubic(it / 2.8)),
  };
}

export function moveState(start: number | null, now: number, still: boolean): MoveState {
  if (start === null) return { t: 0, reach: 0, grow: 0, flip: 0 };
  if (still) return { t: 1, reach: 1, grow: 1, flip: 0 };
  const t = (now - start) / 1000 / INTRO.move;
  return { t, reach: backOut(t, INTRO.reach), grow: easeOutCubic(t * 1.25), flip: Math.PI * 2 * backOut(t, INTRO.flick) };
}
