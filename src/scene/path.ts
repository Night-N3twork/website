import { CatmullRomCurve3, Vector3 } from 'three';
import { DWELL, FRAMES, type FrameName, NARROW } from './frames';

export interface Viewport {
  halfW: number;
  halfH: number;
  narrow: boolean;
}

export interface Path {
  anchors: Vector3[];
  curve: CatmullRomCurve3 | null;
}

export interface Target {
  point: Vector3;
  s: number;
  g: number;
  r: [number, number, number];
}

export function buildPath(frames: FrameName[], { halfW, halfH, narrow }: Viewport): Path {
  const anchors = frames.map((name) => {
    const f = FRAMES[name];
    return narrow ? new Vector3(Math.sign(f.x) * NARROW.x * halfW, (f.narrowY ?? NARROW.y) * halfH, f.z) : new Vector3(f.x * halfW, f.y * halfH, f.z);
  });
  return { anchors, curve: anchors.length > 1 ? new CatmullRomCurve3(anchors, false, 'centripetal') : null };
}

export function sectionProgress(spans: [number, number][], mid: number): number {
  if (!spans.length || mid <= spans[0][0]) return 0;
  const k = spans.findIndex(([enter]) => mid < enter);
  if (k === -1) return spans.length - 1;
  const exit = spans[k - 1][1];
  if (mid <= exit) return k - 1;
  return k - 1 + (mid - exit) / Math.max(spans[k][0] - exit, 1);
}

export function spansOf(sections: HTMLElement[], viewportHeight: number): [number, number][] {
  return sections.map((el) => {
    const r = el.getBoundingClientRect();
    const half = Math.min(r.height, viewportHeight) / 2;
    return [r.top + half, r.bottom - half];
  });
}

export function dwell(s: number): number {
  const f = s - Math.floor(s);
  return Math.floor(s) + f + (f * f * (3 - 2 * f) - f) * DWELL;
}

export function targetAt(frames: FrameName[], { anchors, curve }: Path, s: number, point = new Vector3()): Target {
  if (!frames.length) return { point: point.set(0, 0, 0), s: 1, g: 1, r: [0, 0, 0] };
  const last = frames.length - 1;
  const i = Math.min(Math.floor(s), last);
  const [a, b] = [FRAMES[frames[i]], FRAMES[frames[Math.min(i + 1, last)]]];
  const t = s - i;
  const mix = (p: number, q: number): number => p + (q - p) * t;
  if (curve) curve.getPoint(s / last, point);
  else point.copy(anchors[0]);
  return { point, s: mix(a.s, b.s), g: mix(a.g, b.g), r: [mix(a.r[0], b.r[0]), mix(a.r[1], b.r[1]), mix(a.r[2], b.r[2])] };
}

export interface LiftInput {
  home: boolean;
  scrolled: number;
  lastTop: number;
  halfH: number;
  viewportHeight: number;
}

export const rigProgress = (home: boolean, s: number): number => (home ? s : 0);

export function scrollLift({ home, scrolled, lastTop, halfH, viewportHeight }: LiftInput): number {
  const pixels = home ? Math.max(0, -lastTop) : Math.max(0, scrolled);
  return (pixels * 2 * halfH) / viewportHeight;
}
