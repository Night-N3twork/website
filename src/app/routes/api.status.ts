import { STATUS_CACHE_CONTROL, toStatusPayload } from '@/lib/data/status-poll';
import { getUptime } from '@/lib/data/uptime';

export async function loader(): Promise<Response> {
  const snapshot = await getUptime();
  return Response.json(toStatusPayload(snapshot, new Date().toISOString()), { headers: { 'Cache-Control': STATUS_CACHE_CONTROL } });
}
