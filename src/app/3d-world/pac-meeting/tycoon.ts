import * as THREE from "three";
import type { Collider } from "./house";

// Tycoon House: x 13..22, z 21..31, east of the road, opposite the BBQ.
// Door gap on the west wall at z 25.25..26.75; the parking rows leave a
// matching walking corridor from the road.
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

type VehicleKind = "car" | "suv" | "lorry";

// [kind, x, z, paint] — two perpendicular rows facing the house.
const PARKING: [VehicleKind, number, number, number][] = [
  ["suv", 7, 18.6, 0x2c5f7c], ["car", 7, 20.8, 0xb23a3a],
  ["lorry", 7, 23.0, 0xc9c9c4], ["car", 7, 28.2, 0x1f1f24],
  ["suv", 7, 30.4, 0x4a6b3a], ["lorry", 7, 32.6, 0xd9a13b],
  ["car", 10.3, 19.7, 0xe8e8e2], ["lorry", 10.3, 21.9, 0x7c3a2c],
  ["suv", 10.3, 24.1, 0x3a3a7c], ["car", 10.3, 27.9, 0x6b2fc4],
  ["suv", 10.3, 30.1, 0x8c8c94],
];

function drawTycoonSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#120e08";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 246, 54);
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4af37";
  ctx.font = "bold 26px serif";
  ctx.fillText("TYCOON HOUSE", 128, 40);
}

