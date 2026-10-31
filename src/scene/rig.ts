import { AdditiveBlending, CanvasTexture, Group, Mesh, MeshBasicMaterial, type MeshPhysicalMaterial, PlaneGeometry, SRGBColorSpace } from 'three';
import { CORONA, createGlassMaterial, crescentGeometry } from './glass';

export interface GlassRig {
  rig: Group;
  bank: Group;
  orient: Group;
  spin: Group;
  crescent: Mesh;
  corona: Mesh<PlaneGeometry, MeshBasicMaterial>;
  glass: MeshPhysicalMaterial;
  dispose(): void;
}

function coronaTexture(): CanvasTexture {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(214,226,255,0.85)');
    grad.addColorStop(0.24, 'rgba(160,182,255,0.32)');
    grad.addColorStop(0.55, 'rgba(110,132,230,0.07)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createGlassRig(): GlassRig {
  const [rig, bank, orient, spin] = [new Group(), new Group(), new Group(), new Group()];
  rig.add(bank);
  bank.add(orient);
  orient.add(spin);
  const glass = createGlassMaterial();
  const crescent = new Mesh(crescentGeometry(), glass);
  spin.add(crescent);
  const corona = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: coronaTexture(), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
  corona.position.set(CORONA.x, CORONA.y, -0.85);
  corona.scale.setScalar(CORONA.size);
  rig.add(corona);
  return {
    rig, bank, orient, spin, crescent, corona, glass,
    dispose() {
      crescent.geometry.dispose();
      glass.dispose();
      corona.material.map?.dispose();
      corona.geometry.dispose();
      corona.material.dispose();
    },
  };
}
