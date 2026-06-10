import * as THREE from "three";
import type { Collider } from "./house";

// The lake behind (east of) Tycoon House, centered ~(35, 26), with the
// Tycoon Yatch moored in the middle and a statue of a boy on the shore.

function drawNamePlate(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#10243f";
  ctx.fillRect(0, 0, 256, 48);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 250, 42);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0e6d2";
  ctx.font = "bold 24px serif";
  ctx.fillText("TYCOON YATCH", 128, 32);
}

function drawStatuePlaque(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#6e5a2e";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0e6c8";
  ctx.font = "bold 21px serif";
  ctx.fillText("Statue of the Tycoon", 128, 40);
}

export function buildLake(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2f2ee,
    roughness: 0.35,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x14181f,
    metalness: 0.4,
    roughness: 0.15,
  });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b4a8,
    roughness: 0.9,
  });
  disposables.push(unitBox, whiteMaterial, glassMaterial, stoneMaterial);

  const box = (
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // --- The lake: a large flat disc of water with a sandy rim ---
  const rimGeometry = new THREE.CircleGeometry(10.9, 48).rotateX(-Math.PI / 2);
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b98a });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.set(35, -0.006, 26);
  rim.scale.set(1.05, 1, 0.95);
  rim.receiveShadow = true;
  group.add(rim);
  const waterGeometry = new THREE.CircleGeometry(10.4, 48).rotateX(-Math.PI / 2);
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e4f6e,
    roughness: 0.12,
    metalness: 0.15,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(35, 0.002, 26);
  water.scale.set(1.05, 1, 0.95);
  water.receiveShadow = true;
  group.add(water);
  disposables.push(rimGeometry, rimMaterial, waterGeometry, waterMaterial);

  // No walking on water: AABB strips tiling the ellipse.
  colliders.push(
    { minX: 28, maxX: 42, minZ: 16.8, maxZ: 20 },
    { minX: 25.2, maxX: 44.8, minZ: 20, maxZ: 24 },
    { minX: 24.2, maxX: 45.8, minZ: 24, maxZ: 28 },
    { minX: 25.2, maxX: 44.8, minZ: 28, maxZ: 32 },
    { minX: 28, maxX: 42, minZ: 32, maxZ: 35.2 },
  );

  // --- The Tycoon Yatch: hull, pointed bow, two decks, bridge, radar ---
  const yacht = new THREE.Group();
  yacht.position.set(35.5, 0, 26);
  yacht.rotation.y = 0.5;

  box(whiteMaterial, yacht, 0, 0.5, 0.6, 2.8, 0.75, 8.2); // hull
  const bowGeometry = new THREE.ConeGeometry(1.45, 2.6, 4)
    .rotateX(-Math.PI / 2)
    .rotateZ(Math.PI / 4);
  const bow = new THREE.Mesh(bowGeometry, whiteMaterial);
  bow.scale.set(0.95, 0.26, 1);
  bow.position.set(0, 0.5, -4.7);
  bow.castShadow = true;
  yacht.add(bow);
  disposables.push(bowGeometry);

  box(whiteMaterial, yacht, 0, 1.15, 1.1, 2.4, 0.6, 5.4); // main deck
  box(glassMaterial, yacht, 0, 1.15, -1.72, 2.0, 0.4, 0.06); // deck glazing
  box(whiteMaterial, yacht, 0, 1.72, 1.6, 1.9, 0.55, 3.6); // upper deck
  box(glassMaterial, yacht, 0, 2.25, 0.7, 1.5, 0.42, 1.3); // bridge
  box(whiteMaterial, yacht, 0, 2.52, 0.7, 1.6, 0.08, 1.5); // bridge roof
  const mastGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
  const mast = new THREE.Mesh(mastGeometry, whiteMaterial);
  mast.position.set(0, 2.9, 0.7);
  yacht.add(mast);
  disposables.push(mastGeometry);
  box(glassMaterial, yacht, 0, 3.2, 0.7, 0.7, 0.06, 0.12); // radar bar

  // Name plates on both sides of the hull, near the stern.
  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = 256;
  plateCanvas.height = 48;
  drawNamePlate(plateCanvas.getContext("2d")!);
  const plateTexture = new THREE.CanvasTexture(plateCanvas);
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture });
  const plateGeometry = new THREE.PlaneGeometry(2.0, 0.38);
  disposables.push(plateTexture, plateMaterial, plateGeometry);
  for (const side of [1, -1]) {
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.set(side * 1.41, 0.55, 2.6);
    plate.rotation.y = (side * Math.PI) / 2;
    yacht.add(plate);
  }
  const stern = new THREE.Mesh(plateGeometry, plateMaterial);
  stern.position.set(0, 0.55, 4.71);
  yacht.add(stern);
  group.add(yacht);

  // --- Statue of a boy on the shore, in front of the lake ---
  const statue = new THREE.Group();
  statue.position.set(23.5, 0, 22.8);
  statue.rotation.y = Math.PI / 2; // gazing out over the water
  box(stoneMaterial, statue, 0, 0.25, 0, 0.85, 0.5, 0.85); // pedestal
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
  const torsoGeometry = new THREE.CapsuleGeometry(0.13, 0.22, 4, 10);
  const headGeometry = new THREE.SphereGeometry(0.12, 12, 10);
  const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8);
  disposables.push(legGeometry, torsoGeometry, headGeometry, armGeometry);
  for (const lx of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(legGeometry, stoneMaterial);
    leg.position.set(lx, 0.675, 0);
    leg.castShadow = true;
    statue.add(leg);
  }
  const torso = new THREE.Mesh(torsoGeometry, stoneMaterial);
  torso.position.set(0, 1.08, 0);
  torso.castShadow = true;
  statue.add(torso);
  const head = new THREE.Mesh(headGeometry, stoneMaterial);
  head.position.set(0, 1.45, 0);
  head.castShadow = true;
  statue.add(head);
  const armDown = new THREE.Mesh(armGeometry, stoneMaterial);
  armDown.position.set(-0.19, 1.05, 0);
  armDown.rotation.z = 0.15;
  statue.add(armDown);
  const armUp = new THREE.Mesh(armGeometry, stoneMaterial);
  armUp.position.set(0.21, 1.28, 0.06);
  armUp.rotation.z = -2.4; // raised, waving at the yacht
  statue.add(armUp);
  // Brass plaque on the pedestal, facing the house.
  const plaqueCanvas = document.createElement("canvas");
  plaqueCanvas.width = 256;
  plaqueCanvas.height = 64;
  drawStatuePlaque(plaqueCanvas.getContext("2d")!);
  const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
  const plaqueMaterial = new THREE.MeshStandardMaterial({ map: plaqueTexture });
  const plaqueGeometry = new THREE.PlaneGeometry(0.66, 0.165);
  disposables.push(plaqueTexture, plaqueMaterial, plaqueGeometry);
  // One plaque per pedestal face.
  const plaqueSides: [number, number, number][] = [
    [0, -0.43, Math.PI],
    [0, 0.43, 0],
    [-0.43, 0, -Math.PI / 2],
    [0.43, 0, Math.PI / 2],
  ];
  for (const [px, pz, rotationY] of plaqueSides) {
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(px, 0.27, pz);
    plaque.rotation.y = rotationY;
    statue.add(plaque);
  }
  group.add(statue);
  colliders.push({ minX: 23.05, maxX: 23.95, minZ: 22.35, maxZ: 23.25 });

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
