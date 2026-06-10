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

  const floorGeometry = new THREE.PlaneGeometry(28, 20).rotateX(-Math.PI / 2);
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

  // Outer shell (28 x 20, centered at origin).
  addWall(0, -10, 28, WALL_THICKNESS); // north
  // South wall, split by the main entrance (gap x 1.5..3.5).
  addWall(-6.25, 10, 15.5, WALL_THICKNESS);
  addWall(8.75, 10, 10.5, WALL_THICKNESS);
  addWall(-14, 0, WALL_THICKNESS, 20); // west
  addWall(14, 0, WALL_THICKNESS, 20); // east

  // Bedroom, NE corner. Vertical wall at x=5 with a door gap z=-5.4..-4.2,
  // horizontal wall at z=-2 with a door gap x=5..8.
  addWall(5, -7.7, WALL_THICKNESS, 4.6);
  addWall(5, -2.1, WALL_THICKNESS, 4.2);
  addWall(11, -2, 6, WALL_THICKNESS);

  // Walk-in closet, SE corner. Entrance gap x=7..9 on its north wall.
  addWall(7, 7, WALL_THICKNESS, 6);
  addWall(11.5, 4, 5, WALL_THICKNESS);

  // Furniture (all simple boxes, all solid).
  addBox(woodMaterial, -8.5, -6.5, 3.2, 1.6, 0.8); // kitchen counter
  addBox(woodMaterial, -7, 4.5, 2.4, 2.4, 0.55); // living table
  addBox(accentMaterial, -2, 8, 3.4, 1.1, 0.7); // couch
  addBox(accentMaterial, 10.5, -8.2, 2.2, 2.8, 0.5); // bed
  addBox(woodMaterial, 13, -4.5, 1, 1, 0.9); // nightstand
  addBox(woodMaterial, 12.5, -8.8, 1.8, 1, 1.6); // bedroom bookshelf

  // Emergency meeting button — the pac-meeting centerpiece.
  addBox(wallMaterial, 2.5, 4.5, 1.2, 1.2, 0.7);
  const buttonGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24);
  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: 0xd22f27,
    emissive: 0x550000,
    roughness: 0.3,
  });
  const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
  button.position.set(2.5, 0.76, 4.5);
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
