import { describe, expect, it, vi } from 'vitest';
import { createController, type Phases } from '@/navigation/controller';

function setup(leave: Phases['leave'] = () => Promise.resolve()) {
  const log: string[] = [];
  let path = '/';
  const phases: Phases = {
    leave: vi.fn((signal: AbortSignal) => {
      log.push('leave');
      return leave(signal);
    }),
    navigate: vi.fn((to: string) => {
      log.push(`navigate ${to}`);
      path = to;
    }),
    enter: vi.fn(() => {
      log.push('enter');
    }),
  };
  return { log, phases, controller: createController(phases, () => path) };
}

const untilAborted = (signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }));

describe('createController', () => {
  it('runs leave, then navigate, then enter', async () => {
    const { log, controller } = setup();
    await controller.go('/projects');
    expect(log).toEqual(['leave', 'navigate /projects', 'enter']);
  });

  it('queues only the newest navigation', async () => {
    const { phases, controller } = setup();
    const first = controller.go('/a');
    void controller.go('/b');
    void controller.go('/c');
    await first;
    expect(vi.mocked(phases.navigate).mock.calls.map(([to]) => to)).toEqual(['/a', '/c']);
  });

  it('popstate during leave leaves the history move to the router and still enters', async () => {
    const { phases, controller } = setup(untilAborted);
    const done = controller.go('/projects');
    expect(controller.busy()).toBe(true);
    controller.interrupt();
    await done;
    expect(phases.navigate).not.toHaveBeenCalled();
    expect(phases.enter).toHaveBeenCalledOnce();
    expect(controller.busy()).toBe(false);
  });

  it('same-route go is a no-op for navigate', async () => {
    const { phases, controller } = setup();
    await controller.go('/');
    expect(phases.navigate).not.toHaveBeenCalled();
    expect(phases.leave).not.toHaveBeenCalled();
  });

  it('a navigate that rejects still enters and reports the error', async () => {
    const reported = vi.fn();
    vi.stubGlobal('reportError', reported);
    const { phases, controller } = setup();
    vi.mocked(phases.navigate).mockImplementationOnce(() => Promise.reject(new Error('chunk')));
    await expect(controller.go('/projects')).resolves.toBeUndefined();
    expect(phases.enter).toHaveBeenCalledOnce();
    expect(reported).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('hands a newer target straight to navigate once the leave is over', async () => {
    const { phases, controller } = setup();
    let release = (): void => {};
    vi.mocked(phases.navigate).mockImplementation((to: string) => {
      if (to === '/a') return new Promise<void>((resolve) => (release = resolve));
      release();
    });
    const done = controller.go('/a');
    await vi.waitFor(() => expect(phases.navigate).toHaveBeenCalledWith('/a'));
    void controller.go('/b');
    expect(phases.navigate).toHaveBeenLastCalledWith('/b');
    await done;
    expect(vi.mocked(phases.navigate).mock.calls.map(([to]) => to)).toEqual(['/a', '/b']);
  });

  it('a leave that rejects still navigates', async () => {
    const { phases, controller } = setup(() => Promise.reject(new Error('killed')));
    await controller.go('/projects');
    expect(phases.navigate).toHaveBeenCalledWith('/projects');
    expect(phases.enter).toHaveBeenCalledOnce();
  });
});
