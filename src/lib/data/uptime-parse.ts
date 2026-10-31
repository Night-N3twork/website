import { z } from 'zod';
import { isIsoTime, isShare, type ServiceStatus } from './uptime-shape';

export { STATUS_NAMES, type ServiceStatus } from './uptime-shape';

export const BEAT_WINDOW = 60;
export const SERVICE_TAG = 'Service';

const STATUS_BY_CODE: Readonly<Record<number, ServiceStatus>> = { 0: 'down', 1: 'up', 2: 'pending', 3: 'maintenance' };
const SEVERITY: Readonly<Record<ServiceStatus, number>> = { up: 0, unknown: 1, pending: 2, maintenance: 3, down: 4 };
const KUMA_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?$/;
const UPTIME_24H = /^(\d+)_24$/;
const MS_DIGITS = 3;

const monitorSchema = z.object({ id: z.number().int(), name: z.string(), tags: z.array(z.object({ name: z.string() })).default([]) });
const statusPageSchema = z.object({ publicGroupList: z.array(z.object({ monitorList: z.array(monitorSchema) })) });
const beatSchema = z.object({ status: z.number().int(), time: z.string(), ping: z.number().nullable().optional() });
const heartbeatSchema = z.object({ heartbeatList: z.record(z.string(), z.array(beatSchema)), uptimeList: z.record(z.string(), z.number()).default({}) });

type RawBeat = z.infer<typeof beatSchema>;

export type Monitor = { id: number; name: string; tags: readonly string[] };
export type Beat = { status: ServiceStatus; ping: number | null; time: string };
export type BeatData = { beats: Readonly<Record<number, readonly Beat[]>>; uptime24h: Readonly<Record<number, number>> };
export type MonitorSnapshot = Monitor & { status: ServiceStatus; beats: readonly Beat[]; uptime24h: number | null; lastCheck: string | null };
export type UptimeSnapshot = { readonly ok: boolean; readonly monitors: Readonly<Record<number, MonitorSnapshot>> };

export const EMPTY_SNAPSHOT: UptimeSnapshot = Object.freeze({ ok: false, monitors: Object.freeze({}) });

export function parseMonitors(payload: unknown): Monitor[] {
  return statusPageSchema.parse(payload).publicGroupList.flatMap((group) => group.monitorList.map((m) => ({ id: m.id, name: m.name, tags: m.tags.map((tag) => tag.name) })));
}

export function toIsoTime(kumaTime: string): string {
  const match = KUMA_TIME.exec(kumaTime);
  if (!match) throw new Error(`Unexpected heartbeat time "${kumaTime}"`);
  return `${match[1]}T${match[2]}.${(match[3] ?? '').padEnd(MS_DIGITS, '0')}Z`;
}

function toBeat(raw: RawBeat): Beat | null {
  if (!KUMA_TIME.test(raw.time)) return null;
  const time = toIsoTime(raw.time);
  return isIsoTime(time) ? { status: STATUS_BY_CODE[raw.status] ?? 'unknown', ping: raw.ping ?? null, time } : null;
}

export function parseBeats(payload: unknown): BeatData {
  const parsed = heartbeatSchema.parse(payload);
  const beats = Object.entries(parsed.heartbeatList).map(([id, list]): [number, readonly Beat[]] => [Number(id), list.slice(-BEAT_WINDOW).flatMap((raw) => toBeat(raw) ?? [])]);
  const uptime24h = Object.entries(parsed.uptimeList).flatMap(([key, value]): [number, number][] => {
    const match = UPTIME_24H.exec(key);
    return match && isShare(value) ? [[Number(match[1]), value]] : [];
  });
  return { beats: Object.fromEntries(beats), uptime24h: Object.fromEntries(uptime24h) };
}

export function toSnapshot(monitors: readonly Monitor[], data: BeatData): UptimeSnapshot {
  const entries = monitors.map((monitor): [number, MonitorSnapshot] => {
    const beats = data.beats[monitor.id] ?? [];
    const last = beats.at(-1);
    return [monitor.id, { ...monitor, beats, status: last?.status ?? 'unknown', uptime24h: data.uptime24h[monitor.id] ?? null, lastCheck: last?.time ?? null }];
  });
  return { ok: true, monitors: Object.fromEntries(entries) };
}

export function worstStatus(statuses: readonly ServiceStatus[]): ServiceStatus {
  if (statuses.length === 0) return 'unknown';
  return statuses.reduce((worst, status) => (SEVERITY[status] > SEVERITY[worst] ? status : worst));
}

export function serviceMonitors(snapshot: UptimeSnapshot): MonitorSnapshot[] {
  return Object.values(snapshot.monitors).filter((monitor) => monitor.tags.includes(SERVICE_TAG));
}

export function overallStatus(snapshot: UptimeSnapshot): ServiceStatus {
  if (!snapshot.ok) return 'unknown';
  return worstStatus(serviceMonitors(snapshot).map((monitor) => monitor.status));
}

export function monitorStatus(snapshot: UptimeSnapshot, id: number): ServiceStatus {
  return snapshot.monitors[id]?.status ?? 'unknown';
}
