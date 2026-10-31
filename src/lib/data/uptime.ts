import { serverEnv, type UptimeConfig } from './env';
import { dataCache, type Life, MINUTES_LIFE, RETRY_LIFE } from './swr';
import { CACHE_TAGS } from './tags';
import { EMPTY_SNAPSHOT, parseBeats, parseMonitors, toSnapshot, type UptimeSnapshot } from './uptime-parse';

const UPTIME_TIMEOUT_MS = 8_000;

export const uptimeLife = (snapshot: UptimeSnapshot): Life => (snapshot.ok ? MINUTES_LIFE : RETRY_LIFE);

function reason(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown error';
  const cause = error.cause;
  if (!(cause instanceof Error)) return error.message;
  const code = 'code' in cause && typeof cause.code === 'string' ? cause.code : cause.name;
  return `${error.message} (${code})`;
}

function warnUnavailable(error: unknown) {
  console.warn('uptime feed unavailable:', reason(error));
}

async function getJson(url: string, fetcher: typeof fetch): Promise<unknown> {
  const response = await fetcher(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(UPTIME_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`status ${response.status}`);
  return response.json();
}

export async function loadUptime(config: UptimeConfig, fetcher: typeof fetch = fetch): Promise<UptimeSnapshot> {
  const api = `${config.base}/api/status-page`;
  try {
    const [page, beats] = await Promise.all([getJson(`${api}/${config.slug}`, fetcher), getJson(`${api}/heartbeat/${config.slug}`, fetcher)]);
    return toSnapshot(parseMonitors(page), parseBeats(beats));
  } catch (error) {
    warnUnavailable(error);
    return EMPTY_SNAPSHOT;
  }
}

function uptimeConfig(): UptimeConfig | null {
  try {
    return serverEnv().uptime;
  } catch (error) {
    warnUnavailable(error);
    return null;
  }
}

async function freshUptime(): Promise<UptimeSnapshot> {
  const config = uptimeConfig();
  return config ? loadUptime(config) : EMPTY_SNAPSHOT;
}

export function getUptime(): Promise<UptimeSnapshot> {
  return dataCache.get(CACHE_TAGS.uptime, freshUptime, uptimeLife);
}
