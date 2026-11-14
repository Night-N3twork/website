import { AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute, Group, MathUtils, Mesh, MeshBasicMaterial, type PerspectiveCamera, PlaneGeometry, Points, ShaderMaterial, SRGBColorSpace, type Texture, TextureLoader, Vector2 } from 'three';
import backdrops from './backdrops.json';

export type Backdrop = 'range' | 'peak';

const AVIF_PROBE = 'AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAB0AAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAlbWRhdBIACgc4AAaQENBpMhAZQmMEwAA0AACQQM6Xt10S';

const PHOTO_ASPECT = 1.5;

let avifProbe: Promise<boolean> | null = null;
let avifDecodes = false;

export function probeAvif(): Promise<boolean> {
  avifProbe ??= (async () => {
    try {
      const bytes = Uint8Array.from(atob(AVIF_PROBE), (c) => c.charCodeAt(0));
      (await createImageBitmap(new Blob([bytes], { type: 'image/avif' }))).close();
      avifDecodes = true;
    } catch {
      avifDecodes = false;
    }
    return avifDecodes;
  })();
  return avifProbe;
}

export function backdropUrl(backdrop: Backdrop, width: number): string {
  const size = width <= 1280 ? '1280' : '2400';
  const format = avifDecodes ? 'avif' : 'webp';
  return backdrops[backdrop][size][format];
}

const STAR_COUNT = 520;
const STAR_LOOK = { device: 2, render: 1.75 };
const STAR_SEED = 11;
const SHOOT = { gap: [8, 20] as [number, number], duration: 0.95, length: 0.2, travel: 0.42, thickness: 0.0035 };
const FADE_RATE = 7;

const STAR_VERTEX = `
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uPixelRatio;
uniform float uAlpha;
varying float vAlpha;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float twinkle = 0.5 + 0.5 * sin(uTime * aSpeed + aPhase);
  vAlpha = (0.35 + 0.65 * twinkle) * uAlpha;
  gl_PointSize = aSize * uPixelRatio * (0.75 + 0.5 * twinkle);
}`;

