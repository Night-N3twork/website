export type FrameName = 'hero' | 'products' | 'catalog' | 'flagship' | 'community' | 'page' | 'list' | 'detail' | 'related' | 'lost' | 'fault';

export interface Frame {
  x: number;
  y: number;
  z: number;
  s: number;
  r: [number, number, number];
  g: number;
  narrowY?: number;
}

export const FRAMES: Record<FrameName, Frame> = {
  hero: { x: 0.42, y: 0.02, z: 0, s: 1.28, r: [0.1, -0.42, 0.06], g: 1 },
  products: { x: -0.56, y: 0.05, z: -0.4, s: 0.86, r: [0.3, 0.9, -0.2], g: 0.7 },
  catalog: { x: -0.64, y: -0.1, z: -0.6, s: 0.7, r: [0.4, 3.3, -0.3], g: 0.55 },
  flagship: { x: 0.5, y: 0.06, z: 0.2, s: 1.04, r: [0.16, 3.95, 0.12], g: 0.8 },
  community: { x: 0, y: 0.34, z: 0, s: 1, r: [0.06, 2 * Math.PI - 0.4, 0.04], g: 1.35 },
  page: { x: 0.62, y: 0.12, z: -0.2, s: 0.66, r: [0.14, -0.7, 0.08], g: 0.85 },
  list: { x: 0.7, y: -0.1, z: -0.5, s: 0.5, r: [0.3, 0.6, -0.15], g: 0.6 },
  detail: { x: 0.56, y: 0.04, z: 0, s: 0.84, r: [0.1, 1.2, 0.05], g: 0.9 },
  related: { x: 0.66, y: 0.1, z: -0.4, s: 0.56, r: [0.25, 2.2, -0.1], g: 0.6 },
  lost: { x: 0, y: 0.55, z: -4, s: 0.6, r: [0.4, 2.6, 0.5], g: 0.5, narrowY: 0.52 },
  fault: { x: 0, y: 0.55, z: -4, s: 0, r: [0.4, 2.6, 0.5], g: 0, narrowY: 0.52 },
};

export const isFrameName = (name: string | undefined): name is FrameName => name !== undefined && name in FRAMES;

export const OFF_HOME_DEPTH = 0.5;
export const FOV = 32;
export const CAMERA_Z = 9;
export const BACKDROP_Z = -7;
export const BACKDROP_OVERSCAN = 1.24;
export const BACKDROP_TRAVEL = 0.8;
export const BRIGHTNESS = { top: 0.82, bottom: 0.4 };
export const NARROW_ASPECT = 0.85;
export const NARROW = { x: 0.16, y: 0.36, scale: 0.62 };
export const DWELL = 0.55;
export const SPIN = { fromScroll: 3.2, settle: 5, damping: 3, drag: 0.011, click: 8.5, max: 14 };
export const BANK = { roll: 0.24, pitch: 0.12, max: 0.38 };
export const TILT = { x: 0.16, y: 0.26, light: 0.3 };
export const INTRO = { lift: 1.5, shrink: 0.4, turn: -2.6, glint: 1.8, fallback: 6000, autoMove: 3600, move: 1.75, land: 0.36, reach: 2.6, flick: 0.7, sweep: 2.6, roll: 0.11, flash: 0.55 };
export const CENTER = { x: 0, y: 0.05, s: 0.82, r: [0.08, 0, 0.02] as [number, number, number] };
export const BLOOM = { strength: 0.55, flash: 0.7 };
export const ENV = { base: 1.7, hover: 0.45, drift: 0.045, travel: 0.6 };
export const NUDGE = { route: { spin: SPIN.click * 0.5, glint: 0.6 }, hover: { spin: 1.5, glint: 0.3 } };
export const INTERACTIVE = 'a, button, input, label, .switch, .cut, .rail, .tabs, p, h1, h2, h3, li';
