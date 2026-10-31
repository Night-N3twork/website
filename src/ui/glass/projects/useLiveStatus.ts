import { type RefObject, useEffect, useState } from 'react';
import { nextDelay, parseStatusPayload, POLL_MS, remaining, shouldPoll, STATUS_PATH, STATUS_TIMEOUT_MS, type StatusMonitor } from '@/lib/data/status-poll';

const REQUEST = { headers: { accept: 'application/json' }, cache: 'no-store' } as const;

type Reading = { reached: false } | { reached: true; value: StatusMonitor | null };

const FAILED: Reading = { reached: false };

async function readMonitor(monitorId: number, signal: AbortSignal): Promise<Reading> {
  try {
    const response = await fetch(STATUS_PATH, { ...REQUEST, signal });
    if (!response.ok) return FAILED;
    const payload = parseStatusPayload(await response.json());
    if (!payload) return FAILED;
    return { reached: true, value: payload.ok ? (payload.monitors[String(monitorId)] ?? null) : null };
  } catch {
    return FAILED;
  }
}

interface Poller {
  update: () => void;
  stop: () => void;
}

function startPoller(monitorId: number, isLive: () => boolean, onValue: (value: StatusMonitor | null) => void): Poller {
  let delay = POLL_MS;
  let since = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request: AbortController | null = null;
  let stopped = false;
  const update = (): void => {
    clearTimeout(timer);
    if (!stopped && !request && isLive()) timer = setTimeout(() => void poll(), remaining(delay, since, Date.now()));
  };
  const poll = async (): Promise<void> => {
    const abort = new AbortController();
    request = abort;
    const timeout = setTimeout(() => abort.abort(), STATUS_TIMEOUT_MS);
    const reading = await readMonitor(monitorId, abort.signal);
    clearTimeout(timeout);
    request = null;
    if (stopped) return;
    if (reading.reached) onValue(reading.value);
    delay = nextDelay(delay, reading.reached && reading.value !== null);
    since = Date.now();
    update();
  };
  const stop = (): void => {
    stopped = true;
    clearTimeout(timer);
    request?.abort();
  };
  return { update, stop };
}

export function useLiveStatus(monitorId: number | null, initial: StatusMonitor | null, target: RefObject<HTMLElement | null>): StatusMonitor | null {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const el = target.current;
    if (monitorId === null || !el) return;
    let intersecting = false;
    const poller = startPoller(monitorId, () => shouldPoll(intersecting, document.visibilityState), setValue);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry?.isIntersecting ?? false;
      poller.update();
    });
    observer.observe(el);
    document.addEventListener('visibilitychange', poller.update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', poller.update);
      poller.stop();
    };
  }, [monitorId, target]);
  return value;
}
