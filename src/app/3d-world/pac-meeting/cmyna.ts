import * as THREE from "three";
import type { Collider } from "./house";
import { drawApplePoster, drawCmynaSign, drawDrakeQuote } from "./cmyna-art";
import { buildConstructionSign } from "./construction-sign";

// Cmyna Crib: a very large house (16x14) south of Tycoon House, east of the
// road. Door on the west wall, gap z 40..41.5.
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

// Twelve potted plants lining the walls.
const PLANT_SPOTS: [number, number][] = [
  [9.5, 35.2], [11.5, 35.2], [13.5, 35.2], [15.5, 35.2],
  [17.5, 35.2], [19.5, 35.2], [21.5, 35.2],
  [23, 37.5], [23, 40], [23, 42.5], [23, 45],
  [12, 46.8],
];

export function buildCmyna(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x9aa388 });
  disposables.push(unitBox, wallMaterial);

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

  const canvasPlane = (
    draw: (ctx: CanvasRenderingContext2D) => void,
    width: number, height: number,
    planeW: number, planeH: number,
    x: number, y: number, z: number, rotationY: number,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(planeW, planeH);
    disposables.push(texture, material, geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    group.add(mesh);
  };

  // Floor, walls, entrance path, signboard.
  const floorGeometry = new THREE.PlaneGeometry(16, 14).rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(16, 0.008, 41);
  floor.receiveShadow = true;
  group.add(floor);
  const pathGeometry = new THREE.PlaneGeometry(3.8, 1.5).rotateX(-Math.PI / 2);
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8478 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(6.1, 0.002, 40.75);
  path.receiveShadow = true;
  group.add(path);
  disposables.push(floorGeometry, floorMaterial, pathGeometry, pathMaterial);

  box(wallMaterial, 16, WALL_HEIGHT / 2, 34, 16, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, 16, WALL_HEIGHT / 2, 48, 16, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, 24, WALL_HEIGHT / 2, 41, WALL_THICKNESS, WALL_HEIGHT, 14, true);
  box(wallMaterial, 8, WALL_HEIGHT / 2, 37, WALL_THICKNESS, WALL_HEIGHT, 6, true);
  box(wallMaterial, 8, WALL_HEIGHT / 2, 44.75, WALL_THICKNESS, WALL_HEIGHT, 6.5, true);

  canvasPlane(drawCmynaSign, 256, 64, 2.4, 0.6, 7.82, 2.05, 40.75, -Math.PI / 2);

  // Still under construction, apparently.
  const constructionSign = buildConstructionSign(5.4, 39.2, -Math.PI / 2);
  group.add(constructionSign.group);
  colliders.push(constructionSign.collider);
  disposables.push({ dispose: constructionSign.dispose });

  // Wall art: the apple poster and three Drake quotes.
  canvasPlane(drawApplePoster, 192, 128, 1.3, 0.85, 14, 1.5, 34.17, 0);
  canvasPlane((ctx) => drawDrakeQuote(ctx, 0), 192, 128, 1.2, 0.8, 23.83, 1.5, 38.5, -Math.PI / 2);
  canvasPlane((ctx) => drawDrakeQuote(ctx, 1), 192, 128, 1.2, 0.8, 23.83, 1.5, 43.5, -Math.PI / 2);
  canvasPlane((ctx) => drawDrakeQuote(ctx, 2), 192, 128, 1.2, 0.8, 18, 1.5, 47.83, Math.PI);

  // --- Twelve potted plants ---
  const potGeometry = new THREE.CylinderGeometry(0.22, 0.16, 0.3, 14);
  const soilGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.03, 14);
  const stemGeometry = new THREE.CylinderGeometry(0.018, 0.025, 0.55, 8);
  const leafGeometry = new THREE.BoxGeometry(0.05, 0.012, 0.34);
  const tipGeometry = new THREE.ConeGeometry(0.05, 0.16, 8);
  const potMaterial = new THREE.MeshStandardMaterial({ color: 0xa9573a });
  const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x2e2018 });
  const plantMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f8f3a,
    roughness: 0.8,
  });
  disposables.push(
    potGeometry, soilGeometry, stemGeometry, leafGeometry, tipGeometry,
    potMaterial, soilMaterial, plantMaterial,
  );

  for (const [px, pz] of PLANT_SPOTS) {
    const plant = new THREE.Group();
    plant.position.set(px, 0, pz);
    plant.rotation.y = Math.random() * Math.PI;
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.15;
    pot.castShadow = true;
    plant.add(pot);
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0.29;
    plant.add(soil);
    const stem = new THREE.Mesh(stemGeometry, plantMaterial);
    stem.position.y = 0.57;
    plant.add(stem);
    // Two tiers of radiating leaves plus a top spike.
    for (const [tierY, count, droop] of [[0.62, 6, 0.5], [0.78, 4, 0.3]]) {
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(leafGeometry, plantMaterial);
        const angle = (i / count) * Math.PI * 2 + tierY;
        leaf.position.set(
          Math.cos(angle) * 0.15, tierY, Math.sin(angle) * 0.15,
        );
        leaf.rotation.y = -angle + Math.PI / 2;
        leaf.rotation.x = droop;
        leaf.castShadow = true;
        plant.add(leaf);
      }
    }
    const tip = new THREE.Mesh(tipGeometry, plantMaterial);
    tip.position.y = 0.95;
    plant.add(tip);
    group.add(plant);
    colliders.push({
      minX: px - 0.28, maxX: px + 0.28,
      minZ: pz - 0.28, maxZ: pz + 0.28,
    });
  }

  // --- Apples and grapes scattered everywhere across the floor ---
  const appleGeometry = new THREE.SphereGeometry(0.06, 12, 10);
  const grapeGeometry = new THREE.SphereGeometry(0.028, 8, 8);
  const appleMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8332b,
    roughness: 0.4,
  });
  const grapeMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a2a7a,
    roughness: 0.5,
  });
  disposables.push(appleGeometry, grapeGeometry, appleMaterial, grapeMaterial);

  const randomSpot = (): [number, number] => [
    9 + Math.random() * 13.5,
    35.8 + Math.random() * 10.4,
  ];
  for (let i = 0; i < 16; i++) {
    const [ax, az] = randomSpot();
    const apple = new THREE.Mesh(appleGeometry, appleMaterial);
    apple.position.set(ax, 0.06, az);
    apple.castShadow = true;
    group.add(apple);
  }
  for (let i = 0; i < 10; i++) {
    const [gx, gz] = randomSpot();
    for (let g = 0; g < 6; g++) {
      const grape = new THREE.Mesh(grapeGeometry, grapeMaterial);
      grape.position.set(
        gx + (Math.random() - 0.5) * 0.1,
        0.028 + (g % 2) * 0.04,
        gz + (Math.random() - 0.5) * 0.1,
      );
      group.add(grape);
    }
  }

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
