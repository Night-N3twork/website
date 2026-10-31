import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/data/env', () => ({ serverEnv: () => ({ uptime: { base: 'https://uptime.night-x.com', slug: 'all' }, discord: null, cdnBase: 'https://cdn.discordapp.com', revalidateSecret: null }) }));
vi.mock('@/lib/data/discord', async () => {
  const { membersPayload } = await import('../helpers/data');
  const { parseMembers } = await import('@/lib/data/discord-parse');
  const members = parseMembers(membersPayload(), 'https://cdn.discordapp.com', '1158510129075982467');
  return { getMembers: async () => ({ ok: true, members }) };
});

const { loader } = await import('@/app/routes/api.avatar');
const { routeArgs } = await import('../helpers/route-args');

const call = async (id: string) => loader(routeArgs({ id }));

describe('avatar redirect', () => {
  it('rejects ids that are not snowflakes', async () => {
    expect((await call('amplify')).status).toBe(400);
    expect((await call('../../etc')).status).toBe(400);
  });

  it('redirects a known member to its avatar on the cdn, cacheable for five minutes', async () => {
    const response = await call('713488984596021291');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://cdn.discordapp.com/avatars/713488984596021291/b14f2c4038f5dc86aad1337b0919585d.webp?size=80');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
  });

  it('redirects an unknown id to a default avatar', async () => {
    const response = await call('419430400000000000');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://cdn.discordapp.com/embed/avatars/4.png');
  });
});
