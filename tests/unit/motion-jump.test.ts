import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const lenis = vi.hoisted(() => {
  const order: string[] = [];
  return {
    order,
    stop: vi.fn(),
    on: vi.fn(),
    raf: vi.fn(),
    resize: vi.fn().mockImplementation(() => order.push('resize')),
    scrollTo: vi.fn().mockImplementation(() => order.push('scrollTo')),
  };
});

vi.mock('lenis', () => ({
  default: class {
    stop = lenis.stop;
    on = lenis.on;
    raf = lenis.raf;
    resize = lenis.resize;
    scrollTo = lenis.scrollTo;
  },
}));

async function freshCore(motion: boolean) {
  vi.resetModules();
  document.documentElement.classList.toggle('motion', motion);
  const core = await import('@/motion/core');
  core.initMotion();
  if (motion) await vi.waitFor(() => expect(core.getLenis()).not.toBeNull());
  return core;
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  lenis.order.splice(0);
  document.documentElement.classList.remove('motion');
});

describe('jumpTo', () => {
  it('recalculates Lenis dimensions before seeking so a taller new page is not clamped', async () => {
    const core = await freshCore(true);
    core.jumpTo(1800);
    expect(lenis.order).toEqual(['resize', 'scrollTo']);
    expect(lenis.scrollTo).toHaveBeenCalledWith(1800, { immediate: true, force: true });
  });

  it('seeks to the top through the same path', async () => {
    const core = await freshCore(true);
    core.jumpToTop();
    expect(lenis.order).toEqual(['resize', 'scrollTo']);
    expect(lenis.scrollTo).toHaveBeenCalledWith(0, { immediate: true, force: true });
  });

  it('scrolls the window directly when Lenis is not running', async () => {
    const core = await freshCore(false);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    core.jumpTo(300);
    expect(scrollTo).toHaveBeenCalledWith(0, 300);
    expect(lenis.resize).not.toHaveBeenCalled();
    expect(lenis.scrollTo).not.toHaveBeenCalled();
  });
});
