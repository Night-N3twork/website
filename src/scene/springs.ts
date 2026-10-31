export interface Spring {
  k: number;
  c: number;
}

export interface SpringState {
  x: number;
  v: number;
}

const STEPS_PER_SECOND = 120;

export const spring = (k: number, zeta: number): Spring => ({ k, c: 2 * zeta * Math.sqrt(k) });
export const value = (x: number): SpringState => ({ x, v: 0 });

export const POSITION_SPRING = spring(40, 0.88);
export const SCALE_SPRING = spring(60, 0.82);
export const PRESENCE_SPRING = spring(90, 0.92);

export function stepSpring(state: SpringState, target: number, dt: number, { k, c }: Spring): void {
  const steps = Math.max(1, Math.ceil(dt * STEPS_PER_SECOND));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    state.v += (k * (target - state.x) - c * state.v) * h;
    state.x += state.v * h;
  }
}
