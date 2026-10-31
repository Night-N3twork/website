export const CACHE_TAGS = { uptime: 'uptime', discord: 'discord' } as const;
export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
