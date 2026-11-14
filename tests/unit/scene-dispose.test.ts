import { BufferGeometry, Material, PerspectiveCamera } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGlassRig } from '@/scene/rig';
import { createSky } from '@/scene/sky';

afterEach(() => vi.restoreAllMocks());

describe('scene disposal', () => {
  it('frees every sky geometry and material', () => {
    const geometries = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materials = vi.spyOn(Material.prototype, 'dispose');
    const sky = createSky({ camera: new PerspectiveCamera(), renderRatio: () => 1, fov: 32, cameraZ: 9, z: -7, overscan: 1.24, reducedMotion: true });
    sky.dispose();
    expect(geometries).toHaveBeenCalledTimes(3);
    expect(materials).toHaveBeenCalledTimes(3);
  });

  it('frees the crescent and corona', () => {
    const geometries = vi.spyOn(BufferGeometry.prototype, 'dispose');
    const materials = vi.spyOn(Material.prototype, 'dispose');
    createGlassRig().dispose();
    expect(geometries).toHaveBeenCalledTimes(2);
    expect(materials).toHaveBeenCalledTimes(2);
  });
});