export function buildTycoon(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d0c0 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3526 });
  const billMaterial = new THREE.MeshStandardMaterial({
    color: 0x85bb65,
    roughness: 0.8,
  });
  const bundleMaterial = new THREE.MeshStandardMaterial({
    color: 0x5f9148,
    roughness: 0.8,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x14181f,
    metalness: 0.4,
    roughness: 0.15,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.9,
  });
  disposables.push(
    unitBox, wallMaterial, woodMaterial, billMaterial,
    bundleMaterial, glassMaterial, tireMaterial,
  );

  const box = (
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    solid = false,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (solid) {
      colliders.push({
        minX: x - w / 2, maxX: x + w / 2,
        minZ: z - d / 2, maxZ: z + d / 2,
      });
    }
    return mesh;
  };

  // Floor (dark marble) and walls with the west-facing entrance.
  const floorGeometry = new THREE.PlaneGeometry(9, 10).rotateX(-Math.PI / 2);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2e2b33,
    roughness: 0.35,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(17.5, 0.008, 26);
  floor.receiveShadow = true;
  group.add(floor);
  disposables.push(floorGeometry, floorMaterial);

  box(wallMaterial, group, 17.5, WALL_HEIGHT / 2, 21, 9, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, group, 17.5, WALL_HEIGHT / 2, 31, 9, WALL_HEIGHT, WALL_THICKNESS, true);
  box(wallMaterial, group, 22, WALL_HEIGHT / 2, 26, WALL_THICKNESS, WALL_HEIGHT, 10, true);
  box(wallMaterial, group, 13, WALL_HEIGHT / 2, 23.125, WALL_THICKNESS, WALL_HEIGHT, 4.25, true);
  box(wallMaterial, group, 13, WALL_HEIGHT / 2, 28.875, WALL_THICKNESS, WALL_HEIGHT, 4.25, true);

  // Gold signboard over the door.
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 256;
  signCanvas.height = 64;
  drawTycoonSign(signCanvas.getContext("2d")!);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMaterial = new THREE.MeshStandardMaterial({ map: signTexture });
  const signGeometry = new THREE.PlaneGeometry(2.4, 0.6);
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(12.82, 2.05, 26);
  sign.rotation.y = -Math.PI / 2;
  group.add(sign);
  disposables.push(signTexture, signMaterial, signGeometry);

  // --- Money ---
  const bundle = (x: number, y: number, z: number, rotation: number) => {
    const mesh = box(
      Math.random() > 0.5 ? billMaterial : bundleMaterial,
      group, x, y, z, 0.34, 0.09, 0.18,
    );
    mesh.rotation.y = rotation;
  };
  // Big piles: clusters of bundle stacks of random heights.
  const pile = (cx: number, cz: number, size: number) => {
    for (let gx = 0; gx < size; gx++) {
      for (let gz = 0; gz < size; gz++) {
        const stackHeight = 1 + Math.floor(Math.random() * 5);
        for (let level = 0; level < stackHeight; level++) {
          bundle(
            cx + (gx - (size - 1) / 2) * 0.38 + (Math.random() - 0.5) * 0.04,
            0.045 + level * 0.09,
            cz + (gz - (size - 1) / 2) * 0.22 + (Math.random() - 0.5) * 0.04,
            (Math.random() - 0.5) * 0.4,
          );
        }
      }
    }
    const reach = size * 0.21;
    colliders.push({
      minX: cx - reach, maxX: cx + reach,
      minZ: cz - reach, maxZ: cz + reach,
    });
  };
  pile(15, 22.6, 3);
  pile(20.2, 22.4, 4);
  pile(15.2, 29.3, 3);
  pile(18, 26.3, 2);

  // Bills scattered loose across the floor.
  const billGeometry = new THREE.BoxGeometry(0.3, 0.006, 0.16);
  disposables.push(billGeometry);
  for (let i = 0; i < 50; i++) {
    const bill = new THREE.Mesh(billGeometry, billMaterial);
    bill.position.set(
      13.6 + Math.random() * 7.8,
      0.012,
      21.6 + Math.random() * 8.8,
    );
    bill.rotation.y = Math.random() * Math.PI * 2;
    bill.receiveShadow = true;
    group.add(bill);
  }

  // Table with bills scattered on top.
  box(woodMaterial, group, 19.8, 0.38, 24.8, 1.7, 0.76, 0.9, true);
  for (let i = 0; i < 12; i++) {
    const bill = new THREE.Mesh(billGeometry, billMaterial);
    bill.position.set(
      19.8 + (Math.random() - 0.5) * 1.4,
      0.765 + Math.random() * 0.01,
      24.8 + (Math.random() - 0.5) * 0.7,
    );
    bill.rotation.y = Math.random() * Math.PI * 2;
    group.add(bill);
  }

  // Bed with a mound of bills gathered on the mattress.
  box(woodMaterial, group, 20.3, 0.2, 29.3, 1.7, 0.4, 2.3, true);
  const mattressMaterial = new THREE.MeshStandardMaterial({ color: 0xe8e2d4 });
  disposables.push(mattressMaterial);
  box(mattressMaterial, group, 20.3, 0.5, 29.3, 1.6, 0.25, 2.2);
  box(mattressMaterial, group, 20.3, 0.68, 28.4, 0.7, 0.14, 0.4); // pillow
  for (let i = 0; i < 26; i++) {
    const spread = 1 - i / 30;
    bundle(
      20.3 + (Math.random() - 0.5) * 0.9 * spread,
      0.67 + i * 0.028,
      29.5 + (Math.random() - 0.5) * 1.2 * spread,
      Math.random() * Math.PI,
    );
  }

  // --- The fleet: cars, SUVs, and lorries facing the house ---
  const tireGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.16, 14).rotateZ(
    Math.PI / 2,
  );
  disposables.push(tireGeometry);

  const buildVehicle = (kind: VehicleKind, paint: number) => {
    const vehicle = new THREE.Group();
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: paint,
      metalness: 0.5,
      roughness: 0.4,
    });
    disposables.push(paintMaterial);
    const wheels: [number, number][] = [];
    if (kind === "car") {
      box(paintMaterial, vehicle, 0, 0.4, 0, 1.3, 0.36, 2.6);
      box(glassMaterial, vehicle, 0, 0.72, 0.1, 1.1, 0.32, 1.2);
      wheels.push([-0.65, -0.85], [0.65, -0.85], [-0.65, 0.85], [0.65, 0.85]);
    } else if (kind === "suv") {
      box(paintMaterial, vehicle, 0, 0.55, 0, 1.5, 0.6, 2.9);
      box(glassMaterial, vehicle, 0, 1.05, 0.25, 1.3, 0.45, 1.7);
      wheels.push([-0.75, -0.95], [0.75, -0.95], [-0.75, 0.95], [0.75, 0.95]);
    } else {
      box(paintMaterial, vehicle, 0, 0.62, -1.25, 1.5, 0.85, 1.0); // cab
      box(glassMaterial, vehicle, 0, 0.95, -1.72, 1.3, 0.35, 0.06);
      box(wallMaterial, vehicle, 0, 0.85, 0.55, 1.6, 1.3, 2.4); // cargo
      wheels.push(
        [-0.78, -1.3], [0.78, -1.3],
        [-0.78, 0.0], [0.78, 0.0],
        [-0.78, 1.3], [0.78, 1.3],
      );
    }
    for (const [wx, wz] of wheels) {
      const tire = new THREE.Mesh(tireGeometry, tireMaterial);
      tire.position.set(wx, 0.2, wz);
      tire.castShadow = true;
      vehicle.add(tire);
    }
    return vehicle;
  };

  for (const [kind, x, z, paint] of PARKING) {
    const vehicle = buildVehicle(kind, paint);
    vehicle.position.set(x, 0, z);
    vehicle.rotation.y = -Math.PI / 2; // nose toward the house
    group.add(vehicle);
    const halfLength = kind === "lorry" ? 1.9 : 1.5;
    colliders.push({
      minX: x - halfLength, maxX: x + halfLength,
      minZ: z - 0.85, maxZ: z + 0.85,
    });
  }

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
