import { describe, expect, it } from 'vitest';
import { LATTICE_EDGES, LATTICE_HUB, LATTICE_POINTS, NYX_POINTS, NYX_SEED, RIBBON_PATH } from '@/lib/art/body-geometry';

describe('body geometry', () => {
  it('keeps the lattice, the nyx cloud and the ribbon path the SVG art was drawn from', () => {
    expect(LATTICE_POINTS).toHaveLength(7);
    expect(LATTICE_EDGES).toHaveLength(9);
    expect(LATTICE_HUB).toBe(5);
    for (const [a, b] of LATTICE_EDGES) expect(Math.max(a, b)).toBeLessThan(LATTICE_POINTS.length);
    expect([NYX_POINTS, NYX_SEED]).toEqual([90, 3]);
    expect(RIBBON_PATH).toEqual({ start: [0.08, 0.62], c1: [0.3, 0.2], c2: [0.5, 0.9], end: [0.92, 0.38] });
  });
});
