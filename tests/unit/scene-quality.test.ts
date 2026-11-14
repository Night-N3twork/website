import { describe, expect, it } from 'vitest';
import { createGovernor, type DeviceHints, initialLevel, parseOverride, QUALITY, renderRatio } from '@/scene/quality';

const DESKTOP: DeviceHints = { gpu: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)', cores: 12, memory: 8, saveData: false, mobile: false };

describe('initialLevel', () => {
  it('starts a strong desktop at high', () => {
    expect(initialLevel(DESKTOP)).toBe(2);
  });

  it('starts software renderers and data saver at low', () => {
    expect(initialLevel({ ...DESKTOP, gpu: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)' })).toBe(0);
    expect(initialLevel({ ...DESKTOP, gpu: 'llvmpipe (LLVM 15.0.7, 256 bits)' })).toBe(0);
    expect(initialLevel({ ...DESKTOP, saveData: true })).toBe(0);
  });

  it('starts integrated and older mobile GPUs at mid', () => {
    expect(initialLevel({ ...DESKTOP, gpu: 'ANGLE (Intel, Intel(R) HD Graphics 5500 Direct3D11 vs_5_0 ps_5_0, D3D11)' })).toBe(1);
    expect(initialLevel({ ...DESKTOP, gpu: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)' })).toBe(1);
    expect(initialLevel({ ...DESKTOP, gpu: 'Mali-G52 MC2', mobile: true })).toBe(1);
    expect(initialLevel({ ...DESKTOP, gpu: 'Adreno (TM) 506', mobile: true })).toBe(1);
  });

  it('caps small machines by cores and memory', () => {
    expect(initialLevel({ ...DESKTOP, cores: 4 })).toBe(1);
    expect(initialLevel({ ...DESKTOP, memory: 4 })).toBe(1);
    expect(initialLevel({ ...DESKTOP, cores: 2 })).toBe(0);
    expect(initialLevel({ ...DESKTOP, memory: 2 })).toBe(0);
  });

  it('keeps Macs on Safari and discrete Intel Arc cards at high', () => {
    expect(initialLevel({ ...DESKTOP, gpu: 'Apple GPU', memory: null, cores: 8 })).toBe(2);
    expect(initialLevel({ ...DESKTOP, gpu: 'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)' })).toBe(2);
  });

  it('starts phones at mid and unknown hints at high', () => {
    expect(initialLevel({ ...DESKTOP, gpu: 'Apple GPU', mobile: true })).toBe(1);
    expect(initialLevel({ gpu: null, cores: null, memory: null, saveData: false, mobile: false })).toBe(2);
  });
});

describe('parseOverride', () => {
  it('reads named levels and ignores anything else', () => {
    expect(parseOverride('low')).toBe(0);
    expect(parseOverride('mid')).toBe(1);
    expect(parseOverride('high')).toBe(2);
    expect(parseOverride('ultra')).toBeNull();
    expect(parseOverride(null)).toBeNull();
  });
});

describe('QUALITY', () => {
  it('only removes cost as the level drops', () => {
    const [low, mid, high] = [QUALITY[0], QUALITY[1], QUALITY[2]];
    expect(high).toMatchObject({ smaa: true, bloom: 1, dispersion: true, iridescence: true, clearcoat: true, transmission: 1, fps: 0 });
    expect(mid.maxRatio).toBeLessThan(high.maxRatio);
    expect(low.maxRatio).toBeLessThan(mid.maxRatio);
    expect(mid.pixels).toBeLessThan(high.pixels);
    expect(low.pixels).toBeLessThan(mid.pixels);
    expect(low).toMatchObject({ bloom: 0, dispersion: false, iridescence: false, fps: 30 });
  });
});

describe('renderRatio', () => {
  it('uses the device ratio up to the level cap', () => {
    expect(renderRatio(QUALITY[2], 2, 1440, 900)).toBe(QUALITY[2].maxRatio);
    expect(renderRatio(QUALITY[2], 1, 1440, 900)).toBe(1);
  });

  it('keeps big screens inside the pixel budget', () => {
    const ratio = renderRatio(QUALITY[0], 1, 3840, 2160);
    expect(3840 * 2160 * ratio * ratio).toBeLessThanOrEqual(QUALITY[0].pixels + 1);
    expect(ratio).toBeGreaterThanOrEqual(0.4);
  });
});

const feed = (governor: ReturnType<typeof createGovernor>, interval: number, count: number, start = 0): number | null => {
  let result: number | null = null;
  for (let i = 0; i < count; i++) {
    const next = governor.sample(start + i * interval, interval);
    if (next !== null) result = next;
  }
  return result;
};

describe('createGovernor', () => {
  it('holds the level while frames keep pace', () => {
    const governor = createGovernor(2);
    expect(feed(governor, 1000 / 60, 600, 5000)).toBeNull();
    expect(governor.level()).toBe(2);
  });

  it('steps down one level when too many frames miss', () => {
    const governor = createGovernor(2);
    feed(governor, 1000 / 60, 30, 5000);
    expect(feed(governor, 40, 120, 6000)).toBe(1);
    expect(governor.level()).toBe(1);
  });

  it('ignores the warm-up and long pauses like hidden tabs', () => {
    const governor = createGovernor(2);
    expect(feed(governor, 40, 50, 0)).toBeNull();
    expect(feed(governor, 400, 50, 5000)).toBeNull();
    expect(governor.level()).toBe(2);
  });

  it('waits after a step before judging again and never goes below low', () => {
    const governor = createGovernor(1);
    feed(governor, 1000 / 60, 30, 5000);
    expect(feed(governor, 40, 120, 6000)).toBe(0);
    expect(feed(governor, 40, 600, 11000)).toBeNull();
    expect(governor.level()).toBe(0);
  });

  it('judges a 120 Hz display against its own refresh', () => {
    const governor = createGovernor(2);
    feed(governor, 1000 / 120, 60, 5000);
    expect(feed(governor, 1000 / 120, 600, 6000)).toBeNull();
    expect(feed(governor, 25, 200, 12000)).toBe(1);
  });
});
