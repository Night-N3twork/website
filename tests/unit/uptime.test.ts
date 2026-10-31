import { afterEach, describe, expect, it, vi } from 'vitest';
import { heartbeatPayload, statusPagePayload } from '../helpers/data';
import { MINUTES_LIFE, RETRY_LIFE } from '@/lib/data/swr';
import { getUptime, loadUptime, uptimeLife } from '@/lib/data/uptime';

const config = { base: 'https://status.example.org', slug: 'all' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function fetcherFor(page: Response | Error, beats: Response | Error) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pick = url.endsWith('/heartbeat/all') ? beats : page;
    if (pick instanceof Error) throw pick;
    return pick;
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('loadUptime', () => {
  it('fetches the monitor list and the heartbeats from the status page api', async () => {
    const fetcher = fetcherFor(json(statusPagePayload()), json(heartbeatPayload()));
    const snapshot = await loadUptime(config, fetcher);
    expect(snapshot.ok).toBe(true);
    expect(snapshot.monitors[1].status).toBe('up');
    const urls = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => String(call[0])).sort();
    expect(urls).toEqual(['https://status.example.org/api/status-page/all', 'https://status.example.org/api/status-page/heartbeat/all']);
  });

  it('returns the empty snapshot on a non-200 answer, without throwing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const snapshot = await loadUptime(config, fetcherFor(json({}, 503), json(heartbeatPayload())));
    expect(snapshot).toEqual({ ok: false, monitors: {} });
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0])).not.toContain('example.org');
  });

  it('returns the empty snapshot on a network failure or a malformed body', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const failure = new Error('fetch failed', { cause: Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3900'), { code: 'ECONNREFUSED' }) });
    expect((await loadUptime(config, fetcherFor(failure, json(heartbeatPayload())))).ok).toBe(false);
    expect(String(warn.mock.calls[0])).toContain('fetch failed (ECONNREFUSED)');
    expect(String(warn.mock.calls[0])).not.toContain('127.0.0.1');
    expect((await loadUptime(config, fetcherFor(json(statusPagePayload()), json({ nope: true })))).ok).toBe(false);
  });
});

describe('getUptime', () => {
  it('caches a live snapshot for minutes', async () => {
    const fetcher = vi.fn(fetcherFor(json(statusPagePayload()), json(heartbeatPayload())));
    vi.stubGlobal('fetch', fetcher);
    const snapshot = await getUptime();
    expect(snapshot.ok).toBe(true);
    expect(uptimeLife(snapshot)).toBe(MINUTES_LIFE);
    expect(await getUptime()).toBe(snapshot);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('retries a failed feed sooner', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', fetcherFor(new Error('fetch failed'), new Error('fetch failed')));
    const snapshot = await getUptime();
    expect(snapshot.ok).toBe(false);
    expect(uptimeLife(snapshot)).toBe(RETRY_LIFE);
  });
});
