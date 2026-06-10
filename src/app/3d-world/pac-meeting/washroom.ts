import * as THREE from "three";
import type { Collider } from "./house";

// Luxurious tiled washroom in the SW corner: x -14..-9, z 4..10.
// Door gap on the north wall at x -10.5..-9.15.
const SHOWER_HEAD = new THREE.Vector3(-13.1, 2.05, 9.1);
const COMMODE_POS = new THREE.Vector2(-13.25, 4.9);
const DROP_COUNT = 90;
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

function makeTileTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#eceae4";
  ctx.fillRect(0, 0, 128, 128);
  // Faint marble veining.
  ctx.strokeStyle = "#d8d4ca";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 30, 0);
    ctx.bezierCurveTo(i * 30 + 40, 40, i * 30 - 20, 90, i * 30 + 25, 128);
    ctx.stroke();
  }
  // Grout lines.
  ctx.strokeStyle = "#bdb8ac";
  ctx.lineWidth = 3;
  for (let p = 0; p <= 128; p += 32) {
    ctx.strokeRect(0, p, 128, 0);
    ctx.strokeRect(p, 0, 0, 128);
  }
  return canvas;
}

export function buildWashroom(): {
  group: THREE.Group;
  colliders: Collider[];
  update: (delta: number, player: THREE.Vector3) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const tileCanvas = makeTileTexture();
  const wallTiles = new THREE.CanvasTexture(tileCanvas);
  wallTiles.wrapS = wallTiles.wrapT = THREE.RepeatWrapping;
  wallTiles.repeat.set(2, 1.5);
  const floorTiles = new THREE.CanvasTexture(tileCanvas);
  floorTiles.wrapS = floorTiles.wrapT = THREE.RepeatWrapping;
  floorTiles.repeat.set(3, 3.5);

  const tileMaterial = new THREE.MeshStandardMaterial({
    map: wallTiles,
    roughness: 0.25,
  });
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTiles,
    roughness: 0.2,
  });
  const marbleMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f2ea,
    roughness: 0.15,
  });
  const porcelainMaterial = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.18,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.9,
    roughness: 0.25,
  });
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfe6ef,
    emissive: 0x88a8b8,
    emissiveIntensity: 0.35,
    roughness: 0.05,
    metalness: 0.4,
  });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  disposables.push(
    wallTiles, floorTiles, tileMaterial, floorMaterial, marbleMaterial,
    porcelainMaterial, goldMaterial, mirrorMaterial, unitBox,
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

  // Tiled floor and interior walls; thin tile panels line the outer walls.
  const floorGeometry = new THREE.PlaneGeometry(5, 6).rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(-11.5, 0.015, 7);
  floor.receiveShadow = true;
  group.add(floor);
  disposables.push(floorGeometry);

  box(tileMaterial, -12.25, WALL_HEIGHT / 2, 4, 3.5, WALL_HEIGHT, WALL_THICKNESS, true);
  box(tileMaterial, -9, WALL_HEIGHT / 2, 7, WALL_THICKNESS, WALL_HEIGHT, 6, true);
  box(tileMaterial, -13.82, WALL_HEIGHT / 2, 7, 0.06, WALL_HEIGHT, 6); // west lining
  box(tileMaterial, -11.5, WALL_HEIGHT / 2, 9.82, 5, WALL_HEIGHT, 0.06); // south lining

  // Warm vanity light.
  const light = new THREE.PointLight(0xffe6c0, 14, 9, 2);
  light.position.set(-11.5, 2.2, 7);
  group.add(light);

  // --- Vanity sink with gold faucet and lit mirror ---
  box(porcelainMaterial, -10.2, 0.375, 9.55, 1.5, 0.75, 0.5, true);
  box(marbleMaterial, -10.2, 0.8, 9.5, 1.7, 0.1, 0.65);
  const basinGeometry = new THREE.CylinderGeometry(0.22, 0.18, 0.12, 24);
  const basin = new THREE.Mesh(basinGeometry, porcelainMaterial);
  basin.position.set(-10.2, 0.9, 9.45);
  group.add(basin);
  disposables.push(basinGeometry);
  const spoutGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 12);
  const faucet = new THREE.Mesh(spoutGeometry, goldMaterial);
  faucet.position.set(-10.2, 1.0, 9.68);
  group.add(faucet);
  const spout = new THREE.Mesh(spoutGeometry, goldMaterial);
  spout.scale.setScalar(0.7);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(-10.2, 1.13, 9.58);
  group.add(spout);
  disposables.push(spoutGeometry);
  box(goldMaterial, -10.2, 1.75, 9.84, 1.3, 1.0, 0.03); // mirror frame
  box(mirrorMaterial, -10.2, 1.75, 9.81, 1.15, 0.85, 0.03); // mirror

  // --- Commode with proximity-opening seat cover ---
  box(porcelainMaterial, -13.62, 0.6, 4.9, 0.25, 0.7, 0.6, true); // tank
  const bowlGeometry = new THREE.CylinderGeometry(0.26, 0.2, 0.45, 20);
  const bowl = new THREE.Mesh(bowlGeometry, porcelainMaterial);
  bowl.position.set(-13.25, 0.225, 4.9);
  bowl.castShadow = true;
  group.add(bowl);
  disposables.push(bowlGeometry);
  const seatGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 20);
  const seat = new THREE.Mesh(seatGeometry, porcelainMaterial);
  seat.scale.z = 1.12;
  seat.position.set(-13.25, 0.47, 4.9);
  group.add(seat);
  disposables.push(seatGeometry);
  // Lid hinged at the tank side; rotating +z lifts its free end up.
  const lidPivot = new THREE.Group();
  lidPivot.userData.dynamic = true; // animates — excluded from static baking
  lidPivot.position.set(-13.48, 0.5, 4.9);
  const lid = box(porcelainMaterial, 0, 0, 0, 0.5, 0.04, 0.58);
  lid.position.set(0.26, 0, 0);
  group.remove(lid);
  lidPivot.add(lid);
  group.add(lidPivot);
  colliders.push({ minX: -13.85, maxX: -12.9, minZ: 4.5, maxZ: 5.3 });

  // --- Shower: marble base, gold rainfall head, glass enclosure ---
  box(marbleMaterial, -13.1, 0.04, 9.1, 1.7, 0.08, 1.7);
  const armGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 10).rotateX(
    Math.PI / 2,
  );
  const arm = new THREE.Mesh(armGeometry, goldMaterial);
  arm.position.set(-13.1, 2.2, 9.45);
  group.add(arm);
  disposables.push(armGeometry);
  const headGeometry = new THREE.CylinderGeometry(0.18, 0.2, 0.05, 20);
  const head = new THREE.Mesh(headGeometry, goldMaterial);
  head.position.copy(SHOWER_HEAD);
  group.add(head);
  disposables.push(headGeometry);
  // --- Water: a falling point stream, shown while someone is under it ---
  const dropPositions = new Float32Array(DROP_COUNT * 3);
  const dropSpeeds: number[] = [];
  for (let i = 0; i < DROP_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.18;
    dropPositions[i * 3] = SHOWER_HEAD.x + Math.cos(angle) * radius;
    dropPositions[i * 3 + 1] = Math.random() * 1.9;
    dropPositions[i * 3 + 2] = SHOWER_HEAD.z + Math.sin(angle) * radius;
    dropSpeeds.push(2.6 + Math.random() * 1.4);
  }
  const dropGeometry = new THREE.BufferGeometry();
  dropGeometry.setAttribute("position", new THREE.BufferAttribute(dropPositions, 3));
  const dropMaterial = new THREE.PointsMaterial({
    color: 0xaadcff,
    size: 0.045,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const water = new THREE.Points(dropGeometry, dropMaterial);
  water.visible = false;
  group.add(water);
  disposables.push(dropGeometry, dropMaterial);

  const update = (delta: number, player: THREE.Vector3) => {
    // Seat cover swings open as the crewmate approaches the commode.
    const commodeDistance = Math.hypot(
      player.x - COMMODE_POS.x,
      player.z - COMMODE_POS.y,
    );
    const lidTarget = commodeDistance < 1.2 ? 1.75 : 0;
    lidPivot.rotation.z += (lidTarget - lidPivot.rotation.z) * Math.min(1, delta * 6);

    // Shower pours only while the crewmate stands under the head.
    const underShower =
      Math.hypot(player.x - SHOWER_HEAD.x, player.z - SHOWER_HEAD.z) < 0.55;
    water.visible = underShower;
    if (underShower) {
      const attr = dropGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DROP_COUNT; i++) {
        let y = attr.getY(i) - dropSpeeds[i] * delta;
        if (y < 0.05) y = 1.95;
        attr.setY(i, y);
      }
      attr.needsUpdate = true;
    }
  };

  return {
    group,
    colliders,
    update,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
