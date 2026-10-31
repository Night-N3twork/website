import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/data/uptime', () => import('../helpers/live').then((m) => m.uptimeModuleMock));

import { resetUptime, uptimeState } from '../helpers/live';
import { projectMonitor } from '@/lib/data/status';

afterEach(resetUptime);

describe('projectMonitor', () => {
  it('finds the monitor a project points at', async () => {
    expect(await projectMonitor('space')).toBe(uptimeState.snapshot.monitors[1]);
  });

  it('has nothing for an unknown project, a project without a monitor or a monitor the feed dropped', async () => {
    expect(await projectMonitor('nope')).toBeNull();
    expect(await projectMonitor('dusk')).toBeNull();
    uptimeState.snapshot = { ...uptimeState.snapshot, monitors: {} };
    expect(await projectMonitor('space')).toBeNull();
  });
});
