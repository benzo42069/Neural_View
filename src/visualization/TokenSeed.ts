import * as THREE from 'three';
import { ParticlePool } from './ParticlePool';
import { hueForToken } from '../utils/color';

export class TokenSeed {
  private pool: ParticlePool;
  private particlesPerSeed = 64;
  private baseIndex: number;
  private hue: number;
  private currentBrightness = 0;
  private targetBrightness = 0;

  constructor(
    scene: THREE.Scene,
    pool: ParticlePool,
    tokenIndex: number,
    basePoolIndex: number,
    x: number, y: number, z: number
  ) {
    this.pool = pool;
    this.baseIndex = basePoolIndex;
    this.hue = hueForToken(tokenIndex);

    const color = new THREE.Color().setHSL(this.hue / 360, 0.8, 0.5);
    for (let i = 0; i < this.particlesPerSeed; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      const pz = z + (Math.random() - 0.5) * 1;
      const size = 0.5 + Math.random() * 1.5;
      pool.setParticle(basePoolIndex + i, px, py, pz, color.r, color.g, color.b, size);
    }
  }

  setBrightness(norm: number) {
    this.targetBrightness = norm;
  }

  update(dt: number) {
    this.currentBrightness += (this.targetBrightness - this.currentBrightness) * (1 - Math.exp(-3 * dt));
    const color = new THREE.Color().setHSL(this.hue / 360, 0.8, 0.3 + this.currentBrightness * 0.5);
    for (let i = 0; i < this.particlesPerSeed; i++) {
      const idx = this.baseIndex + i;
      const i3 = idx * 3;
      (this.pool as any)['positions'][i3] += (Math.random() - 0.5) * 0.01;
      (this.pool as any)['positions'][i3 + 1] += (Math.random() - 0.5) * 0.01;
      (this.pool as any)['colors'][i3] = color.r;
      (this.pool as any)['colors'][i3 + 1] = color.g;
      (this.pool as any)['colors'][i3 + 2] = color.b;
      (this.pool as any)['sizes'][idx] = (0.5 + Math.random()) * (0.5 + this.currentBrightness);
    }
  }
}
