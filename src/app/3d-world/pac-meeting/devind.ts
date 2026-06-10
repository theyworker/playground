import * as THREE from "three";
import type { Collider } from "./house";
import { drawDevindSign, drawTechPoster, drawTiktokSign } from "./devind-art";
import { buildConstructionSign } from "./construction-sign";

// Devind's Place: x -13..-1, z 34..46, just south of the BBQ. Door on the
// east wall (gap z 39..40.5) facing the extended road.
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

export function buildDevind(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x9c8f78 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x6f5643 });
  const willowMaterial = new THREE.MeshStandardMaterial({ color: 0xd9c79a });
  const ballMaterial = new THREE.MeshStandardMaterial({
    color: 0xa31515,
    roughness: 0.5,
  });
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x1f3a6b });
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f0 });
  disposables.push(
    unitBox, wallMaterial, woodMaterial, willowMaterial,
    ballMaterial, helmetMaterial, whiteMaterial,
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

  // Floor, walls, entrance, stone path, signboard.
  const floorGeometry = new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a5c });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(-7, 0.008, 40);
  floor.receiveShadow = true;
  group.add(floor);
  const pathGeometry = new THREE.PlaneGeometry(2, 1.5).rotateX(-Math.PI / 2);
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x8d8478 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(-0.1, 0.002, 39.75);
  path.receiveShadow = true;
  group.add(path);
  disposables.push(floorGeometry, floorMaterial, pathGeometry, pathMaterial);

  box(wallMaterial, -7, WALL_HEIGHT / 2, 34, 12, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, -7, WALL_HEIGHT / 2, 46, 12, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, -13, WALL_HEIGHT / 2, 40, WALL_THICKNESS, WALL_HEIGHT, 12, true);
  box(wallMaterial, -1, WALL_HEIGHT / 2, 36.5, WALL_THICKNESS, WALL_HEIGHT, 5, true);
  box(wallMaterial, -1, WALL_HEIGHT / 2, 43.25, WALL_THICKNESS, WALL_HEIGHT, 5.5, true);

  canvasPlane(drawDevindSign, 256, 64, 2.4, 0.6, -0.82, 2.05, 39.75, Math.PI / 2);

  // Still under construction, apparently.
  const constructionSign = buildConstructionSign(0.7, 38.3, Math.PI / 2);
  group.add(constructionSign.group);
  colliders.push(constructionSign.collider);
  disposables.push({ dispose: constructionSign.dispose });
  canvasPlane(drawTechPoster, 192, 128, 1.2, 0.8, -6, 1.5, 34.17, 0);

  // --- Indoor cricket net along the west wall (open at the north end) ---
  const pitchGeometry = new THREE.PlaneGeometry(1.9, 7).rotateX(-Math.PI / 2);
  const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0xcfc096 });
  const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
  pitch.position.set(-11.6, 0.014, 39.5);
  pitch.receiveShadow = true;
  group.add(pitch);
  disposables.push(pitchGeometry, pitchMaterial);

  const netMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8d8cc,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const sideNetGeometry = new THREE.PlaneGeometry(7, 2.2, 18, 6).rotateY(
    Math.PI / 2,
  );
  const backNetGeometry = new THREE.PlaneGeometry(2.1, 2.2, 6, 6);
  disposables.push(netMaterial, sideNetGeometry, backNetGeometry);
  const sideNet = new THREE.Mesh(sideNetGeometry, netMaterial);
  sideNet.position.set(-10.6, 1.1, 39.5);
  group.add(sideNet);
  const backNet = new THREE.Mesh(backNetGeometry, netMaterial);
  backNet.position.set(-11.6, 1.1, 43);
  group.add(backNet);
  colliders.push(
    { minX: -10.72, maxX: -10.48, minZ: 36, maxZ: 43 },
    { minX: -12.65, maxX: -10.55, minZ: 42.9, maxZ: 43.1 },
  );
  // Stumps at the back of the lane.
  const stumpGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.5, 8);
  disposables.push(stumpGeometry);
  for (const sx of [-11.68, -11.6, -11.52]) {
    const stump = new THREE.Mesh(stumpGeometry, willowMaterial);
    stump.position.set(sx, 0.25, 42.4);
    stump.castShadow = true;
    group.add(stump);
  }

  // --- Cricket gear scattered everywhere ---
  const handleGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8);
  const helmetGeometry = new THREE.SphereGeometry(
    0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2,
  );
  const ballGeometry = new THREE.SphereGeometry(0.05, 10, 10);
  disposables.push(handleGeometry, helmetGeometry, ballGeometry);

  const bat = (x: number, z: number, rotation: number) => {
    const blade = box(willowMaterial, x, 0.035, z, 0.13, 0.045, 0.6);
    blade.rotation.y = rotation;
    const handle = new THREE.Mesh(handleGeometry, woodMaterial);
    handle.rotation.x = Math.PI / 2;
    handle.rotation.z = -rotation;
    handle.position.set(
      x - Math.sin(rotation) * 0.42, 0.035, z - Math.cos(rotation) * 0.42,
    );
    handle.castShadow = true;
    group.add(handle);
  };
  bat(-9.2, 36.2, 0.7);
  bat(-5.5, 38.5, -1.1);
  bat(-3.2, 41.8, 2.3);
  bat(-8.4, 44.3, 0.2);

  const helmet = (x: number, z: number) => {
    const dome = new THREE.Mesh(helmetGeometry, helmetMaterial);
    dome.position.set(x, 0.02, z);
    dome.castShadow = true;
    group.add(dome);
    box(helmetMaterial, x, 0.06, z + 0.14, 0.26, 0.02, 0.12); // peak
    box(whiteMaterial, x, 0.05, z + 0.17, 0.2, 0.015, 0.015); // grill bar
  };
  helmet(-6.8, 36.8);
  helmet(-4.2, 44.6);
  helmet(-9.6, 41.5);

  for (const [bx, bz] of [
    [-8.8, 38.0], [-6.1, 41.2], [-3.0, 37.2], [-5.2, 43.6],
    [-10.0, 44.8], [-2.4, 39.2], [-7.5, 39.9], [-11.2, 36.6],
  ]) {
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(bx, 0.05, bz);
    ball.castShadow = true;
    group.add(ball);
  }

  // --- Corner table: paper and pens only ---
  box(woodMaterial, -2.1, 0.38, 35.2, 1.4, 0.76, 0.8, true);
  const penGeometry = new THREE.CylinderGeometry(0.009, 0.009, 0.15, 8).rotateZ(
    Math.PI / 2,
  );
  disposables.push(penGeometry);
  const penColors = [0x1f3a8c, 0x202020, 0xb3271e];
  for (let i = 0; i < 3; i++) {
    const sheet = box(
      whiteMaterial,
      -2.35 + i * 0.26, 0.765 + i * 0.002, 35.15,
      0.21, 0.004, 0.3,
    );
    sheet.rotation.y = (i - 1) * 0.18;
    const penMaterial = new THREE.MeshStandardMaterial({ color: penColors[i] });
    disposables.push(penMaterial);
    const pen = new THREE.Mesh(penGeometry, penMaterial);
    pen.position.set(-2.3 + i * 0.2, 0.775, 35.42);
    pen.rotation.y = i * 0.5;
    group.add(pen);
  }

  // --- TikTok room, SE corner (x -4..-1, z 43..46), door gap x -2.6..-1.6 ---
  box(wallMaterial, -4, WALL_HEIGHT / 2, 44.5, WALL_THICKNESS, WALL_HEIGHT, 3, true);
  box(wallMaterial, -3.3, WALL_HEIGHT / 2, 43, 1.4, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, -1.3, WALL_HEIGHT / 2, 43, 0.6, WALL_HEIGHT, WALL_THICKNESS, true);
  canvasPlane(drawTiktokSign, 192, 48, 1.3, 0.33, -2.1, 2.0, 42.83, Math.PI);

  // Ring lights on stands.
  const ringGeometry = new THREE.TorusGeometry(0.26, 0.03, 10, 32);
  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
  const baseGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff4e0,
    emissive: 0xffe8c8,
    emissiveIntensity: 1.4,
  });
  const standMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2e });
  disposables.push(
    ringGeometry, poleGeometry, baseGeometry, ringMaterial, standMaterial,
  );
  for (const [rx, rz, ry] of [[-3.5, 44.2, 0.8], [-2.0, 45.2, -0.6]]) {
    const base = new THREE.Mesh(baseGeometry, standMaterial);
    base.position.set(rx, 0.015, rz);
    group.add(base);
    const pole = new THREE.Mesh(poleGeometry, standMaterial);
    pole.position.set(rx, 0.7, rz);
    group.add(pole);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(rx, 1.5, rz);
    ring.rotation.y = ry;
    group.add(ring);
  }

  // Wall mirror and a vanity counter of cosmetics.
  box(standMaterial, -2.5, 1.4, 45.86, 1.1, 0.9, 0.04);
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfe6ef,
    emissive: 0x88a8b8,
    emissiveIntensity: 0.35,
    roughness: 0.05,
    metalness: 0.4,
  });
  disposables.push(mirrorMaterial);
  box(mirrorMaterial, -2.5, 1.4, 45.83, 1.0, 0.8, 0.03);
  box(woodMaterial, -1.45, 0.4, 44.6, 0.55, 0.8, 1.6, true);
  const cosmeticGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.11, 10);
  const lipstickGeometry = new THREE.CylinderGeometry(0.016, 0.016, 0.07, 8);
  disposables.push(cosmeticGeometry, lipstickGeometry);
  const cosmeticColors = [0xe26fa8, 0x7ccfe0, 0xf2d34d, 0xb88ce8, 0xe85a4f];
  cosmeticColors.forEach((color, i) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
    disposables.push(material);
    const item = new THREE.Mesh(
      i % 2 === 0 ? cosmeticGeometry : lipstickGeometry,
      material,
    );
    item.position.set(-1.55 + (i % 2) * 0.2, 0.85, 43.95 + i * 0.3);
    group.add(item);
  });

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
