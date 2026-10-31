import { describe, expect, it } from 'vitest';
import { heartbeatPayload, statusPagePayload, uptimeFixture, withMonitorStatus } from '../helpers/data';
import { BEAT_WINDOW, EMPTY_SNAPSHOT, monitorStatus, overallStatus, parseBeats, parseMonitors, serviceMonitors, toIsoTime, toSnapshot, worstStatus } from '@/lib/data/uptime-parse';

describe('parseMonitors', () => {
  it('flattens every group into monitors with their tag names', () => {
    const monitors = parseMonitors(statusPagePayload());
    expect(monitors.map((m) => m.id).sort((a, b) => a - b)).toEqual([1, 2, 5, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect(monitors.find((m) => m.id === 1)).toEqual({ id: 1, name: 'Space', tags: ['Service'] });
    expect(monitors.find((m) => m.id === 16)?.tags).toEqual(['Bot']);
  });

  it('rejects a payload without a monitor list', () => {
    expect(() => parseMonitors({ config: {} })).toThrow();
  });
});

describe('toIsoTime', () => {
  it('reads the status page clock as UTC', () => {
    expect(toIsoTime('2026-09-13 20:40:14.692')).toBe('2026-09-13T20:40:14.692Z');
    expect(toIsoTime('2026-09-13 20:40:14')).toBe('2026-09-13T20:40:14.000Z');
    expect(() => toIsoTime('13/09/2026')).toThrow(/heartbeat time/);
  });
});

describe('parseBeats', () => {
  it('maps status codes, keeps the last sixty beats and reads the 24h uptime', () => {
    const data = parseBeats(heartbeatPayload());
    expect(data.beats[1]).toHaveLength(BEAT_WINDOW);
    expect(data.beats[1][0]).toMatchObject({ status: 'up', ping: expect.any(Number) });
    expect(data.beats[1][0].time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(data.uptime24h[16]).toBeCloseTo(0.9986, 3);
  });

  it('maps every code and treats an unknown code as unknown', () => {
    const data = parseBeats({ heartbeatList: { '7': [{ status: 0, time: '2026-01-01 00:00:00' }, { status: 2, time: '2026-01-01 00:01:00' }, { status: 3, time: '2026-01-01 00:02:00' }, { status: 9, time: '2026-01-01 00:03:00', ping: null }] } });
    expect(data.beats[7].map((b) => b.status)).toEqual(['down', 'pending', 'maintenance', 'unknown']);
    expect(data.beats[7][3].ping).toBeNull();
    expect(data.uptime24h).toEqual({});
  });

  it('drops a beat whose clock it cannot read and ignores uptime windows other than 24h', () => {
    const data = parseBeats({ heartbeatList: { '7': [{ status: 1, time: 'yesterday' }, { status: 1, time: '2026-01-01 00:01:00', ping: 61.8 }], '8': [] }, uptimeList: { '7_24': 0.5, '7_720': 0.9 } });
    expect(data.beats[7]).toEqual([{ status: 'up', ping: 61.8, time: '2026-01-01T00:01:00.000Z' }]);
    expect(data.beats[8]).toEqual([]);
    expect(data.uptime24h).toEqual({ 7: 0.5 });
  });

  it('drops a beat whose clock has the right shape but names no real moment, and uptime outside zero to one', () => {
    const times = ['2026-13-45 99:99:99', '0000-00-00 00:00:00', '2026-02-31 10:00:00', '2026-02-28 10:00:00'];
    const data = parseBeats({ heartbeatList: { '7': times.map((time) => ({ status: 1, time })) }, uptimeList: { '7_24': 1.5, '8_24': -0.2, '9_24': 0 } });
    expect(data.beats[7].map((beat) => beat.time)).toEqual(['2026-02-28T10:00:00.000Z']);
    expect(data.uptime24h).toEqual({ 9: 0 });
  });
});

describe('toSnapshot and the status math', () => {
  it('reports each monitor from its last beat with uptime and last check', () => {
    const snapshot = uptimeFixture();
    expect(snapshot.ok).toBe(true);
    expect(snapshot.monitors[1]).toMatchObject({ name: 'Space', status: 'up', uptime24h: 1 });
    expect(snapshot.monitors[1].lastCheck).toBe(snapshot.monitors[1].beats[BEAT_WINDOW - 1].time);
    expect(monitorStatus(snapshot, 1)).toBe('up');
    expect(monitorStatus(snapshot, 999)).toBe('unknown');
  });

  it('marks a listed monitor with no beats as unknown', () => {
    const snapshot = toSnapshot([{ id: 3, name: 'Quiet', tags: [] }], { beats: {}, uptime24h: {} });
    expect(snapshot.monitors[3]).toMatchObject({ status: 'unknown', beats: [], uptime24h: null, lastCheck: null });
  });

  it('ranks down above maintenance above pending above unknown above up', () => {
    expect(worstStatus(['up', 'up'])).toBe('up');
    expect(worstStatus(['up', 'unknown'])).toBe('unknown');
    expect(worstStatus(['pending', 'unknown'])).toBe('pending');
    expect(worstStatus(['maintenance', 'pending'])).toBe('maintenance');
    expect(worstStatus(['maintenance', 'down', 'up'])).toBe('down');
    expect(worstStatus([])).toBe('unknown');
  });

  it('derives the overall status from Service monitors only', () => {
    const snapshot = uptimeFixture();
    expect(serviceMonitors(snapshot).map((m) => m.id).sort((a, b) => a - b)).toEqual([1, 2, 5, 8, 9]);
    expect(overallStatus(snapshot)).toBe('up');
    expect(overallStatus(withMonitorStatus(snapshot, 16, 'down'))).toBe('up');
    expect(overallStatus(withMonitorStatus(snapshot, 2, 'down'))).toBe('down');
    expect(overallStatus(EMPTY_SNAPSHOT)).toBe('unknown');
  });
});
