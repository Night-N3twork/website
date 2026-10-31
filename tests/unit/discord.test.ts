import { afterEach, describe, expect, it, vi } from 'vitest';
import { membersPayload } from '../helpers/data';
import { getMembers, loadMembers, membersLife } from '@/lib/data/discord';
import { MINUTES_LIFE, RETRY_LIFE } from '@/lib/data/swr';

const TOKEN = 'MTIzNDU2Nzg5MDEyMzQ1Njc4.abcdef.ghijklmnopqrstuvwxyz';
const config = { apiBase: 'https://discord.example.org/api/v10', cdnBase: 'https://cdn.example.org', token: TOKEN, guildId: '1158510129075982467', boosterRoleId: null };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const rawMember = (n: number) => ({ user: { id: String(100000000000000000 + n), username: `m${n}`, discriminator: '0', global_name: null, avatar: null }, roles: [], joined_at: '2025-01-01T00:00:00.000000+00:00', premium_since: null });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('loadMembers', () => {
  it('returns the unconfigured directory without touching the network', async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    expect(await loadMembers(null, fetcher)).toEqual({ ok: false, reason: 'unconfigured', members: [] });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('authenticates as a bot with a user agent and stops after a short page', async () => {
    const fetcher = vi.fn(async () => json(membersPayload()));
    const directory = await loadMembers(config, fetcher as unknown as typeof fetch);
    expect(directory.ok).toBe(true);
    expect(directory.members).toHaveLength(19);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toBe('https://discord.example.org/api/v10/guilds/1158510129075982467/members?limit=1000');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe(`Bot ${TOKEN}`);
    expect(headers.get('user-agent')).toMatch(/^DiscordBot \(https:\/\/night-x\.com, /);
  });

  it('follows the after cursor across full pages', async () => {
    const first = Array.from({ length: 1000 }, (_, i) => rawMember(i));
    const fetcher = vi.fn(async (input: URL) => (input.searchParams.has('after') ? json([rawMember(2000), rawMember(2001)]) : json(first)));
    const directory = await loadMembers(config, fetcher as unknown as typeof fetch);
    expect(directory.members).toHaveLength(1002);
    expect((fetcher.mock.calls[1][0] as URL).searchParams.get('after')).toBe(String(100000000000000000 + 999));
    const signals = fetcher.mock.calls.map((call) => (call as unknown as [URL, RequestInit])[1].signal);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(signals[1]).toBe(signals[0]);
  });

  it('stops after ten full pages and says so', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const page = (offset: number) => json(Array.from({ length: 1000 }, (_, i) => rawMember(offset + i)));
    const fetcher = vi.fn(async (input: URL) => page(Number(input.searchParams.get('after') ?? '0') % 1000000));
    const directory = await loadMembers(config, fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledTimes(10);
    expect(directory.members).toHaveLength(10000);
    expect(String(warn.mock.calls[0])).toContain('truncated after 10 pages');
  });

  it('returns the unavailable directory on a rejected token or a malformed body, never leaking the token', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await loadMembers(config, (async () => json({ message: '401: Unauthorized' }, 401)) as unknown as typeof fetch)).toEqual({ ok: false, reason: 'unavailable', members: [] });
    expect(await loadMembers(config, (async () => json({ nope: true })) as unknown as typeof fetch)).toEqual({ ok: false, reason: 'unavailable', members: [] });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(TOKEN);
  });

  it('names the network failure underneath a rejected request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const refused = Object.assign(new Error('connect failed'), { code: 'ECONNREFUSED' });
    expect(await loadMembers(config, (async () => { throw new TypeError('fetch failed', { cause: refused }); }) as unknown as typeof fetch)).toEqual({ ok: false, reason: 'unavailable', members: [] });
    expect(warn).toHaveBeenCalledWith('discord members unavailable:', 'fetch failed (ECONNREFUSED)');
    await loadMembers(config, (async () => { throw new TypeError('fetch failed', { cause: new RangeError('bad port') }); }) as unknown as typeof fetch);
    expect(warn).toHaveBeenLastCalledWith('discord members unavailable:', 'fetch failed (RangeError)');
    await loadMembers(config, (async () => { throw 'offline'; }) as unknown as typeof fetch);
    expect(warn).toHaveBeenLastCalledWith('discord members unavailable:', 'unknown error');
  });
});

describe('getMembers', () => {
  it('caches the unconfigured directory for minutes', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const directory = await getMembers();
    expect(directory.ok).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
    expect(membersLife(directory)).toBe(MINUTES_LIFE);
  });

  it('treats a half-set bot config as unconfigured and says why', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', TOKEN);
    vi.stubEnv('DISCORD_GUILD_ID', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    expect(await getMembers()).toEqual({ ok: false, reason: 'unconfigured', members: [] });
    expect(fetcher).not.toHaveBeenCalled();
    expect(String(warn.mock.calls[0]?.[1])).toContain('DISCORD_GUILD_ID');
    expect(JSON.stringify(warn.mock.calls)).not.toContain(TOKEN);
  });

  it('retries a failed feed sooner', async () => {
    vi.stubEnv('DISCORD_BOT_TOKEN', TOKEN);
    vi.stubEnv('DISCORD_GUILD_ID', config.guildId);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', async () => json({ message: '401: Unauthorized' }, 401));
    const directory = await getMembers();
    expect(directory).toEqual({ ok: false, reason: 'unavailable', members: [] });
    expect(membersLife(directory)).toBe(RETRY_LIFE);
  });
});
