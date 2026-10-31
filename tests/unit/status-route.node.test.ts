import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ order: [] as string[] }));
vi.mock('@/lib/data/uptime', async () => {
  const { uptimeFixture } = await import('../helpers/data');
  return {
    getUptime: async () => {
      state.order.push('uptime');
      return uptimeFixture();
    },
  };
});

import { loader } from '@/app/routes/api.status';

const GET = () => loader();
import { parseStatusPayload, STATUS_CACHE_CONTROL } from '@/lib/data/status-poll';

beforeEach(() => {
  state.order.length = 0;
});

describe('GET /api/status', () => {
  it('answers from the cached snapshot with its own cache header', async () => {
    const response = await GET();
    expect(state.order).toEqual(['uptime']);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(STATUS_CACHE_CONTROL);
    expect(STATUS_CACHE_CONTROL).toBe('public, max-age=30, s-maxage=30, stale-while-revalidate=60');
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('sends a payload the client accepts, with no beats, names or upstream details', async () => {
    const body = await (await GET()).text();
    const payload = parseStatusPayload(JSON.parse(body));
    expect(payload?.ok).toBe(true);
    expect(Number.isNaN(Date.parse(payload?.checkedAt ?? ''))).toBe(false);
    for (const leak of ['beats', 'ping', 'name', 'tags', 'uptime.night-x.com', 'token']) expect(body).not.toContain(leak);
    expect(Object.keys(payload?.monitors ?? {}).sort()).toEqual(['1', '16', '2', '5']);
  });
});
