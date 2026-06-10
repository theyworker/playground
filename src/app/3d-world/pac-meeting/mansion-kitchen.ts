import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// Full chef's kitchen in the NW corner of the main house (x -14..-6,
// z -10..-3). The original counter at (-8.5, -6.5) becomes the island.
export function buildMansionKitchen(): RoomBuild {
  const kit = new Kit();

  const steel = kit.material({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.3 });
  const marble = kit.material({ color: 0xf0ece2, roughness: 0.2 });
  const cabinet = kit.material({ color: 0x3e4a52, roughness: 0.6 });
  const wood = kit.material({ color: 0x8a6b4a, roughness: 0.6 });
  const black = kit.material({ color: 0x1f1f22, roughness: 0.4 });
  const copper = kit.material({ color: 0xb4673a, metalness: 0.7, roughness: 0.35 });
  const white = kit.material({ color: 0xf5f5f0, roughness: 0.5 });

  // 1 fridge (double-door, with handles)
  kit.box(steel, -13.3, 0.95, -8.5, 1.0, 1.9, 0.9, true);
  kit.box(black, -13.28, 1.1, -8.02, 0.04, 1.2, 0.04);
  // 2 counter run along the north wall with cabinet base
  kit.box(cabinet, -10.5, 0.45, -9.35, 3.8, 0.9, 0.85, true);
  kit.box(marble, -10.5, 0.93, -9.35, 3.9, 0.06, 0.95);
  // 3 sink + 4 faucet
  kit.box(steel, -11.8, 0.94, -9.35, 0.6, 0.06, 0.45);
  const faucetGeometry = kit.track(
    new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8),
  );
  kit.mesh(faucetGeometry, steel, -11.8, 1.1, -9.6);
  // 5 stove top + burners
  kit.box(black, -9.6, 0.965, -9.35, 1.0, 0.03, 0.7);
  const burnerGeometry = kit.track(
    new THREE.CylinderGeometry(0.11, 0.11, 0.02, 14),
  );
  for (const [bx, bz] of [[-9.85, -9.5], [-9.35, -9.5], [-9.85, -9.15], [-9.35, -9.15]]) {
    kit.mesh(burnerGeometry, steel, bx, 0.985, bz);
  }
  // 6 extraction hood + 7 oven door
  kit.box(steel, -9.6, 2.0, -9.45, 1.1, 0.55, 0.65);
  kit.box(black, -9.6, 0.5, -9.0, 0.85, 0.5, 0.05);
  // 8 upper cabinets x3
  for (const cx of [-12.6, -11.4, -8.4]) {
    kit.box(cabinet, cx, 1.85, -9.6, 1.1, 0.6, 0.4);
  }
  // 9 open shelf with 10 jars and 11 plate stack
  kit.box(wood, -7.2, 1.6, -9.6, 0.9, 0.05, 0.35);
  const jarGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10));
  for (let i = 0; i < 3; i++) {
    kit.mesh(jarGeometry, copper, -7.45 + i * 0.22, 1.7, -9.6);
  }
  const plateGeometry = kit.track(new THREE.CylinderGeometry(0.12, 0.12, 0.015, 16));
  for (let i = 0; i < 4; i++) {
    kit.mesh(plateGeometry, white, -10.9, 0.97 + i * 0.018, -9.3);
  }
  // 12 pot and 13 pan on the stove
  const potGeometry = kit.track(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 14));
  kit.mesh(potGeometry, steel, -9.85, 1.06, -9.5);
  const panGeometry = kit.track(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 14));
  kit.mesh(panGeometry, black, -9.35, 1.01, -9.15);
  const handleGeometry = kit.track(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6).rotateZ(Math.PI / 2));
  kit.mesh(handleGeometry, black, -9.12, 1.01, -9.15);
  // 14 kettle, 15 toaster, 16 microwave, 17 knife block, 18 cutting board
  const kettleGeometry = kit.track(new THREE.SphereGeometry(0.09, 12, 10));
  kit.mesh(kettleGeometry, copper, -12.4, 1.03, -9.4);
  kit.box(steel, -8.3, 1.03, -9.4, 0.3, 0.18, 0.22);
  kit.box(black, -12.95, 1.1, -9.35, 0.45, 0.28, 0.35);
  const knifeBlock = kit.box(wood, -11.25, 1.06, -9.45, 0.14, 0.2, 0.1);
  knifeBlock.rotation.z = 0.18;
  kit.box(wood, -10.45, 0.97, -9.25, 0.35, 0.02, 0.25);
  // 19 island stools x3 (the island itself lives in house.ts)
  const stoolGeometry = kit.track(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 12));
  for (const sx of [-9.4, -8.5, -7.6]) {
    kit.mesh(stoolGeometry, wood, sx, 0.25, -5.25);
  }
  kit.solid(-9.7, -7.3, -5.5, -5.0);
  // 20 fruit bowl + 21 fruit
  const bowlGeometry = kit.track(new THREE.CylinderGeometry(0.16, 0.1, 0.09, 14));
  kit.mesh(bowlGeometry, white, -8.5, 0.85, -6.5);
  const fruitGeometry = kit.track(new THREE.SphereGeometry(0.05, 10, 8));
  const fruitColors = [0xc8332b, 0xe8a020, 0x6fa83a];
  fruitColors.forEach((color, i) => {
    const fruit = kit.material({ color, roughness: 0.5 });
    kit.mesh(fruitGeometry, fruit, -8.58 + i * 0.08, 0.92, -6.5 + (i % 2) * 0.06);
  });
  // 22 pendant lights x2 over the island
  const shadeGeometry = kit.track(new THREE.ConeGeometry(0.14, 0.16, 12));
  const glow = kit.material({
    color: 0x2c2c30,
    emissive: 0xffd9a0,
    emissiveIntensity: 0.8,
  });
  for (const px of [-9.1, -7.9]) {
    kit.box(black, px, 2.0, -6.5, 0.02, 0.8, 0.02);
    kit.mesh(shadeGeometry, glow, px, 1.55, -6.5);
  }
  // 23 wall clock + 24 kitchen runner rug
  const clockGeometry = kit.track(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 18).rotateX(Math.PI / 2));
  kit.mesh(clockGeometry, white, -12.0, 1.9, -9.78);
  const rugGeometry = kit.track(new THREE.PlaneGeometry(3.2, 0.9).rotateX(-Math.PI / 2));
  const rugMaterial = kit.material({ color: 0x7a4a3a, roughness: 1 });
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.position.set(-10.5, 0.014, -7.9);
  rug.receiveShadow = true;
  kit.group.add(rug);

  return kit.build();
}
