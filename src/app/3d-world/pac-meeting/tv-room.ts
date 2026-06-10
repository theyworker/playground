import * as THREE from "three";
import type { Collider } from "./house";
import { drawPoster, drawTvFrame, drawTvStandby } from "./tv-art";

// Cinema room, center-north: x -5..5, z -10..-4. Door gap x -0.5..1 on the
// south wall; the bedroom door in the east wall also opens into it.
const TV_POSITION = new THREE.Vector2(0, -9.6);
const TV_ACTIVE_DISTANCE = 5;
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

export function buildTvRoom(): {
  group: THREE.Group;
  colliders: Collider[];
  update: (delta: number, player: THREE.Vector3) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const paintMaterial = new THREE.MeshStandardMaterial({ color: 0x32364a });
  const darkWoodMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3526 });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x15151a,
    roughness: 0.4,
  });
  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d1f2c,
    roughness: 0.95,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9962e,
    metalness: 0.8,
    roughness: 0.35,
  });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  disposables.push(
    paintMaterial, darkWoodMaterial, blackMaterial,
    fabricMaterial, goldMaterial, unitBox,
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

  // Dark-painted cinema walls.
  box(paintMaterial, -5, WALL_HEIGHT / 2, -7, WALL_THICKNESS, WALL_HEIGHT, 6, true);
  box(paintMaterial, -2.75, WALL_HEIGHT / 2, -4, 4.5, WALL_HEIGHT, WALL_THICKNESS, true);
  box(paintMaterial, 3, WALL_HEIGHT / 2, -4, 4, WALL_HEIGHT, WALL_THICKNESS, true);

  // Cinema rug.
  const rugGeometry = new THREE.PlaneGeometry(8.5, 4.8).rotateX(-Math.PI / 2);
  const rugMaterial = new THREE.MeshStandardMaterial({
    color: 0x451820,
    roughness: 1,
  });
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.position.set(0, 0.012, -7);
  rug.receiveShadow = true;
  group.add(rug);
  disposables.push(rugGeometry, rugMaterial);

  // --- The very large TV (screen is an animated canvas texture) ---
  const tvCanvas = document.createElement("canvas");
  tvCanvas.width = 512;
  tvCanvas.height = 256;
  const tvContext = tvCanvas.getContext("2d")!;
  drawTvStandby(tvContext);
  const tvTexture = new THREE.CanvasTexture(tvCanvas);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: tvTexture });
  const screenGeometry = new THREE.PlaneGeometry(4.5, 2.1);
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.set(0, 1.5, -9.63);
  group.add(screen);
  disposables.push(tvTexture, screenMaterial, screenGeometry);
  box(blackMaterial, 0, 1.5, -9.72, 4.8, 2.4, 0.12); // bezel
  box(darkWoodMaterial, 0, 0.25, -9.45, 3.2, 0.5, 0.55, true); // media console

  // --- Subwoofers flanking the TV ---
  const coneGeometry = new THREE.CylinderGeometry(0.24, 0.3, 0.08, 20).rotateX(
    Math.PI / 2,
  );
  const capGeometry = new THREE.SphereGeometry(0.08, 12, 12);
  const greyMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c3c44,
    roughness: 0.6,
  });
  disposables.push(coneGeometry, capGeometry, greyMaterial);
  for (const side of [-3.4, 3.4]) {
    box(blackMaterial, side, 0.75, -9.45, 0.9, 1.5, 0.7, true);
    for (const coneY of [0.45, 1.1]) {
      const cone = new THREE.Mesh(coneGeometry, greyMaterial);
      cone.position.set(side, coneY, -9.08);
      group.add(cone);
      const cap = new THREE.Mesh(capGeometry, blackMaterial);
      cap.position.set(side, coneY, -9.1);
      group.add(cap);
    }
  }

  // --- Couch facing the TV, with armrests ---
  box(fabricMaterial, 0, 0.35, -5.7, 3.2, 0.7, 1.1);
  box(fabricMaterial, 0, 0.85, -5.32, 3.2, 0.75, 0.35);
  box(fabricMaterial, -1.75, 0.62, -5.7, 0.35, 0.55, 1.1);
  box(fabricMaterial, 1.75, 0.62, -5.7, 0.35, 0.55, 1.1);
  colliders.push({ minX: -1.95, maxX: 1.95, minZ: -6.25, maxZ: -5.1 });

  // --- Coffee table with magazines and deco ---
  box(darkWoodMaterial, 0, 0.25, -7.3, 1.6, 0.5, 0.8, true);
  const magazineColors = [0xd1495b, 0x30638e, 0xedae49];
  magazineColors.forEach((color, i) => {
    const magazineMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
    });
    disposables.push(magazineMaterial);
    const magazine = box(
      magazineMaterial,
      -0.35, 0.515 + i * 0.022, -7.25,
      0.36, 0.02, 0.26,
    );
    magazine.rotation.y = (i - 1) * 0.3;
  });
  const vaseGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.18, 12);
  const vase = new THREE.Mesh(vaseGeometry, goldMaterial);
  vase.position.set(0.4, 0.59, -7.3);
  group.add(vase);
  const foliageGeometry = new THREE.SphereGeometry(0.1, 12, 12);
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7d44,
    roughness: 0.9,
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.set(0.4, 0.74, -7.3);
  group.add(foliage);
  const bowlGeometry = new THREE.CylinderGeometry(0.11, 0.06, 0.07, 16);
  const bowl = new THREE.Mesh(bowlGeometry, blackMaterial);
  bowl.position.set(0.05, 0.535, -7.45);
  group.add(bowl);
  disposables.push(vaseGeometry, foliageGeometry, foliageMaterial, bowlGeometry);

  // --- Framed movie posters ---
  const posterGeometry = new THREE.PlaneGeometry(0.8, 1.1);
  disposables.push(posterGeometry);
  const addPoster = (
    variant: number,
    x: number, z: number, rotationY: number,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 176;
    drawPoster(canvas.getContext("2d")!, variant);
    const texture = new THREE.CanvasTexture(canvas);
    const posterMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
    });
    disposables.push(texture, posterMaterial);
    const frame = box(goldMaterial, 0, 0, 0, 0.92, 1.22, 0.05);
    frame.position.set(x, 1.5, z);
    frame.rotation.y = rotationY;
    const poster = new THREE.Mesh(posterGeometry, posterMaterial);
    poster.position.set(x, 1.5, z).add(
      new THREE.Vector3(Math.sin(rotationY) * 0.035, 0, Math.cos(rotationY) * 0.035),
    );
    poster.rotation.y = rotationY;
    group.add(poster);
  };
  addPoster(0, -4.8, -8.3, Math.PI / 2); // west wall
  addPoster(1, -4.8, -6.3, Math.PI / 2); // west wall
  addPoster(2, 4.82, -8, -Math.PI / 2); // east (bedroom) wall

  // Screen light that only glows while the TV is playing.
  const screenLight = new THREE.PointLight(0x86b8ff, 0, 7, 2);
  screenLight.position.set(0, 1.6, -8.8);
  group.add(screenLight);

  let playTime = 0;
  let sinceRedraw = 0;
  let wasActive = false;
  const update = (delta: number, player: THREE.Vector3) => {
    const active =
      Math.hypot(player.x - TV_POSITION.x, player.z - TV_POSITION.y) <
      TV_ACTIVE_DISTANCE;
    if (active) {
      playTime += delta;
      sinceRedraw += delta;
      // Redraw + re-upload the canvas at ~12fps, not every frame —
      // texture uploads are the expensive part.
      if (sinceRedraw > 1 / 12) {
        sinceRedraw = 0;
        drawTvFrame(tvContext, playTime);
        tvTexture.needsUpdate = true;
      }
      screenLight.intensity = 6 + Math.sin(playTime * 7) * 1.5;
    } else if (wasActive) {
      drawTvStandby(tvContext);
      tvTexture.needsUpdate = true;
      screenLight.intensity = 0;
    }
    wasActive = active;
  };

  return {
    group,
    colliders,
    update,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
