import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/content/projects';
import { MAX_POLL_MS, nextDelay, parseStatusPayload, POLL_MS, remaining, shouldPoll, toStatusMonitors, toStatusPayload } from '@/lib/data/status-poll';
import { uptimeFixture } from '../helpers/data';

const CHECKED = '2026-09-18T10:00:00.000Z';
const WATCHED = PROJECTS.flatMap((project) => (project.monitorId === null ? [] : [String(project.monitorId)]));
const monitor = (fields: Record<string, unknown>) => ({ ok: true, checkedAt: CHECKED, monitors: { 1: { status: 'up', uptime24h: 1, lastCheck: CHECKED, ...fields } } });

describe('toStatusPayload', () => {
  it('keeps status, uptime and last check per monitor and nothing else', () => {
    const payload = toStatusPayload(uptimeFixture(), CHECKED);
    expect(payload.ok).toBe(true);
    expect(payload.checkedAt).toBe(CHECKED);
    for (const entry of Object.values(payload.monitors)) expect(Object.keys(entry).sort()).toEqual(['lastCheck', 'status', 'uptime24h']);
    expect(JSON.stringify(payload)).not.toContain('beats');
  });

  it('sends only the monitors behind a project card', () => {
    const snapshot = uptimeFixture();
    expect(Object.keys(snapshot.monitors).length).toBeGreaterThan(WATCHED.length);
    expect(Object.keys(toStatusMonitors(snapshot)).sort()).toEqual([...WATCHED].sort());
    expect(toStatusMonitors({ ok: false, monitors: {} })).toEqual({});
  });

  it('round-trips through the client parser', () => {
    const payload = toStatusPayload(uptimeFixture(), CHECKED);
    expect(parseStatusPayload(JSON.parse(JSON.stringify(payload)))).toEqual(payload);
  });
});

describe('parseStatusPayload', () => {
  it('rejects anything that is not the payload', () => {
    expect(parseStatusPayload(null)).toBeNull();
    expect(parseStatusPayload([])).toBeNull();
    expect(parseStatusPayload({ ok: true })).toBeNull();
    expect(parseStatusPayload({ ok: 'yes', checkedAt: CHECKED, monitors: {} })).toBeNull();
    expect(parseStatusPayload({ ok: true, checkedAt: 'now', monitors: {} })).toBeNull();
    expect(parseStatusPayload({ ok: true, checkedAt: CHECKED, monitors: [] })).toBeNull();
    expect(parseStatusPayload(monitor({ status: 'fine' }))).toBeNull();
    expect(parseStatusPayload({ ok: true, checkedAt: CHECKED, monitors: { 1: null } })).toBeNull();
  });

  it('rejects a last check that names no real moment, so the card never formats one', () => {
    for (const lastCheck of ['2026-13-45T99:99:99.000Z', '2026-02-31T10:00:00.000Z', '0000-00-00T00:00:00.000Z', 'yesterday', '', 7]) expect(parseStatusPayload(monitor({ lastCheck }))).toBeNull();
    expect(parseStatusPayload(monitor({ lastCheck: null }))?.monitors[1].lastCheck).toBeNull();
  });

  it('rejects uptime outside zero to one and anything that is not a number', () => {
    for (const uptime24h of [-0.1, 1.01, '1', Number.NaN, undefined]) expect(parseStatusPayload(monitor({ uptime24h }))).toBeNull();
    expect(parseStatusPayload(monitor({ uptime24h: 0 }))?.monitors[1].uptime24h).toBe(0);
    expect(parseStatusPayload(monitor({ uptime24h: null }))?.monitors[1].uptime24h).toBeNull();
  });

  it('keeps the three fields it knows and drops the rest', () => {
    const parsed = parseStatusPayload({ ...monitor({ name: 'Space', beats: [] }), extra: true });
    expect(parsed).toEqual({ ok: true, checkedAt: CHECKED, monitors: { 1: { status: 'up', uptime24h: 1, lastCheck: CHECKED } } });
  });
});

describe('nextDelay, remaining and shouldPoll', () => {
  it('doubles on failure up to five minutes and resets on success', () => {
    expect(nextDelay(POLL_MS, false)).toBe(POLL_MS * 2);
    expect(nextDelay(POLL_MS * 4, false)).toBe(MAX_POLL_MS);
    expect(nextDelay(MAX_POLL_MS, false)).toBe(MAX_POLL_MS);
    expect(nextDelay(MAX_POLL_MS, true)).toBe(POLL_MS);
  });

  it('counts the wait from the last answer and never below zero', () => {
    expect(remaining(POLL_MS, 1000, 1000)).toBe(POLL_MS);
    expect(remaining(POLL_MS, 1000, 21_000)).toBe(POLL_MS - 20_000);
    expect(remaining(POLL_MS, 1000, 1000 + POLL_MS * 3)).toBe(0);
  });

  it('polls only while the grid is on screen in a visible tab', () => {
    expect(shouldPoll(true, 'visible')).toBe(true);
    expect(shouldPoll(false, 'visible')).toBe(false);
    expect(shouldPoll(true, 'hidden')).toBe(false);
  });
});
