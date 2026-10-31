import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/color/contrast';

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white and symmetric', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('throws on a malformed hex color', () => {
    expect(() => contrastRatio('#12', '#FFFFFF')).toThrow(/hex/i);
  });
});
