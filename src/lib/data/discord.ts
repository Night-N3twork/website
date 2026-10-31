import { type Member, type MemberDirectory, parseMembers, UNAVAILABLE, UNCONFIGURED } from './discord-parse';
import { type DiscordConfig, serverEnv } from './env';
import { dataCache, type Life, MINUTES_LIFE, RETRY_LIFE } from './swr';
import { CACHE_TAGS } from './tags';

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const TIMEOUT_MS = 15_000;
const USER_AGENT = 'DiscordBot (https://night-x.com, 1.0)';

export const membersLife = (directory: MemberDirectory): Life => (directory.ok || directory.reason === 'unconfigured' ? MINUTES_LIFE : RETRY_LIFE);

function reason(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown error';
  const cause = error.cause;
  if (!(cause instanceof Error)) return error.message;
  const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : cause.name;
  return `${error.message} (${code})`;
}

function warnUnavailable(error: unknown) {
  console.warn('discord members unavailable:', reason(error));
}

async function fetchPage(config: DiscordConfig, after: string | null, fetcher: typeof fetch, signal: AbortSignal): Promise<unknown> {
  const url = new URL(`${config.apiBase}/guilds/${config.guildId}/members`);
  url.searchParams.set('limit', String(PAGE_SIZE));
  if (after) url.searchParams.set('after', after);
  const response = await fetcher(url, { headers: { authorization: `Bot ${config.token}`, 'user-agent': USER_AGENT, accept: 'application/json' }, signal });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.json();
}

async function walk(config: DiscordConfig, fetcher: typeof fetch, signal: AbortSignal, after: string | null = null, pages = 1, seen: readonly Member[] = []): Promise<readonly Member[]> {
  const batch = parseMembers(await fetchPage(config, after, fetcher, signal), config.cdnBase, config.guildId);
  const members = [...seen, ...batch];
  const last = batch.at(-1);
  if (batch.length < PAGE_SIZE || !last) return members;
  if (pages >= MAX_PAGES) {
    console.warn(`discord members truncated after ${MAX_PAGES} pages`);
    return members;
  }
  return walk(config, fetcher, signal, last.id, pages + 1, members);
}

export async function loadMembers(config: DiscordConfig | null, fetcher: typeof fetch = fetch): Promise<MemberDirectory> {
  if (!config) return UNCONFIGURED;
  try {
    return { ok: true, members: await walk(config, fetcher, AbortSignal.timeout(TIMEOUT_MS)) };
  } catch (error) {
    warnUnavailable(error);
    return UNAVAILABLE;
  }
}

function discordConfig(): DiscordConfig | null {
  try {
    return serverEnv().discord;
  } catch (error) {
    warnUnavailable(error);
    return null;
  }
}

export function getMembers(): Promise<MemberDirectory> {
  return dataCache.get(CACHE_TAGS.discord, () => loadMembers(discordConfig()), membersLife);
}
