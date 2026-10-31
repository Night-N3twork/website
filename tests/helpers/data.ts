import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBeats, parseMonitors, toSnapshot, type ServiceStatus, type UptimeSnapshot } from '@/lib/data/uptime-parse';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
const read = (name: string) => JSON.parse(readFileSync(join(FIXTURES, name), 'utf8')) as unknown;

export const statusPagePayload = () => read('uptime/status-page.json');
export const heartbeatPayload = () => read('uptime/heartbeat.json');
export const membersPayload = () => read('discord/members.json');

export function uptimeFixture(): UptimeSnapshot {
  return toSnapshot(parseMonitors(statusPagePayload()), parseBeats(heartbeatPayload()));
}

export function withMonitorStatus(snapshot: UptimeSnapshot, id: number, status: ServiceStatus): UptimeSnapshot {
  const monitor = snapshot.monitors[id];
  const last = monitor?.beats.at(-1);
  if (!monitor || !last) throw new Error(`fixture has no beats for monitor ${id}`);
  const beats = [...monitor.beats.slice(0, -1), { ...last, status }];
  return { ...snapshot, monitors: { ...snapshot.monitors, [id]: { ...monitor, beats, status } } };
}
