import { PROJECTS } from '@/content/projects';
import type { UptimeSnapshot } from './uptime-parse';
import { isIsoTime, isServiceStatus, isShare, type ServiceStatus } from './uptime-shape';

export const STATUS_PATH = '/api/status';
export const POLL_MS = 60_000;
export const MAX_POLL_MS = 300_000;
export const STATUS_TIMEOUT_MS = 10_000;
export const STATUS_CACHE_CONTROL = 'public, max-age=30, s-maxage=30, stale-while-revalidate=60';

const BACKOFF = 2;
const WATCHED = PROJECTS.flatMap((project) => (project.monitorId === null ? [] : [project.monitorId]));

export type StatusMonitor = { status: ServiceStatus; uptime24h: number | null; lastCheck: string | null };
export type StatusMonitors = Readonly<Record<string, StatusMonitor>>;
export type StatusPayload = { ok: boolean; checkedAt: string; monitors: StatusMonitors };

type Fields = Readonly<Record<string, unknown>>;

const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value);

export function toStatusMonitors(snapshot: UptimeSnapshot): StatusMonitors {
  return Object.fromEntries(
    WATCHED.flatMap((id) => {
      const monitor = snapshot.monitors[id];
      return monitor ? [[String(id), { status: monitor.status, uptime24h: monitor.uptime24h, lastCheck: monitor.lastCheck }]] : [];
    }),
  );
}

export function toStatusPayload(snapshot: UptimeSnapshot, checkedAt: string): StatusPayload {
  return { ok: snapshot.ok, checkedAt, monitors: toStatusMonitors(snapshot) };
}

function toMonitor(value: unknown): StatusMonitor | null {
  if (!isFields(value) || !isServiceStatus(value.status)) return null;
  const { uptime24h, lastCheck } = value;
  if (!(uptime24h === null || isShare(uptime24h)) || !(lastCheck === null || isIsoTime(lastCheck))) return null;
  return { status: value.status, uptime24h, lastCheck };
}

export function parseStatusPayload(payload: unknown): StatusPayload | null {
  if (!isFields(payload) || typeof payload.ok !== 'boolean' || !isIsoTime(payload.checkedAt) || !isFields(payload.monitors)) return null;
  const entries = Object.entries(payload.monitors);
  const monitors = entries.flatMap(([id, value]) => {
    const monitor = toMonitor(value);
    return monitor ? [[id, monitor] as const] : [];
  });
  return monitors.length === entries.length ? { ok: payload.ok, checkedAt: payload.checkedAt, monitors: Object.fromEntries(monitors) } : null;
}

export function nextDelay(current: number, succeeded: boolean): number {
  return succeeded ? POLL_MS : Math.min(MAX_POLL_MS, current * BACKOFF);
}

export function remaining(delay: number, since: number, now: number): number {
  return Math.max(0, delay - (now - since));
}

export function shouldPoll(intersecting: boolean, visibility: DocumentVisibilityState): boolean {
  return intersecting && visibility === 'visible';
}
