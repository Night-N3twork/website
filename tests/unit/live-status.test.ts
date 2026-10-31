import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POLL_MS, type StatusMonitor } from '@/lib/data/status-poll';
import { useLiveStatus } from '@/ui/glass/projects/useLiveStatus';

const UP: StatusMonitor = { status: 'up', uptime24h: 1, lastCheck: '2026-10-29T10:00:00.000Z' };
const DOWN: StatusMonitor = { status: 'down', uptime24h: 0.5, lastCheck: '2026-10-29T10:01:00.000Z' };

let intersect: (on: boolean) => void = () => undefined;
let visibility: DocumentVisibilityState = 'visible';

class FakeObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {
    intersect = (on) => this.callback([{ isIntersecting: on } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  observe(): void {}
  disconnect(): void {}
}

const payload = (monitor: StatusMonitor) => ({ ok: true, checkedAt: '2026-10-29T10:01:00.000Z', monitors: { '16': monitor } });
const respond = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

function mountHook() {
  const target = { current: document.createElement('aside') };
  return renderHook(() => useLiveStatus(16, UP, target));
}

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  visibility = 'visible';
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useLiveStatus', () => {
  it('polls on the backoff schedule', async () => {
    const fetch = vi.fn(() => respond(payload(DOWN)));
    vi.stubGlobal('fetch', fetch);
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS - 1);
    expect(fetch).not.toHaveBeenCalled();
    await advance(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(DOWN);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('status panel survives a failing poll', async () => {
    const fetch = vi.fn(() => Promise.reject(new TypeError('offline')));
    vi.stubGlobal('fetch', fetch);
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current).toEqual(UP);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('stops polling when hidden', async () => {
    const fetch = vi.fn(() => respond(payload(DOWN)));
    vi.stubGlobal('fetch', fetch);
    mountHook();
    act(() => intersect(true));
    visibility = 'hidden';
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    await advance(POLL_MS * 3);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('clears the live line when the status service answers ok false', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respond({ ...payload(DOWN), ok: false })));
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    expect(result.current).toBeNull();
  });

  it('clears the live line when the monitor drops out of the payload', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respond({ ok: true, checkedAt: '2026-10-29T10:01:00.000Z', monitors: {} })));
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    expect(result.current).toBeNull();
  });

  it('keeps the last value and backs off on a server error', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { status: 500 })));
    vi.stubGlobal('fetch', fetch);
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    expect(result.current).toEqual(UP);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('backs off after an answer without data', async () => {
    const fetch = vi.fn(() => respond({ ...payload(DOWN), ok: false }));
    vi.stubGlobal('fetch', fetch);
    mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(1);
    await advance(POLL_MS);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the last value when the answer is unreadable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => respond({ nope: true })));
    const { result } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    expect(result.current).toEqual(UP);
  });

  it('stops quietly when unmounted mid request', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal('fetch', vi.fn((_: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined;
      return new Promise<Response>(() => undefined);
    }));
    const { unmount } = mountHook();
    act(() => intersect(true));
    await advance(POLL_MS);
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('does not poll off screen', async () => {
    const fetch = vi.fn(() => respond(payload(DOWN)));
    vi.stubGlobal('fetch', fetch);
    mountHook();
    act(() => intersect(false));
    await advance(POLL_MS * 3);
    expect(fetch).not.toHaveBeenCalled();
  });
});
