import { HalfFloatType, NeutralToneMapping, PerspectiveCamera, Scene, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BLOOM, CAMERA_Z, FOV, MAX_PIXEL_RATIO } from './frames';
import { buildEnvironment } from './glass';

export interface RenderParts {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  resize(width: number, height: number): void;
  rebuildEnvironment(): void;
  dispose(): void;
}

export function createRenderParts(canvas: HTMLCanvasElement): RenderParts {
  const renderer = new WebGLRenderer({ canvas, powerPreference: 'high-performance' });
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;
  let environment = buildEnvironment(renderer);
  scene.environment = environment.texture;
  const composer = new EffectComposer(renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType }));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), BLOOM.strength, 0.6, 0.86);
  const smaa = new SMAAPass();
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(smaa);
  return {
    renderer, scene, camera, composer, bloom,
    resize(width, height) {
      const ratio = Math.min(devicePixelRatio, MAX_PIXEL_RATIO);
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(ratio);
      composer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    },
    rebuildEnvironment() {
      environment.dispose();
      environment = buildEnvironment(renderer);
      scene.environment = environment.texture;
    },
    dispose() {
      environment.dispose();
      bloom.dispose();
      smaa.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
