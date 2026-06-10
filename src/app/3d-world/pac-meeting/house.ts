import * as THREE from "three";
import { buildDecor, makeWallpaperTexture } from "./decor";

export type Collider = { minX: number; maxX: number; minZ: number; maxZ: number };

const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

// One material per role, shared across meshes to keep draw calls low.
export function buildHouse(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const wallpaper = makeWallpaperTexture();
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallpaper });
  disposables.push(wallpaper);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4e69 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xef8354 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x6f5643 });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  disposables.push(wallMaterial, floorMaterial, accentMaterial, woodMaterial, unitBox);

  const floorGeometry = new THREE.PlaneGeometry(22, 16).rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  group.add(floor);
  disposables.push(floorGeometry);

  const addBox = (
    material: THREE.Material,
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    solid = true,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(width, height, depth);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (solid) {
      colliders.push({
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2,
      });
    }
  };
  const addWall = (x: number, z: number, width: number, depth: number) =>
    addBox(wallMaterial, x, z, width, depth, WALL_HEIGHT);

  // Outer shell (22 x 16, centered at origin).
  addWall(0, -8, 22, WALL_THICKNESS); // north
  addWall(0, 8, 22, WALL_THICKNESS); // south
  addWall(-11, 0, WALL_THICKNESS, 16); // west
  addWall(11, 0, WALL_THICKNESS, 16); // east

  // Interior: bedroom in the NE corner, kitchen nook in the west.
  // Vertical wall at x=3 from the north wall, door gap around z=-1.5.
  addWall(3, -5.9, WALL_THICKNESS, 4.2);
  addWall(3, -0.3, WALL_THICKNESS, 2.2);
  // Horizontal wall at z=-1.6 from the east wall, door gap around x=4.5.
  addWall(8.7, -1.6, 4.6, WALL_THICKNESS);

  // Furniture (all simple boxes, all solid).
  addBox(woodMaterial, -6.5, -5, 3.2, 1.6, 0.8); // kitchen counter
  addBox(woodMaterial, -6, 3.5, 2.4, 2.4, 0.55); // living table
  addBox(accentMaterial, -1.5, 6.2, 3.4, 1.1, 0.7); // couch
  addBox(accentMaterial, 8, -6.3, 2.2, 2.8, 0.5); // bed
  addBox(woodMaterial, 10, -3.4, 1, 1, 0.9); // nightstand
  addBox(woodMaterial, 9.5, 6.3, 1.8, 1, 1.6); // bookshelf

  // Emergency meeting button — the pac-meeting centerpiece.
  addBox(wallMaterial, 2, 3.5, 1.2, 1.2, 0.7);
  const buttonGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24);
  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: 0xd22f27,
    emissive: 0x550000,
    roughness: 0.3,
  });
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.set(2, 0.76, 3.5);
  button.castShadow = true;
  group.add(button);
  disposables.push(buttonGeometry, buttonMaterial);

  const decor = buildDecor();
  group.add(decor.group);
  colliders.push(...decor.colliders);
  disposables.push({ dispose: decor.dispose });

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
