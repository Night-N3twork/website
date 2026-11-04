import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/data/env', () => ({ serverEnv: () => ({ uptime: { base: 'https://uptime.night-x.com', slug: 'all' }, discord: null, cdnBase: 'https://cdn.discordapp.com', revalidateSecret: null }) }));
vi.mock('@/lib/data/discord', async () => {
  const { membersPayload } = await import('../helpers/data');
  const { parseMembers } = await import('@/lib/data/discord-parse');
  const members = parseMembers(membersPayload(), 'https://cdn.discordapp.com', '1158510129075982467');
  return { getMembers: async () => ({ ok: true, members }) };
});

const { loader } = await import('@/app/routes/api.avatar');
const { routeArgs } = await import('../helpers/route-args');

const MEMBER_ID = '713488984596021291';
const MEMBER_AVATAR = 'https://cdn.discordapp.com/avatars/713488984596021291/b14f2c4038f5dc86aad1337b0919585d.webp?size=80';
const DEFAULT_AVATAR = 'https://cdn.discordapp.com/embed/avatars/4.png';
const MAX_AVATAR_BYTES = 262_144;

type Upstream = { status?: number; type?: string; bytes?: number; reject?: boolean };

const fetchMock = vi.fn();
const call = async (id: string) => loader(routeArgs({ id }));

function stubUpstream({ status = 200, type = 'image/webp', bytes = 64, reject = false }: Upstream = {}) {
  fetchMock.mockImplementation(async () => {
    if (reject) throw new TypeError('fetch failed');
    return new Response(new Uint8Array(bytes).fill(7), { status, headers: { 'content-type': type } });
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  stubUpstream();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('avatar proxy', () => {
  it('rejects ids that are not snowflakes without calling upstream', async () => {
    expect((await call('amplify')).status).toBe(400);
    expect((await call('../../etc')).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('streams a known member avatar from the only url it ever requests', async () => {
    const response = await call(MEMBER_ID);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300, stale-while-revalidate=86400');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(64).fill(7));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(MEMBER_AVATAR, expect.not.objectContaining({ headers: expect.anything() }));
  });

  it('never follows redirects and gives up on a slow upstream', async () => {
    await call(MEMBER_ID);
    expect(fetchMock).toHaveBeenCalledWith(MEMBER_AVATAR, expect.objectContaining({ redirect: 'error', signal: expect.any(AbortSignal) }));
  });

  it('serves the default avatar for an unknown id', async () => {
    expect((await call('419430400000000000')).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(DEFAULT_AVATAR, expect.anything());
  });

  it('serves a body exactly at the size cap and reports a bare content type', async () => {
    stubUpstream({ type: 'IMAGE/PNG; charset=binary', bytes: MAX_AVATAR_BYTES });
    const response = await call(MEMBER_ID);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect((await response.arrayBuffer()).byteLength).toBe(MAX_AVATAR_BYTES);
  });

  it.each([
    ['a missing image', { status: 404 }],
    ['html', { type: 'text/html' }],
    ['an svg that could run script', { type: 'image/svg+xml' }],
    ['a body with no content type', { type: '' }],
    ['an oversized body', { bytes: MAX_AVATAR_BYTES + 1 }],
    ['a refused connection', { reject: true }],
  ] satisfies [string, Upstream][])('answers 502 for %s', async (_, upstream) => {
    stubUpstream(upstream);
    const response = await call(MEMBER_ID);
    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBeNull();
  });
});