const STAR_FRAGMENT = `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 2.4) * vAlpha;
  gl_FragColor = vec4(vec3(0.84, 0.89, 1.0) * a, a);
}`;

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starField(): Points<BufferGeometry, ShaderMaterial> {
  const rand = mulberry32(STAR_SEED);
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: rand() - 0.5,
    y: 0.5 - Math.pow(rand(), 1.7),
    size: 1 + rand() * 1.6 + Math.pow(rand(), 8) * 3,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 2.2,
  }));
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(stars.flatMap((s) => [s.x, s.y, 0]), 3));
  geometry.setAttribute('aSize', new Float32BufferAttribute(stars.map((s) => s.size), 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(stars.map((s) => s.phase), 1));
  geometry.setAttribute('aSpeed', new Float32BufferAttribute(stars.map((s) => s.speed), 1));
  const material = new ShaderMaterial({
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uAlpha: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.position.z = 0.02;
  return points;
}

function streakTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 16;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(160,180,255,0)');
    grad.addColorStop(0.82, 'rgba(210,222,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.fillRect(0, 4, 512, 8);
  }
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface Shoot {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  timer: number;
  t: number;
  active: boolean;
  from: Vector2;
  dir: Vector2;
}

function shootingStar(): Shoot {
  const material = new MeshBasicMaterial({ map: streakTexture(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
  const mesh = new Mesh(new PlaneGeometry(1, 1), material);
  mesh.position.z = 0.03;
  mesh.visible = false;
  return { mesh, timer: 6, t: 0, active: false, from: new Vector2(), dir: new Vector2() };
}

const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
const between = ([lo, hi]: [number, number]): number => lo + Math.random() * (hi - lo);

interface View {
  w: number;
  h: number;
}

function launchShoot(shoot: Shoot): void {
  const angle = MathUtils.degToRad(-18 - Math.random() * 16);
  shoot.dir.set(Math.cos(angle), Math.sin(angle));
  shoot.from.set(-0.4 + Math.random() * 0.45, 0.16 + Math.random() * 0.26);
  shoot.mesh.rotation.z = angle;
  shoot.t = 0;
  shoot.active = true;
  shoot.mesh.visible = true;
}

function stepShoot(shoot: Shoot, view: View, dt: number): void {
  if (!shoot.active) {
    shoot.timer -= dt;
    if (shoot.timer > 0) return;
    launchShoot(shoot);
  }
  shoot.t += dt / SHOOT.duration;
  const p = easeOutCubic(Math.min(shoot.t, 1));
  const travel = SHOOT.travel * view.w * p;
  shoot.mesh.scale.set(SHOOT.length * view.w, SHOOT.thickness * view.h, 1);
  shoot.mesh.position.set(shoot.from.x * view.w + shoot.dir.x * travel, shoot.from.y * view.h + shoot.dir.y * travel, 0.03);
  shoot.mesh.material.opacity = Math.sin(Math.PI * Math.min(shoot.t, 1)) * 0.9;
  if (shoot.t < 1) return;
  shoot.active = false;
  shoot.mesh.visible = false;
  shoot.timer = between(SHOOT.gap);
}

export interface SkyOptions {
  camera: PerspectiveCamera;
  renderRatio: () => number;
  fov: number;
  cameraZ: number;
  z: number;
  overscan: number;
  reducedMotion: boolean;
}

export interface SkyFrame {
  brightness: number;
  starAlpha: number;
  parallax: { x: number; y: number };
  zoom: number;
}

export interface Sky {
  group: Group;
  fit(): void;
  setBackdrop(key: Backdrop, ready: () => void): void;
  update(dt: number, t: number, frame: SkyFrame): void;
  dispose(): void;
}

export function createSky({ camera, renderRatio, fov, cameraZ, z, overscan, reducedMotion }: SkyOptions): Sky {
  const group = new Group();
  group.position.z = z;
  const plane = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x000000 }));
  const field = new Group();
  const stars = starField();
  const shoot = shootingStar();
  field.add(stars);
  group.add(plane, field, shoot.mesh);

  const loader = new TextureLoader();
  const textures: Partial<Record<Backdrop, Texture>> = {};
  const view: View = { w: 1, h: 1 };
  let wanted: Backdrop | null = null;
  let fade = 0;
  let onFirst: (() => void) | null = null;
  let disposed = false;

  function fit(): void {
    view.h = 2 * (cameraZ - z) * Math.tan(MathUtils.degToRad(fov / 2));
    view.w = view.h * camera.aspect;
    field.scale.set(view.w * overscan, view.h * overscan, 1);
    stars.material.uniforms.uPixelRatio.value = (renderRatio() * Math.min(devicePixelRatio, STAR_LOOK.device)) / Math.min(devicePixelRatio, STAR_LOOK.render);
    const image = plane.material.map?.image as { width: number; height: number } | undefined;
    if (!image) return;
    const ratio = image.width / image.height;
    const [w, h] = view.w / view.h > ratio ? [view.w, view.w / ratio] : [view.h * ratio, view.h];
    plane.scale.set(w * overscan, h * overscan, 1);
  }

  function setBackdrop(key: Backdrop, ready: () => void): void {
    wanted = key;
    onFirst ??= ready;
    if (textures[key]) return;
    void probeAvif().then(() => {
      if (disposed) return;
      const span = Math.max(innerWidth, innerHeight * PHOTO_ASPECT) * renderRatio() * overscan;
      loader.load(backdropUrl(key, span), (texture) => {
        if (disposed) return texture.dispose();
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 4;
        textures[key] = texture;
      }, undefined, () => {
        onFirst?.();
        onFirst = null;
      });
    });
  }

  function swapIfNeeded(): void {
    const next = wanted ? textures[wanted] : undefined;
    if (!next || plane.material.map === next || (plane.material.map && fade > 0.02)) return;
    plane.material.map = next;
    plane.material.needsUpdate = true;
    fit();
    onFirst?.();
    onFirst = null;
  }

  function update(dt: number, t: number, { brightness, starAlpha, parallax, zoom }: SkyFrame): void {
    swapIfNeeded();
    const current = wanted ? textures[wanted] : undefined;
    const hasCurrent = Boolean(current) && plane.material.map === current;
    fade += ((hasCurrent ? 1 : 0) - fade) * (1 - Math.exp(-dt * FADE_RATE));
    plane.material.color.setScalar(brightness * fade);
    stars.material.uniforms.uTime.value = reducedMotion ? 0 : t;
    stars.material.uniforms.uAlpha.value = starAlpha * fade;
    group.position.set(parallax.x, parallax.y, z);
    group.scale.setScalar(zoom);
    if (!reducedMotion) stepShoot(shoot, view, dt);
  }

  function dispose(): void {
    Object.values(textures).forEach((texture) => texture?.dispose());
    shoot.mesh.material.map?.dispose();
    [plane, stars, shoot.mesh].forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    onFirst = null;
    disposed = true;
  }

  return { group, fit, setBackdrop, update, dispose };
}
