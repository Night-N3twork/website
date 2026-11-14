import { Euler, MathUtils, type Mesh, type PerspectiveCamera, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import type { SceneCore } from './core';
import { damp, type IntroState, introState, type MoveState, moveState, wrapAngle } from './curves';
import { BACKDROP_OVERSCAN, BACKDROP_TRAVEL, BACKDROP_Z, BANK, BLOOM, BRIGHTNESS, CAMERA_Z, CENTER, ENV, FOV, type FrameName, INTRO, NARROW, NARROW_ASPECT, NUDGE, OFF_HOME_DEPTH, SPIN, TILT } from './frames';
import { CORONA, setGlassFinish } from './glass';
import { createInput } from './input';
import { createGovernor, forcedLevel, initialLevel, LEVEL_NAMES, QUALITY, type QualityLevel, readHints, rememberLevel, settledLevel } from './quality';
import { createRenderParts } from './render';
import { createGlassRig } from './rig';
import { buildPath, dwell, type Path, rigProgress, scrollLift, type Target, targetAt, type Viewport } from './path';
import { type Backdrop, createSky } from './sky';
import { POSITION_SPRING, PRESENCE_SPRING, SCALE_SPRING, stepSpring, value } from './springs';

export interface StageOptions {
  canvas: HTMLCanvasElement;
  core: SceneCore;
  backdrop: Backdrop;
  still: boolean;
}

export interface Stage {
  startIntro(): void;
  startMove(): void;
  nudge(kind: 'route' | 'hover'): void;
  rebuild(): void;
  dispose(): void;
}

const FRAME_SLACK = 2;

function createHitTest(canvas: HTMLCanvasElement, camera: PerspectiveCamera, target: Mesh): (x: number, y: number) => boolean {
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  return (x, y) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(target, false).length > 0;
  };
}

function startLevel(gl: WebGLRenderingContext | WebGL2RenderingContext): { level: QualityLevel; adaptive: boolean } {
  const forced = forcedLevel();
  if (forced !== null) return { level: forced, adaptive: false };
  const guess = initialLevel(readHints(gl));
  const settled = settledLevel();
  return { level: settled === null ? guess : (Math.min(guess, settled) as QualityLevel), adaptive: true };
}

