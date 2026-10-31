import { uptimeFixture } from './data';
import type { UptimeSnapshot } from '@/lib/data/uptime-parse';

export const uptimeState: { snapshot: UptimeSnapshot } = { snapshot: uptimeFixture() };

export const uptimeModuleMock = { getUptime: async () => uptimeState.snapshot };

export function resetUptime() {
  uptimeState.snapshot = uptimeFixture();
}
