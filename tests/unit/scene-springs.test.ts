import { describe, expect, it } from 'vitest';
import { POSITION_SPRING, stepSpring, value } from '@/scene/springs';

describe('stepSpring', () => {
  it('converges on the target', () => {
    const state = value(0);
    for (let i = 0; i < 100; i++) stepSpring(state, 1, 1 / 60, POSITION_SPRING);
    expect(Math.abs(state.x - 1)).toBeLessThan(1e-3);
  });

  it('stays put when already at rest on the target', () => {
    const state = value(2);
    stepSpring(state, 2, 0.1, POSITION_SPRING);
    expect(state.x).toBe(2);
    expect(state.v).toBe(0);
  });
});
