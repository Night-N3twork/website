export type QualityLevel = 0 | 1 | 2;

export interface Quality {
  maxRatio: number;
  pixels: number;
  smaa: boolean;
  bloom: number;
  dispersion: boolean;
  iridescence: boolean;
  clearcoat: boolean;
  transmission: number;
  fps: number;
}

export const QUALITY: Record<QualityLevel, Quality> = {
  0: { maxRatio: 1, pixels: 1_400_000, smaa: true, bloom: 0, dispersion: false, iridescence: false, clearcoat: false, transmission: 0.5, fps: 30 },
  1: { maxRatio: 1.5, pixels: 3_600_000, smaa: true, bloom: 0.5, dispersion: false, iridescence: true, clearcoat: true, transmission: 0.5, fps: 0 },
  2: { maxRatio: 1.75, pixels: 8_000_000, smaa: true, bloom: 1, dispersion: true, iridescence: true, clearcoat: true, transmission: 1, fps: 0 },
};

export const LEVEL_NAMES = ['low', 'mid', 'high'] as const;

export interface DeviceHints {
  gpu: string | null;
  cores: number | null;
  memory: number | null;
  saveData: boolean;
  mobile: boolean;
}

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const MODEST_GPU = /intel(?!.*\barc\b)|mali|adreno|powervr|mesa|geforce (mx|gt )|radeon\(tm\) (r[4-7]|vega [3-8]\b)/i;
const MIN_RATIO = 0.4;

const clampLevel = (level: number): QualityLevel => Math.max(0, Math.min(2, level)) as QualityLevel;

export function initialLevel({ gpu, cores, memory, saveData, mobile }: DeviceHints): QualityLevel {
  if (saveData || (gpu && SOFTWARE_GPU.test(gpu))) return 0;
  if ((cores !== null && cores <= 2) || (memory !== null && memory <= 2)) return 0;
  const modest = (gpu !== null && MODEST_GPU.test(gpu)) || mobile || (cores !== null && cores <= 4) || (memory !== null && memory <= 4);
  return modest ? 1 : 2;
}

export function parseOverride(value: string | null): QualityLevel | null {
  const index = LEVEL_NAMES.indexOf(value as (typeof LEVEL_NAMES)[number]);
  return index === -1 ? null : clampLevel(index);
}

export function renderRatio(quality: Quality, deviceRatio: number, width: number, height: number): number {
  const budget = Math.sqrt(quality.pixels / Math.max(width * height, 1));
  return Math.max(MIN_RATIO, Math.min(deviceRatio, quality.maxRatio, budget));
}

const GOVERNOR = { warmup: 3000, cooldown: 4000, window: 60, missFactor: 1.6, missRatio: 0.3, badWindows: 2, pause: 250, refreshCeiling: 1000 / 60 };

export interface Governor {
  sample(now: number, interval: number): QualityLevel | null;
  level(): QualityLevel;
}

export function createGovernor(start: QualityLevel): Governor {
  let level = start;
  let refresh: number = GOVERNOR.refreshCeiling;
  let quietUntil = GOVERNOR.warmup;
  let frames = 0;
  let misses = 0;
  let badWindows = 0;

  return {
    sample(now, interval) {
      if (level === 0 || now < quietUntil || interval <= 0 || interval > GOVERNOR.pause) return null;
      refresh = Math.min(refresh, interval);
      frames += 1;
      if (interval > refresh * GOVERNOR.missFactor) misses += 1;
      if (frames < GOVERNOR.window) return null;
      badWindows = misses / frames > GOVERNOR.missRatio ? badWindows + 1 : 0;
      frames = 0;
      misses = 0;
      if (badWindows < GOVERNOR.badWindows) return null;
      badWindows = 0;
      level = clampLevel(level - 1);
      quietUntil = now + GOVERNOR.cooldown;
      return level;
    },
    level: () => level,
  };
}

export function readHints(gl: WebGLRenderingContext | WebGL2RenderingContext): DeviceHints {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : (gl.getParameter(gl.RENDERER) ?? '')) || null;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return {
    gpu,
    cores: nav.hardwareConcurrency || null,
    memory: nav.deviceMemory ?? null,
    saveData: nav.connection?.saveData === true,
    mobile: coarse && Math.min(screen.width, screen.height) < 600,
  };
}

const OVERRIDE_KEY = 'glass-quality';
const SETTLED_KEY = 'glass-quality-settled';

function stored(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

export function forcedLevel(): QualityLevel | null {
  return parseOverride(stored(() => localStorage, OVERRIDE_KEY));
}

export function settledLevel(): QualityLevel | null {
  return parseOverride(stored(() => sessionStorage, SETTLED_KEY));
}

export function rememberLevel(level: QualityLevel): void {
  try {
    sessionStorage.setItem(SETTLED_KEY, LEVEL_NAMES[level]);
  } catch {
    return;
  }
}
