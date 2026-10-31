import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCommitGate } from '@/navigation/commit-gate';

afterEach(() => {
  vi.useRealTimers();
});

describe('createCommitGate', () => {
  it('resolves the waiting promise when the route commits', async () => {
    const gate = createCommitGate(1000);
    const seen = vi.fn();
    void gate.next().then(seen);
    await Promise.resolve();
    expect(seen).not.toHaveBeenCalled();
    gate.signal();
    await vi.waitFor(() => expect(seen).toHaveBeenCalledOnce());
  });

  it('gives up after the timeout when no commit comes', async () => {
    vi.useFakeTimers();
    const gate = createCommitGate(1000);
    const seen = vi.fn();
    void gate.next().then(seen);
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toHaveBeenCalledOnce();
  });

  it('does not count a commit that happened before the wait began', async () => {
    vi.useFakeTimers();
    const gate = createCommitGate(1000);
    gate.signal();
    const seen = vi.fn();
    void gate.next().then(seen);
    await vi.advanceTimersByTimeAsync(10);
    expect(seen).not.toHaveBeenCalled();
  });

  it('keeps an earlier wait open when a newer navigation starts waiting', async () => {
    vi.useFakeTimers();
    const gate = createCommitGate(1000);
    const first = vi.fn();
    const second = vi.fn();
    void gate.next().then(first);
    await vi.advanceTimersByTimeAsync(600);
    void gate.next().then(second);
    await vi.advanceTimersByTimeAsync(600);
    expect(first).not.toHaveBeenCalled();
    gate.signal();
    await vi.advanceTimersByTimeAsync(0);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