export function createStage({ canvas, core, backdrop, still }: StageOptions): Stage {
  const parts = createRenderParts(canvas, 2);
  const start = startLevel(parts.renderer.getContext());
  const governor = start.adaptive ? createGovernor(start.level) : null;
  let quality = QUALITY[start.level];
  const { scene, camera, composer, bloom } = parts;
  const sky = createSky({ camera, renderRatio: parts.ratio, fov: FOV, cameraZ: CAMERA_Z, z: BACKDROP_Z, overscan: BACKDROP_OVERSCAN, reducedMotion: still });
  scene.add(sky.group);
  const glassRig = createGlassRig();
  const { rig, bank, orient, spin, crescent, corona, glass } = glassRig;
  scene.add(rig);
  const hitTest = createHitTest(canvas, camera, crescent);

  function applyLevel(level: QualityLevel): void {
    quality = QUALITY[level];
    parts.setQuality(level);
    setGlassFinish(glass, quality);
    document.documentElement.dataset.quality = LEVEL_NAMES[level];
  }
  applyLevel(start.level);

  const spinState = value(0);
  const pos = { x: value(0), y: value(0), z: value(0) };
  const scaleState = value(0);
  const presence = value(0);
  const lean = { roll: 0, pitch: 0 };
  const fx = { glint: 0, glintTarget: 0, flash: 0, velocity: 0 };
  const clock = { introStart: null as number | null, moveStart: null as number | null, landed: false, lastReach: 0, placed: false, lastScroll: scrollY, last: performance.now(), lastTick: performance.now() };
  let path: Path = { anchors: [], curve: null };
  let lost = false;
  let readyPending = false;
  let frame = 0;
  let lastTarget: FrameName | null = null;

  const input = createInput({
    spin: spinState,
    hitTest,
    onKick: () => {
      spinState.v += SPIN.click;
      scaleState.v += 2.4;
      fx.glintTarget += 1.2;
      fx.flash = 1;
    },
  });

  const viewport = (): Viewport => {
    const halfH = Math.tan(MathUtils.degToRad(FOV / 2)) * CAMERA_Z;
    return { halfH, halfW: halfH * camera.aspect, narrow: camera.aspect < NARROW_ASPECT };
  };

  function rebuild(): void {
    path = buildPath(core.frames(), viewport());
    clock.lastScroll = scrollY;
  }

  function resize(): void {
    parts.resize(canvas.clientWidth, canvas.clientHeight);
    sky.fit();
    rebuild();
  }

  function startMove(): void {
    if (clock.introStart === null || clock.moveStart !== null) return;
    clock.moveStart = performance.now();
    core.emit('intro:move');
    if (still) return;
    fx.glintTarget += INTRO.sweep;
    fx.flash = INTRO.flash;
  }

  function startIntro(): void {
    if (clock.introStart !== null) return;
    clock.introStart = performance.now();
    if (still) return startMove();
    spinState.x = INTRO.turn;
    fx.glintTarget += INTRO.glint;
  }

  function updateMotion(dt: number): void {
    const dy = scrollY - clock.lastScroll;
    clock.lastScroll = scrollY;
    const raw = MathUtils.clamp(dy / innerHeight / Math.max(dt, 1 / 240), -4, 4);
    fx.velocity += ((still ? 0 : raw) - fx.velocity) * damp(6, dt);
    input.update(dt);
    if (input.dragging()) return;
    spinState.v += fx.velocity * SPIN.fromScroll * dt;
    spinState.v -= SPIN.settle * wrapAngle(spinState.x) * dt;
    spinState.v *= Math.exp(-SPIN.damping * dt);
    spinState.x += spinState.v * dt;
  }

  function advanceIntro(now: number, move: MoveState): void {
    if (clock.introStart !== null && clock.moveStart === null && now - clock.introStart > INTRO.autoMove) startMove();
    if (clock.landed || move.t < INTRO.land) return;
    clock.landed = true;
    core.emit('intro:land');
  }

  function springTo(target: Target, narrow: boolean, intro: IntroState, dt: number): void {
    const size = target.s * (narrow ? NARROW.scale : 1);
    if (!clock.placed || still) {
      [pos.x.x, pos.y.x, pos.z.x, scaleState.x] = [target.point.x, target.point.y, target.point.z, size];
      clock.placed = true;
    }
    stepSpring(pos.x, target.point.x, dt, POSITION_SPRING);
    stepSpring(pos.y, target.point.y, dt, POSITION_SPRING);
    stepSpring(pos.z, target.point.z, dt, POSITION_SPRING);
    stepSpring(scaleState, size, dt, SCALE_SPRING);
    stepSpring(presence, intro.started ? 1 : 0, dt, PRESENCE_SPRING);
  }

  const euler = new Euler();
  const targetQuat = new Quaternion();
  const point = new Vector3();

  function exitLift(halfH: number): number {
    const lastSection = core.sections().at(-1);
    if (!lastSection) return 0;
    return scrollLift({ home: core.home(), scrolled: scrollY, lastTop: lastSection.getBoundingClientRect().top, halfH, viewportHeight: innerHeight });
  }

  function placeRig(target: Target, intro: IntroState, move: MoveState, t: number, dt: number): void {
    const { halfW, halfH, narrow } = viewport();
    const idle = still ? 0 : 1;
    const lerp = MathUtils.lerp;
    const reachVelocity = still ? 0 : (move.reach - clock.lastReach) / Math.max(dt, 1e-3);
    clock.lastReach = move.reach;
    const size = lerp(CENTER.s * (narrow ? NARROW.scale : 1), scaleState.x, move.grow);
    rig.position.set(
      lerp(CENTER.x * halfW, pos.x.x, move.reach),
      lerp(CENTER.y * halfH, pos.y.x, move.reach) - INTRO.lift * intro.lift + Math.sin(t * 0.7) * 0.035 * idle + exitLift(halfH),
      lerp(0, pos.z.x, move.reach),
    );
    rig.scale.setScalar(Math.max(1e-4, size * presence.x * (1 - INTRO.shrink * intro.lift) * (1 + 0.035 * input.hover())));
    const facing = clock.moveStart === null ? CENTER.r : target.r;
    orient.quaternion.slerp(targetQuat.setFromEuler(euler.set(...facing)), still ? 1 : damp(3.4, dt));
    const rollTarget = -fx.velocity * BANK.roll - reachVelocity * INTRO.roll;
    lean.roll += (MathUtils.clamp(rollTarget, -BANK.max, BANK.max) - lean.roll) * damp(5, dt);
    lean.pitch += (MathUtils.clamp(fx.velocity * BANK.pitch, -BANK.max, BANK.max) - lean.pitch) * damp(5, dt);
    bank.rotation.set(input.pointer.y * TILT.x + lean.pitch, input.pointer.x * TILT.y, lean.roll);
    spin.rotation.set(Math.sin(t * 0.31) * 0.05 * idle, spinState.x + move.flip, Math.sin(t * 0.23) * 0.04 * idle);
  }

  function placeLight(target: Target, intro: IntroState, s: number, t: number, dt: number): void {
    const idle = still ? 0 : 1;
    fx.glint += (fx.glintTarget - fx.glint) * damp(2.2, dt);
    fx.flash *= Math.exp(-4 * dt);
    scene.environmentRotation.set(0, t * ENV.drift * idle + s * ENV.travel + fx.glint + input.pointer.x * TILT.light, 0);
    glass.envMapIntensity = ENV.base + ENV.hover * input.hover();
    bloom.strength = BLOOM.strength + BLOOM.flash * fx.flash;
    corona.material.opacity = target.g * CORONA.strength * presence.x * intro.glow;
    const frames = core.frames().length;
    const depth = (frames > 1 ? s / (frames - 1) : 0) * (core.home() ? 1 : OFF_HOME_DEPTH);
    sky.update(dt, t, {
      brightness: MathUtils.lerp(BRIGHTNESS.top, BRIGHTNESS.bottom, depth) * intro.bright,
      starAlpha: intro.stars,
      parallax: { x: input.pointer.x * -0.12, y: depth * BACKDROP_TRAVEL + input.pointer.y * 0.08 },
      zoom: intro.zoom,
    });
  }

  function place(dt: number, now: number): void {
    const intro = introState(clock.introStart, now, still);
    const move = moveState(clock.moveStart, now, still);
    advanceIntro(now, move);
    const progress = core.progress(innerHeight / 2);
    const s = still ? Math.round(progress) : dwell(progress);
    const target = targetAt(core.frames(), path, rigProgress(core.home(), s), point);
    springTo(target, viewport().narrow, intro, dt);
    placeRig(target, intro, move, now / 1000, dt);
    placeLight(target, intro, s, now / 1000, dt);
  }

  function markTarget(): void {
    const next = core.frameTarget(innerHeight / 2);
    if (next === lastTarget) return;
    lastTarget = next;
    canvas.dataset.frameTarget = next ?? '';
  }

  function govern(now: number): void {
    const interval = now - clock.lastTick;
    clock.lastTick = now;
    const next = governor?.sample(now, interval) ?? null;
    if (next === null) return;
    applyLevel(next);
    rememberLevel(next);
    resize();
  }

  function tick(now: number): void {
    frame = requestAnimationFrame(tick);
    govern(now);
    markTarget();
    if (lost) return;
    const elapsed = now - clock.last;
    if (quality.fps > 0 && elapsed < 1000 / quality.fps - FRAME_SLACK) return;
    const dt = Math.min(elapsed / 1000, 0.1);
    clock.last = now;
    updateMotion(dt);
    place(dt, now);
    composer.render();
    if (!readyPending) return;
    readyPending = false;
    core.emit('ready');
  }

  const onLost = (e: Event): void => {
    e.preventDefault();
    lost = true;
  };
  const onRestored = (): void => {
    parts.rebuildEnvironment();
    lost = false;
  };
  const fallback = setTimeout(startIntro, INTRO.fallback);
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  addEventListener('resize', resize);
  sky.setBackdrop(backdrop, () => {
    readyPending = true;
  });
  resize();
  frame = requestAnimationFrame(tick);

  return {
    startIntro,
    startMove,
    rebuild,
    nudge(kind) {
      spinState.v += NUDGE[kind].spin;
      fx.glintTarget += NUDGE[kind].glint;
    },
    dispose() {
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      input.dispose();
      sky.dispose();
      glassRig.dispose();
      parts.dispose();
      delete canvas.dataset.frameTarget;
    },
  };
}
