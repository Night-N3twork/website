export const STATUS_NAMES = ['up', 'down', 'pending', 'maintenance', 'unknown'] as const;
export type ServiceStatus = (typeof STATUS_NAMES)[number];

const NAMES: ReadonlySet<string> = new Set(STATUS_NAMES);

export const isServiceStatus = (value: unknown): value is ServiceStatus => typeof value === 'string' && NAMES.has(value);

export const isShare = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= 1;

export function isIsoTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
}
