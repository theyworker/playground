import * as THREE from "three";
import type { Collider } from "./house";
import { drawKoreaFlag, drawSign, drawSriLankaFlag } from "./restaurant-art";

// Dehan's Korean BBQ: a 12x10 building west of the road end (x -13..-1,
// z 21..31). Entrance on the east wall, gap z 25..26.5, facing the road.
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

// Tables; the boolean marks which ones get a tissue packet.
const TABLES: [number, number, boolean][] = [
  [-10.5, 24, true],
  [-7, 23.5, false],
  [-4, 24.5, true],
  [-10.5, 28.5, false],
  [-7, 28, true],
  [-3.5, 29, false],
];

export function buildRestaurant(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4632 });
  const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2a1d });
  const steelMaterial = new THREE.MeshStandardMaterial({
    color: 0x8e9499,
    metalness: 0.7,
    roughness: 0.35,
  });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf2f2ee });
  const ventMaterial = new THREE.MeshStandardMaterial({ color: 0x44484c });
  disposables.push(
    unitBox, wallMaterial, darkWoodMaterial, steelMaterial,
    whiteMaterial, ventMaterial,
  );

  const box = (
    material: THREE.Material,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    solid = false,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (solid) {
      colliders.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
      });
    }
    return mesh;
  };

  // Floor and stone path to the road.
  const floorGeometry = new THREE.PlaneGeometry(12, 10).rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5c3e });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(-7, 0.008, 26);
  floor.receiveShadow = true;
  group.add(floor);
  const pathGeometry = new THREE.PlaneGeometry(2, 1.6).rotateX(-Math.PI / 2);
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8478 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(-0.1, 0.002, 25.75);
  path.receiveShadow = true;
  group.add(path);
  disposables.push(floorGeometry, floorMaterial, pathGeometry, pathMaterial);

  // Walls; east wall split around the entrance (gap z 25..26.5).
  box(wallMaterial, -7, WALL_HEIGHT / 2, 21, 12, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, -7, WALL_HEIGHT / 2, 31, 12, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, -13, WALL_HEIGHT / 2, 26, WALL_THICKNESS, WALL_HEIGHT, 10, true);
  box(wallMaterial, -1, WALL_HEIGHT / 2, 23, WALL_THICKNESS, WALL_HEIGHT, 4, true);
  box(wallMaterial, -1, WALL_HEIGHT / 2, 28.75, WALL_THICKNESS, WALL_HEIGHT, 4.5, true);

  // Signboard above the entrance.
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 256;
  signCanvas.height = 64;
  drawSign(signCanvas.getContext("2d")!);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMaterial = new THREE.MeshStandardMaterial({ map: signTexture });
  const signGeometry = new THREE.PlaneGeometry(2.6, 0.65);
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(-0.8, 2.1, 25.75);
  sign.rotation.y = Math.PI / 2;
  group.add(sign);
  disposables.push(signTexture, signMaterial, signGeometry);

  // --- Small kitchen, NW corner ---
  box(steelMaterial, -11.4, 0.45, 22.2, 2.8, 0.9, 1.2, true); // counter
  box(steelMaterial, -12.4, 0.45, 24.4, 1.0, 0.9, 3.0, true); // L-return
  box(ventMaterial, -11.4, 0.95, 21.9, 1.2, 0.12, 0.6); // stove top
  const burnerGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
  const potGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.22, 16);
  disposables.push(burnerGeometry, potGeometry);
  for (const bx of [-11.7, -11.1]) {
    const burner = new THREE.Mesh(burnerGeometry, darkWoodMaterial);
    burner.position.set(bx, 1.03, 21.9);
    group.add(burner);
  }
  const pot = new THREE.Mesh(potGeometry, steelMaterial);
  pot.position.set(-11.7, 1.15, 21.9);
  group.add(pot);
  box(ventMaterial, -11.4, 2.1, 21.9, 1.4, 0.5, 0.7); // extraction hood

  // --- Ramen tables with stools, bowls, and some tissue packets ---
  const stoolGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.42, 12);
  const bowlGeometry = new THREE.CylinderGeometry(0.14, 0.1, 0.1, 16);
  const brothGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16);
  const brothMaterial = new THREE.MeshStandardMaterial({ color: 0xc96a1e });
  const tissueMaterial = new THREE.MeshStandardMaterial({ color: 0xd9e8f0 });
  disposables.push(
    stoolGeometry, bowlGeometry, brothGeometry, brothMaterial, tissueMaterial,
  );
  for (const [tx, tz, hasTissues] of TABLES) {
    box(darkWoodMaterial, tx, 0.36, tz, 0.95, 0.72, 0.95, true);
    for (const [sx, sz] of [[-0.85, 0], [0.85, 0], [0, -0.85], [0, 0.85]]) {
      const stool = new THREE.Mesh(stoolGeometry, darkWoodMaterial);
      stool.position.set(tx + sx, 0.21, tz + sz);
      stool.castShadow = true;
      group.add(stool);
    }
    for (const [bx, bz] of [[-0.22, 0.1], [0.24, -0.14]]) {
      const bowl = new THREE.Mesh(bowlGeometry, whiteMaterial);
      bowl.position.set(tx + bx, 0.77, tz + bz);
      group.add(bowl);
      const broth = new THREE.Mesh(brothGeometry, brothMaterial);
      broth.position.set(tx + bx, 0.825, tz + bz);
      group.add(broth);
    }
    if (hasTissues) {
      const tissues = box(tissueMaterial, tx + 0.05, 0.755, tz + 0.32, 0.2, 0.07, 0.12);
      tissues.rotation.y = 0.4;
    }
  }

  // --- Flags hanging from a ceiling rod ---
  const rodGeometry = new THREE.CylinderGeometry(0.025, 0.025, 4.4, 8).rotateZ(
    Math.PI / 2,
  );
  const rod = new THREE.Mesh(rodGeometry, steelMaterial);
  rod.position.set(-7, 2.2, 26);
  group.add(rod);
  disposables.push(rodGeometry);
  const flagGeometry = new THREE.PlaneGeometry(1.1, 0.7);
  disposables.push(flagGeometry);
  const hangFlag = (
    draw: (ctx: CanvasRenderingContext2D) => void,
    x: number,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 80;
    draw(canvas.getContext("2d")!);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    disposables.push(texture, material);
    const flag = new THREE.Mesh(flagGeometry, material);
    flag.position.set(x, 1.82, 26);
    group.add(flag);
  };
  hangFlag(drawSriLankaFlag, -8.2);
  hangFlag(drawKoreaFlag, -5.8);

  // --- Nine wall-mounted air conditioners ---
  const acPositions: [number, number, number][] = [
    // [x, z, rotationY] — five on the north wall, four on the south wall.
    [-12, 21.45, 0], [-9.8, 21.45, 0], [-7.6, 21.45, 0],
    [-5.4, 21.45, 0], [-3.2, 21.45, 0],
    [-11.2, 30.55, Math.PI], [-8.6, 30.55, Math.PI],
    [-6, 30.55, Math.PI], [-3.4, 30.55, Math.PI],
  ];
  for (const [ax, az, rotationY] of acPositions) {
    const ac = new THREE.Group();
    ac.position.set(ax, 1.95, az);
    ac.rotation.y = rotationY;
    const body = new THREE.Mesh(unitBox, whiteMaterial);
    body.scale.set(1.0, 0.3, 0.22);
    ac.add(body);
    const vent = new THREE.Mesh(unitBox, ventMaterial);
    vent.scale.set(0.85, 0.06, 0.02);
    vent.position.set(0, -0.1, 0.115);
    ac.add(vent);
    group.add(ac);
  }

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
