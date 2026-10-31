import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { describe, expect, it, vi } from 'vitest';
import { initMotion } from '@/motion/core';

describe('initMotion', () => {
  it('keeps scroll restoration manual through a ScrollTrigger refresh', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined }));
    history.scrollRestoration = 'auto';
    initMotion();
    ScrollTrigger.refresh();
    expect(history.scrollRestoration).toBe('manual');
  });
});
