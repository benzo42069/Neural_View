import * as THREE from 'three';

export class ParticlePool {
  private geometry: THREE.BufferGeometry;
  private _positions: Float32Array;
  private _colors: Float32Array;
  private _sizes: Float32Array;
  private count: number;
  private material: THREE.PointsMaterial;
  private scene: THREE.Scene;
  readonly mesh: THREE.Points;

  get positions() { return this._positions; }
  get colors() { return this._colors; }
  get sizes() { return this._sizes; }

  constructor(maxParticles: number, scene: THREE.Scene) {
    this.count = maxParticles;
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    this._positions = new Float32Array(maxParticles * 3);
    this._colors = new Float32Array(maxParticles * 3);
    this._sizes = new Float32Array(maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this._positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this._sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    scene.add(this.mesh);
  }

  setParticle(i: number, x: number, y: number, z: number, r: number, g: number, b: number, size: number) {
    if (i >= this.count) return;
    const i3 = i * 3;
    this._positions[i3] = x;
    this._positions[i3 + 1] = y;
    this._positions[i3 + 2] = z;
    this._colors[i3] = r;
    this._colors[i3 + 1] = g;
    this._colors[i3 + 2] = b;
    this._sizes[i] = size;
  }

  update() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
