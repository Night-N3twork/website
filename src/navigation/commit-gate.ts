export interface CommitGate {
  next(): Promise<void>;
  signal(): void;
}

interface Wait {
  promise: Promise<void>;
  release: () => void;
  timer: ReturnType<typeof setTimeout>;
}

export function createCommitGate(timeoutMs: number): CommitGate {
  let wait: Wait | null = null;

  function release(): void {
    if (!wait) return;
    clearTimeout(wait.timer);
    const done = wait.release;
    wait = null;
    done();
  }

  return {
    next() {
      if (wait) {
        clearTimeout(wait.timer);
        wait.timer = setTimeout(release, timeoutMs);
        return wait.promise;
      }
      let resolve = (): void => {};
      const promise = new Promise<void>((done) => {
        resolve = done;
      });
      wait = { promise, release: resolve, timer: setTimeout(release, timeoutMs) };
      return promise;
    },
    signal: release,
  };
}
