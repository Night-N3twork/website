import { describe, expect, it } from 'vitest';
import { readCdnBase, readServerEnv } from '@/lib/data/env';

const TOKEN = 'MTIzNDU2Nzg5MDEyMzQ1Njc4.abcdef.ghijklmnopqrstuvwxyz';
const GUILD = '1158510129075982467';
const ROLE = '1198297300477432099';

describe('readServerEnv', () => {
  it('defaults to the public status page with Discord and revalidation off', () => {
    expect(readServerEnv({})).toEqual({
      uptime: { base: 'https://uptime.night-x.com', slug: 'all' },
      discord: null,
      cdnBase: 'https://cdn.discordapp.com',
      revalidateSecret: null,
    });
  });

  it('treats blank values as unset and strips trailing slashes', () => {
    const env = readServerEnv({ UPTIME_KUMA_BASE: 'https://status.example.org/', DISCORD_CDN_BASE: 'https://cdn.example.org//', DISCORD_BOT_TOKEN: '', DISCORD_GUILD_ID: '' });
    expect(env.uptime.base).toBe('https://status.example.org');
    expect(env.cdnBase).toBe('https://cdn.example.org');
    expect(env.discord).toBeNull();
  });

  it('only accepts http and https upstreams', () => {
    expect(() => readServerEnv({ UPTIME_KUMA_BASE: 'file:///etc/passwd' })).toThrow(/^Invalid environment: UPTIME_KUMA_BASE: must be an http or https url/);
    expect(() => readServerEnv({ DISCORD_API_BASE: 'javascript:alert(1)' })).toThrow(/DISCORD_API_BASE/);
    expect(() => readServerEnv({ DISCORD_CDN_BASE: 'not a url' })).toThrow(/DISCORD_CDN_BASE/);
  });

  it('builds the Discord config only when token and guild are both present', () => {
    const env = readServerEnv({ DISCORD_BOT_TOKEN: TOKEN, DISCORD_GUILD_ID: GUILD, DISCORD_BOOSTER_ROLE_ID: ROLE });
    expect(env.discord).toEqual({ apiBase: 'https://discord.com/api/v10', cdnBase: 'https://cdn.discordapp.com', token: TOKEN, guildId: GUILD, boosterRoleId: ROLE });
    expect(() => readServerEnv({ DISCORD_BOT_TOKEN: TOKEN })).toThrow(/DISCORD_GUILD_ID/);
    expect(() => readServerEnv({ DISCORD_GUILD_ID: GUILD })).toThrow(/DISCORD_GUILD_ID/);
  });

  it('rejects ids that are not snowflakes and secrets that are too short', () => {
    expect(() => readServerEnv({ DISCORD_BOT_TOKEN: TOKEN, DISCORD_GUILD_ID: 'night-network' })).toThrow(/snowflake/);
    expect(() => readServerEnv({ DISCORD_BOOSTER_ROLE_ID: '42' })).toThrow(/snowflake/);
    expect(() => readServerEnv({ REVALIDATE_SECRET: 'short' })).toThrow(/REVALIDATE_SECRET/);
    expect(readServerEnv({ REVALIDATE_SECRET: 'a-secret-of-sixteen-chars' }).revalidateSecret).toBe('a-secret-of-sixteen-chars');
  });

  it('lets browser tests point every upstream at loopback', () => {
    const env = readServerEnv({ UPTIME_KUMA_BASE: 'http://127.0.0.1:3900', DISCORD_API_BASE: 'http://127.0.0.1:3900/discord', DISCORD_CDN_BASE: 'http://127.0.0.1:3900/cdn', DISCORD_BOT_TOKEN: 'browser-tests', DISCORD_GUILD_ID: GUILD });
    expect(env.discord?.apiBase).toBe('http://127.0.0.1:3900/discord');
    expect(env.cdnBase).toBe('http://127.0.0.1:3900/cdn');
  });
});

describe('readCdnBase', () => {
  it('reads only the avatar host, so an unrelated bad setting does not stop a build', () => {
    expect(readCdnBase({ REVALIDATE_SECRET: 'short', DISCORD_BOT_TOKEN: TOKEN })).toBe('https://cdn.discordapp.com');
    expect(readCdnBase({ DISCORD_CDN_BASE: 'http://127.0.0.1:3900/cdn/' })).toBe('http://127.0.0.1:3900/cdn');
    expect(() => readCdnBase({ DISCORD_CDN_BASE: 'ftp://cdn.example' })).toThrow(/DISCORD_CDN_BASE/);
  });
});
