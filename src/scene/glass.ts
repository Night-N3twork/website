import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PlaneGeometry, PMREMGenerator, Scene, type WebGLRenderer, type WebGLRenderTarget } from 'three';

const CRESCENT = { inner: 0.8103, cx: 0.3966, cy: 0.2069, depth: 0.56, taper: 0.7, segments: 260, sides: 64 };
const ENV_BLUR = 0.03;
const STRIP_COUNT = 9;

export const CORONA = { x: -0.05, y: -0.04, size: 4.4, strength: 0.7 };

export function createGlassMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.035,
    transmission: 1,
    thickness: 1.25,
    ior: 1.52,
    dispersion: 0.85,
    attenuationColor: new Color('#c4cfff'),
    attenuationDistance: 3.4,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    iridescence: 0.42,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [140, 520],
    envMapIntensity: 1.7,
  });
}

export function buildEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const env = new Scene();
  env.background = new Color(0x03040a);
  const plane = new PlaneGeometry(1, 1);
  const strip = (hex: number, intensity: number, [w, h]: [number, number], [x, y, z]: [number, number, number]): void => {
    const mesh = new Mesh(plane, new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(intensity), side: DoubleSide }));
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  strip(0xe8eeff, 7, [14, 0.6], [0, 5.5, -1]);
  strip(0x7f95e6, 1.4, [12, 12], [0, 0, -9]);
  strip(0xffe7c4, 1.6, [8, 0.4], [0, -5, 3]);
  strip(0xffffff, 2.6, [3.4, 3.4], [3, 3, 7]);
  for (let i = 0; i < STRIP_COUNT; i++) {
    const angle = (i / STRIP_COUNT) * Math.PI * 2;
    const tone = i % 3 === 0 ? 0xffffff : i % 3 === 1 ? 0xc9d6ff : 0xa9b9ff;
    strip(tone, i % 2 ? 3.2 : 6, [i % 2 ? 0.5 : 0.28, 10], [Math.cos(angle) * 7, (i % 3) - 1, Math.sin(angle) * 7]);
  }
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, ENV_BLUR);
  pmrem.dispose();
  plane.dispose();
  env.traverse((node) => {
    if (node instanceof Mesh) node.material.dispose();
  });
  return target;
}

function crescentRing(i: number): number[] {
  const { inner: r, cx, cy, depth, taper, segments, sides } = CRESCENT;
  const d = Math.hypot(cx, cy);
  const phi = Math.atan2(cy, cx);
  const alpha = Math.acos((1 - r * r + d * d) / (2 * d));
  const t = phi + alpha + ((2 * Math.PI - 2 * alpha) * i) / segments;
  const [ux, uy] = [Math.cos(t), Math.sin(t)];
  const cu = cx * ux + cy * uy;
  const s = Math.min(cu + Math.sqrt(Math.max(cu * cu - d * d + r * r, 0)), 1);
  const w = 1 - s;
  const h = 0.5 * depth * Math.pow(w, taper);
  return Array.from({ length: sides }, (_, j) => {
    const a = (j / sides) * Math.PI * 2;
    const radial = s + w * (0.5 - 0.5 * Math.cos(a));
    return [ux * radial, uy * radial, h * Math.sin(a)];
  }).flat();
}

export function crescentGeometry(): BufferGeometry {
  const { segments, sides } = CRESCENT;
  const positions = Array.from({ length: segments + 1 }, (_, i) => crescentRing(i)).flat();
  const index = Array.from({ length: segments * sides }, (_, n) => {
    const b = Math.floor(n / sides) * sides + ((n + 1) % sides);
    return [n, b, n + sides, b, b + sides, n + sides];
  }).flat();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry.center();
}
