import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ secret: null as string | null, invalidate: vi.fn() }));

vi.mock('@/lib/data/swr', () => ({ dataCache: { invalidate: state.invalidate } }));
vi.mock('@/lib/data/env', () => ({ serverEnv: () => ({ uptime: { base: 'https://uptime.night-x.com', slug: 'all' }, discord: null, cdnBase: 'https://cdn.discordapp.com', revalidateSecret: state.secret }) }));

import { action as POST } from '@/app/routes/api.revalidate';
import { routeArgs } from '../helpers/route-args';

const SECRET = 'a-secret-of-sixteen-chars';
const post = (tag: string | null, auth?: string) =>
  POST(routeArgs({}, `http://localhost/api/revalidate${tag === null ? '' : `?tag=${tag}`}`, { method: 'POST', headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  state.secret = SECRET;
  state.invalidate.mockClear();
});

describe('revalidate', () => {
  it('is absent while no secret is configured', async () => {
    state.secret = null;
    expect((await post('uptime', `Bearer ${SECRET}`)).status).toBe(404);
    expect(state.invalidate).not.toHaveBeenCalled();
  });

  it('refuses a missing or wrong bearer', async () => {
    expect((await post('uptime')).status).toBe(401);
    expect((await post('uptime', 'Bearer a-secret-of-sixteen-charz')).status).toBe(401);
    expect((await post('uptime', `Bearer ${SECRET}x`)).status).toBe(401);
    expect((await post('uptime', SECRET)).status).toBe(401);
    expect(state.invalidate).not.toHaveBeenCalled();
  });

  it('refuses tags it does not know', async () => {
    expect((await post(null, `Bearer ${SECRET}`)).status).toBe(400);
    expect((await post('users', `Bearer ${SECRET}`)).status).toBe(400);
    expect(state.invalidate).not.toHaveBeenCalled();
  });

  it('marks a known tag stale', async () => {
    const response = await post('discord', `Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ revalidated: 'discord' });
    expect(state.invalidate).toHaveBeenCalledWith('discord');
  });
});
