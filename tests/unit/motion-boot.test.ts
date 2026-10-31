import { describe, expect, it } from 'vitest';
import { claimFirstLoad } from '@/motion/boot';

describe('claimFirstLoad', () => {
  it('returns true exactly once per document', () => {
    expect(claimFirstLoad()).toBe(true);
    expect(claimFirstLoad()).toBe(false);
    expect(claimFirstLoad()).toBe(false);
  });
});
