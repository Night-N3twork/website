export type NavigationKind = 'POP' | 'PUSH' | 'REPLACE';

export interface ScrollMemory {
  save(key: string, top: number): void;
  restore(key: string, kind: NavigationKind): number | null;
}

const LIMIT = 50;

export function createScrollMemory(limit = LIMIT): ScrollMemory {
  const positions = new Map<string, number>();
  return {
    save(key, top) {
      positions.delete(key);
      positions.set(key, top);
      if (positions.size > limit) positions.delete(positions.keys().next().value as string);
    },
    restore(key, kind) {
      return kind === 'POP' ? (positions.get(key) ?? null) : null;
    },
  };
}
