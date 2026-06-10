import * as THREE from "three";

const BUBBLE_COUNT = 150;

type BubbleSeed = {
  radius: number;
  angle: number;
  speed: number;
  phase: number;
  size: number;
  wobble: number;
};

export class Fizz {
  readonly mesh: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly seeds: BubbleSeed[] = [];

  constructor(
    private readonly bottom: number,
    private readonly top: number,
    maxRadius: number,
  ) {
    const geometry = new THREE.SphereGeometry(1, 10, 10);
    // Iridescence gives the bubbles a soap-film shimmer as they catch the
    // environment light while rising.
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffe9b0,
      emissive: 0xd99b2e,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0,
      iridescence: 0.6,
      iridescenceIOR: 1.3,
      envMapIntensity: 1.5,
    });
    this.mesh = new THREE.InstancedMesh(geometry, material, BUBBLE_COUNT);
    // Bubbles render before the beer and glass so they show through both.
    this.mesh.renderOrder = 1;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      this.seeds.push({
        radius: Math.sqrt(Math.random()) * maxRadius,
        angle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.45,
        phase: Math.random(),
        size: 0.008 + Math.random() * 0.018,
        wobble: 2 + Math.random() * 3,
      });
    }
    this.update(0);
  }

  update(time: number) {
    const travel = this.top - this.bottom;
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const seed = this.seeds[i];
      const progress = ((time * seed.speed) / travel + seed.phase) % 1;
      const swayX =
        Math.sin(time * seed.wobble + seed.phase * Math.PI * 2) * 0.025;
      const swayZ = Math.cos(time * seed.wobble + seed.phase * 7) * 0.025;
      this.dummy.position.set(
        Math.cos(seed.angle) * seed.radius + swayX,
        this.bottom + progress * travel,
        Math.sin(seed.angle) * seed.radius + swayZ,
      );
      // Bubbles expand as they rise.
      this.dummy.scale.setScalar(seed.size * (0.5 + progress));
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
  }
}
