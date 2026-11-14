export type Life = { fresh: number; expire: number; failed?: boolean };

export type DataCache = {
  get<T>(key: string, load: () => Promise<T>, life: (value: T) => Life): Promise<T>;
  invalidate(tag: string): void;
  clear(): void;
};

type Entry = { value: unknown; storedAt: number; life: Life; stale: boolean; retryAt: number };

const MS_PER_SECOND = 1000;

export const MINUTES_LIFE: Life = { fresh: 60, expire: 3600 };
export const RETRY_LIFE: Life = { fresh: 30, expire: 600, failed: true };

function reason(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

export function createCache(now: () => number = () => performance.now()): DataCache {
  const entries = new Map<string, Entry>();
  const loading = new Map<string, Promise<unknown>>();
  const marks = new Map<string, number>();
  const epoch = { value: 0 };

  const ageOf = (entry: Entry): number => (now() - entry.storedAt) / MS_PER_SECOND;

  function store<T>(key: string, value: T, life: Life, stale: boolean): T {
    const previous = entries.get(key);
    if (life.failed && previous && !previous.life.failed && ageOf(previous) < previous.life.expire) {
      entries.set(key, { ...previous, stale, retryAt: now() + life.fresh * MS_PER_SECOND });
      return previous.value as T;
    }
    entries.set(key, { value, storedAt: now(), life, stale, retryAt: 0 });
    return value;
  }

  function refresh<T>(key: string, load: () => Promise<T>, life: (value: T) => Life): Promise<T> {
    const running = loading.get(key);
    if (running) return running as Promise<T>;
    const startedEpoch = epoch.value;
    const startedMark = marks.get(key) ?? 0;
    const next = Promise.resolve()
      .then(load)
      .then((value) => (epoch.value === startedEpoch ? store(key, value, life(value), (marks.get(key) ?? 0) !== startedMark) : value))
      .finally(() => {
        if (loading.get(key) === next) loading.delete(key);
      });
    loading.set(key, next);
    return next;
  }

  function revalidate<T>(key: string, load: () => Promise<T>, life: (value: T) => Life): void {
    refresh(key, load, life).catch((error: unknown) => console.warn(`background refresh of ${key} failed:`, reason(error)));
  }

  return {
    async get<T>(key: string, load: () => Promise<T>, life: (value: T) => Life): Promise<T> {
      const entry = entries.get(key);
      if (!entry) return refresh(key, load, life);
      const age = ageOf(entry);
      if (age >= entry.life.expire) return refresh(key, load, life);
      if (entry.stale || (age >= entry.life.fresh && now() >= entry.retryAt)) revalidate(key, load, life);
      return entry.value as T;
    },
    invalidate(tag: string): void {
      const matches = (key: string) => key === tag || key.startsWith(`${tag}:`);
      for (const key of new Set([...entries.keys(), ...loading.keys()])) if (matches(key)) marks.set(key, (marks.get(key) ?? 0) + 1);
      for (const [key, entry] of entries) if (matches(key)) entries.set(key, { ...entry, stale: true });
    },
    clear(): void {
      epoch.value += 1;
      entries.clear();
      loading.clear();
      marks.clear();
    },
  };
}

export const dataCache = createCache();
