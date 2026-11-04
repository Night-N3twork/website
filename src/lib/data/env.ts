import { z } from 'zod';

const SNOWFLAKE = /^\d{17,20}$/;
const SLUG = /^[a-z0-9-]+$/i;
const SECRET_MIN_LENGTH = 16;
const UPTIME_BASE = 'https://uptime.night-x.com';
const UPTIME_SLUG = 'all';
const DISCORD_API = 'https://discord.com/api/v10';
const DISCORD_CDN = 'https://cdn.discordapp.com';

const blank = (value: unknown) => (value === '' ? undefined : value);
const snowflake = z.string().regex(SNOWFLAKE, { message: 'must be a Discord snowflake id' });
const httpUrl = z.url({ protocol: /^https?$/, error: 'must be an http or https url' });
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());
const cdnBaseField = z.preprocess(blank, httpUrl.default(DISCORD_CDN));

const schema = z
  .object({
    UPTIME_KUMA_BASE: z.preprocess(blank, httpUrl.default(UPTIME_BASE)),
    UPTIME_KUMA_SLUG: z.preprocess(blank, z.string().regex(SLUG).default(UPTIME_SLUG)),
    DISCORD_API_BASE: z.preprocess(blank, httpUrl.default(DISCORD_API)),
    DISCORD_CDN_BASE: cdnBaseField,
    DISCORD_BOT_TOKEN: optional(z.string().min(1)),
    DISCORD_GUILD_ID: optional(snowflake),
    DISCORD_BOOSTER_ROLE_ID: optional(snowflake),
    REVALIDATE_SECRET: optional(z.string().min(SECRET_MIN_LENGTH, { message: `must be at least ${SECRET_MIN_LENGTH} characters` })),
  })
  .refine((v) => (v.DISCORD_BOT_TOKEN === undefined) === (v.DISCORD_GUILD_ID === undefined), {
    message: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set together',
    path: ['DISCORD_GUILD_ID'],
  });

export type UptimeConfig = { base: string; slug: string };
export type DiscordConfig = { apiBase: string; cdnBase: string; token: string; guildId: string; boosterRoleId: string | null };
export type ServerEnv = { uptime: UptimeConfig; discord: DiscordConfig | null; cdnBase: string; revalidateSecret: string | null };

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export function readServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  const v = parsed.data;
  const cdnBase = trimSlash(v.DISCORD_CDN_BASE);
  const discord =
    v.DISCORD_BOT_TOKEN && v.DISCORD_GUILD_ID
      ? { apiBase: trimSlash(v.DISCORD_API_BASE), cdnBase, token: v.DISCORD_BOT_TOKEN, guildId: v.DISCORD_GUILD_ID, boosterRoleId: v.DISCORD_BOOSTER_ROLE_ID ?? null }
      : null;
  return { uptime: { base: trimSlash(v.UPTIME_KUMA_BASE), slug: v.UPTIME_KUMA_SLUG }, discord, cdnBase, revalidateSecret: v.REVALIDATE_SECRET ?? null };
}

export function serverEnv(): ServerEnv {
  return readServerEnv(process.env);
}
