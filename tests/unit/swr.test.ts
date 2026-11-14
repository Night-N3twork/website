import { describe, expect, it, vi } from 'vitest';
import { createCache, type Life, RETRY_LIFE } from '@/lib/data/swr';

const LIFE: Life = { fresh: 60, expire: 600 };
const always = () => LIFE;

function setup() {
  const clock = { now: 0 };
  const cache = createCache(() => clock.now);
  const tick = (seconds: number) => {
    clock.now += seconds * 1000;
  };
  return { cache, tick };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createCache', () => {
  it('serves a fresh value without loading again', async () => {
    const { cache, tick } = setup();
    const load = vi.fn(async () => 1);
    await cache.get('uptime', load, always);
    tick(59);
    expect(await cache.get('uptime', load, always)).toBe(1);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('serves a stale value while one background load replaces it', async () => {
    const { cache, tick } = setup();
    const pending = Promise.withResolvers<number>();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockReturnValueOnce(pending.promise);
    await cache.get('uptime', load, always);
    tick(61);
    expect(await cache.get('uptime', load, always)).toBe(1);
    expect(await cache.get('uptime', load, always)).toBe(1);
    pending.resolve(2);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(2);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('waits for a fresh load once a value has expired', async () => {
    const { cache, tick } = setup();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    await cache.get('uptime', load, always);
    tick(601);
    expect(await cache.get('uptime', load, always)).toBe(2);
  });

  it('shares one load between concurrent cold reads', async () => {
    const { cache } = setup();
    const load = vi.fn(async () => 1);
    const values = await Promise.all(Array.from({ length: 10 }, () => cache.get('uptime', load, always)));
    expect(values).toEqual(Array(10).fill(1));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('takes the lifetime from the loaded value', async () => {
    const { cache, tick } = setup();
    const load = vi.fn<() => Promise<{ ok: boolean }>>().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
    const life = (value: { ok: boolean }): Life => (value.ok ? LIFE : { fresh: 30, expire: 600 });
    await cache.get('uptime', load, life);
    tick(31);
    await cache.get('uptime', load, life);
    await settle();
    expect(await cache.get('uptime', load, life)).toEqual({ ok: true });
  });

  it('rethrows a failed cold load and tries again on the next read', async () => {
    const { cache } = setup();
    const load = vi.fn<() => Promise<number>>().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(1);
    await expect(cache.get('uptime', load, always)).rejects.toThrow('down');
    expect(await cache.get('uptime', load, always)).toBe(1);
  });

  it('keeps the stale value when a background load fails', async () => {
    const { cache, tick } = setup();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(3);
    await cache.get('uptime', load, always);
    tick(61);
    expect(await cache.get('uptime', load, always)).toBe(1);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(1);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(3);
  });

  it('marks a tag stale so the next read refreshes it in the background', async () => {
    const { cache } = setup();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const other = vi.fn(async () => 9);
    await cache.get('uptime', load, always);
    await cache.get('discord', other, always);
    cache.invalidate('uptime');
    expect(await cache.get('uptime', load, always)).toBe(1);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(2);
    expect(await cache.get('discord', other, always)).toBe(9);
    expect(other).toHaveBeenCalledTimes(1);
  });

  it('keeps an invalidation that lands while a load is running', async () => {
    const { cache, tick } = setup();
    const pending = Promise.withResolvers<number>();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(3);
    await cache.get('uptime', load, always);
    tick(61);
    await cache.get('uptime', load, always);
    cache.invalidate('uptime');
    pending.resolve(2);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(2);
    await settle();
    expect(await cache.get('uptime', load, always)).toBe(3);
  });

  it('drops a load that finishes after clear', async () => {
    const { cache } = setup();
    const pending = Promise.withResolvers<number>();
    const load = vi.fn<() => Promise<number>>().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(5);
    const early = cache.get('uptime', load, always);
    cache.clear();
    pending.resolve(1);
    await early;
    expect(await cache.get('uptime', load, always)).toBe(5);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('serves the stale value when a loader throws synchronously', async () => {
    const { cache, tick } = setup();
    const load = vi.fn<() => Promise<number>>().mockResolvedValueOnce(1).mockImplementationOnce(() => {
      throw new Error('sync');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await cache.get('uptime', load, always);
    tick(61);
    expect(await cache.get('uptime', load, always)).toBe(1);
  });

  it('forgets everything on clear', async () => {
    const { cache } = setup();
    const load = vi.fn(async () => 1);
    await cache.get('uptime', load, always);
    cache.clear();
    await cache.get('uptime', load, always);
    expect(load).toHaveBeenCalledTimes(2);
  });

  describe('when a refresh comes back as a failure', () => {
    type Value = { ok: boolean; n: number };
    const lifeOf = (value: Value): Life => (value.ok ? LIFE : RETRY_LIFE);

    it('keeps the last good value and retries after the short window', async () => {
      const { cache, tick } = setup();
      const load = vi.fn<() => Promise<Value>>().mockResolvedValueOnce({ ok: true, n: 1 }).mockResolvedValueOnce({ ok: false, n: 0 }).mockResolvedValueOnce({ ok: true, n: 2 });
      await cache.get('discord', load, lifeOf);
      tick(61);
      expect(await cache.get('discord', load, lifeOf)).toEqual({ ok: true, n: 1 });
      await settle();
      expect(await cache.get('discord', load, lifeOf)).toEqual({ ok: true, n: 1 });
      expect(load).toHaveBeenCalledTimes(2);
      tick(RETRY_LIFE.fresh + 1);
      await cache.get('discord', load, lifeOf);
      await settle();
      expect(load).toHaveBeenCalledTimes(3);
      expect(await cache.get('discord', load, lifeOf)).toEqual({ ok: true, n: 2 });
    });

    it('lets a failure replace a good value that has expired', async () => {
      const { cache, tick } = setup();
      const load = vi.fn<() => Promise<Value>>().mockResolvedValueOnce({ ok: true, n: 1 }).mockResolvedValueOnce({ ok: false, n: 0 });
      await cache.get('discord', load, lifeOf);
      tick(LIFE.expire + 1);
      expect(await cache.get('discord', load, lifeOf)).toEqual({ ok: false, n: 0 });
    });
  });
});
