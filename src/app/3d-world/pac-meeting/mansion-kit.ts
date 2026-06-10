import * as THREE from "three";
import type { Collider } from "./house";

export type RoomBuild = {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
};

// Shared scaffolding for the mansion rooms: one unit box, tracked disposal,
// and the box/canvas helpers every room uses.
export class Kit {
  readonly group = new THREE.Group();
  readonly colliders: Collider[] = [];
  private readonly disposables: { dispose: () => void }[] = [];
  private readonly unitBox: THREE.BoxGeometry;

  constructor() {
    this.unitBox = this.track(new THREE.BoxGeometry(1, 1, 1));
  }

  track<T extends { dispose: () => void }>(item: T): T {
    this.disposables.push(item);
    return item;
  }

  material(options: THREE.MeshStandardMaterialParameters) {
    return this.track(new THREE.MeshStandardMaterial(options));
  }

  box(
    material: THREE.Material,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    solid = false,
    parent: THREE.Object3D = this.group,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (solid) this.solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
    return mesh;
  }

  mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number, y: number, z: number,
    parent: THREE.Object3D = this.group,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  canvasPlane(
    draw: (ctx: CanvasRenderingContext2D) => void,
    canvasW: number, canvasH: number,
    planeW: number, planeH: number,
    x: number, y: number, z: number,
    rotationY: number,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    draw(canvas.getContext("2d")!);
    const texture = this.track(new THREE.CanvasTexture(canvas));
    const material = this.track(
      new THREE.MeshStandardMaterial({ map: texture }),
    );
    const geometry = this.track(new THREE.PlaneGeometry(planeW, planeH));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    this.group.add(mesh);
    return mesh;
  }

  solid(minX: number, maxX: number, minZ: number, maxZ: number) {
    this.colliders.push({ minX, maxX, minZ, maxZ });
  }

  build(): RoomBuild {
    return {
      group: this.group,
      colliders: this.colliders,
      dispose: () => this.disposables.forEach((d) => d.dispose()),
    };
  }
}
