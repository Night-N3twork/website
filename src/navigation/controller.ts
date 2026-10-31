export interface Phases {
  leave(signal: AbortSignal): Promise<void>;
  navigate(to: string): void | Promise<void>;
  enter(): void;
}

export interface Controller {
  go(to: string): Promise<void>;
  interrupt(): void;
  busy(): boolean;
}

function report(error: unknown): void {
  if (typeof reportError === 'function') reportError(error);
  else queueMicrotask(() => {
    throw error;
  });
}

export function createController(phases: Phases, current: () => string): Controller {
  let running: Promise<void> | null = null;
  let pending: string | null = null;
  let leaving: AbortController | null = null;
  let navigating = false;

  async function run(to: string): Promise<void> {
    const control = new AbortController();
    leaving = control;
    await phases.leave(control.signal).catch(() => undefined);
    leaving = null;
    if (control.signal.aborted) return phases.enter();
    navigating = true;
    try {
      await phases.navigate(to);
    } finally {
      navigating = false;
      phases.enter();
    }
  }

  async function drain(first: string): Promise<void> {
    let next: string | null = first;
    try {
      while (next !== null) {
        pending = null;
        if (next !== current()) await run(next).catch(report);
        next = pending;
      }
    } finally {
      running = null;
    }
  }

  return {
    go(to) {
      if (running && navigating) {
        void Promise.resolve(phases.navigate(to)).catch(report);
        return running;
      }
      if (running) {
        pending = to;
        return running;
      }
      if (to === current()) return Promise.resolve();
      running = drain(to);
      return running;
    },
    interrupt() {
      pending = null;
      leaving?.abort();
    },
    busy: () => running !== null,
  };
}
