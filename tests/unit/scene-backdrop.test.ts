import { afterEach, describe, expect, it, vi } from 'vitest';

const load = () => import('@/scene/sky');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('backdropUrl', () => {
  it('serves webp before the probe and when avif does not decode', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('unsupported')));
    const { backdropUrl, probeAvif } = await load();
    expect(backdropUrl('range', 1200)).toMatch(/^\/backdrops\/range-1280\.[0-9a-f]{8}\.webp$/);
    expect(await probeAvif()).toBe(false);
    expect(backdropUrl('peak', 2880)).toMatch(/^\/backdrops\/peak-2400\.[0-9a-f]{8}\.webp$/);
  });

  it('serves avif once the probe decodes and only uses the small file when it needs no upscaling', async () => {
    const decode = vi.fn().mockResolvedValue({ close: vi.fn() });
    vi.stubGlobal('createImageBitmap', decode);
    const { backdropUrl, probeAvif } = await load();
    expect(await probeAvif()).toBe(true);
    await probeAvif();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(decode.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(backdropUrl('range', 1280)).toMatch(/^\/backdrops\/range-1280\.[0-9a-f]{8}\.avif$/);
    expect(backdropUrl('range', 1281)).toMatch(/^\/backdrops\/range-2400\.[0-9a-f]{8}\.avif$/);
  });
});
