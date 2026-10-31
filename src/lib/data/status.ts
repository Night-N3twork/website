import { getProject } from '@/content/projects';
import { getUptime } from './uptime';
import type { MonitorSnapshot } from './uptime-parse';

export async function projectMonitor(slug: string): Promise<MonitorSnapshot | null> {
  const project = getProject(slug);
  if (!project || project.monitorId === null) return null;
  return (await getUptime()).monitors[project.monitorId] ?? null;
}
