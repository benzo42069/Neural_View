import * as THREE from 'three';

export class CameraController {
  private targetPosition = new THREE.Vector3(0, 0, 30);
  private targetLookAt = new THREE.Vector3(0, 0, 0);
  private currentPosition = new THREE.Vector3(0, 0, 30);
  private currentLookAt = new THREE.Vector3(0, 0, 0);
  private damping = 2.0;
  private isOrbiting = false;
  private orbit = new THREE.Spherical(30, Math.PI / 2, 0);
  private orbitTarget = new THREE.Spherical(30, Math.PI / 2, 0);

  constructor(private camera: THREE.PerspectiveCamera) {}

  setSplineTarget(pos: THREE.Vector3, lookAt: THREE.Vector3) {
    this.targetPosition.copy(pos);
    this.targetLookAt.copy(lookAt);
  }

  startOrbit() {
    this.isOrbiting = true;
  }

  endOrbit() {
    this.isOrbiting = false;
  }

  updateOrbit(deltaTheta: number, deltaPhi: number) {
    this.orbitTarget.theta += deltaTheta;
    this.orbitTarget.phi = THREE.MathUtils.clamp(
      this.orbitTarget.phi + deltaPhi, 0.1, Math.PI - 0.1
    );
  }

  update(dt: number) {
    if (this.isOrbiting) {
      this.orbit.theta = THREE.MathUtils.lerp(this.orbit.theta, this.orbitTarget.theta, 1 - Math.exp(-this.damping * dt));
      this.orbit.phi = THREE.MathUtils.lerp(this.orbit.phi, this.orbitTarget.phi, 1 - Math.exp(-this.damping * dt));
      this.currentPosition.setFromSpherical(this.orbit);
    } else {
      this.currentPosition.lerp(this.targetPosition, 1 - Math.exp(-this.damping * dt));
    }

    this.currentLookAt.lerp(this.targetLookAt, 1 - Math.exp(-this.damping * dt));
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
