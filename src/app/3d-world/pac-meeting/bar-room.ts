import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// The mansion bar: north wing, west side (x -30..-8, z -26..-10).
// Doors: library at z=-10 (x -26..-24.5), pool hall at x=-8 (z -13..-11.5).
export function buildBarRoom(): RoomBuild {
  const kit = new Kit();

  const walnut = kit.material({ color: 0x4a3424, roughness: 0.5 });
  const darkFloor = kit.material({ color: 0x33271c, roughness: 0.8 });
  const brass = kit.material({ color: 0xb89554, metalness: 0.8, roughness: 0.3 });
  const leather = kit.material({ color: 0x7a2e2e, roughness: 0.7 });
  const black = kit.material({ color: 0x1c1c20, roughness: 0.5 });
  const felt = kit.material({ color: 0x2e6b4a, roughness: 0.95 });
  const mirror = kit.material({
    color: 0xd6e4e8,
    emissive: 0x9ab4ba,
    emissiveIntensity: 0.25,
    roughness: 0.05,
    metalness: 0.45,
  });

  // 1 dark walnut floor
  const floorGeometry = kit.track(new THREE.PlaneGeometry(21.4, 15.4).rotateX(-Math.PI / 2));
  const floor = new THREE.Mesh(floorGeometry, darkFloor);
  floor.position.set(-19, 0.012, -18);
  floor.receiveShadow = true;
  kit.group.add(floor);

  // 2 bar counter with brass foot rail
  kit.box(walnut, -10.8, 0.55, -18, 1.0, 1.1, 7.5, true);
  kit.box(brass, -11.4, 0.12, -18, 0.05, 0.05, 7.2);
  kit.box(walnut, -10.75, 1.12, -18, 1.3, 0.06, 7.8);

  // 3 back bar: mirror + two shelves of bottles (x12)
  kit.box(mirror, -8.2, 1.5, -18, 0.04, 1.4, 7.0);
  kit.box(walnut, -8.45, 1.1, -18, 0.35, 0.05, 7.0);
  kit.box(walnut, -8.45, 1.7, -18, 0.35, 0.05, 7.0);
  const bottleGeometry = kit.track(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 10));
  const bottleColors = [0x3a6b2e, 0x6b2e2e, 0xb8862e, 0x2e3a6b, 0x6b5a2e, 0x4a2e6b];
  for (let i = 0; i < 12; i++) {
    const bottle = kit.material({
      color: bottleColors[i % bottleColors.length],
      roughness: 0.2,
      metalness: 0.1,
    });
    const shelfY = i < 6 ? 1.27 : 1.87;
    kit.mesh(bottleGeometry, bottle, -8.45, shelfY, -20.8 + (i % 6) * 1.1);
  }

  // 4 beer taps x2 + 5 glasses x3 + 6 shaker + 7 ice bucket on the counter
  const tapGeometry = kit.track(new THREE.CylinderGeometry(0.025, 0.035, 0.28, 8));
  kit.mesh(tapGeometry, brass, -10.75, 1.3, -19.4);
  kit.mesh(tapGeometry, brass, -10.75, 1.3, -19.0);
  const glassGeometry = kit.track(new THREE.CylinderGeometry(0.045, 0.035, 0.12, 10));
  const glassMaterial = kit.material({ color: 0xd8e8e8, roughness: 0.1, metalness: 0.2 });
  for (let i = 0; i < 3; i++) {
    kit.mesh(glassGeometry, glassMaterial, -10.7, 1.21, -16.6 + i * 0.35);
  }
  const shakerGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10));
  kit.mesh(shakerGeometry, brass, -10.8, 1.25, -17.6);
  const bucketGeometry = kit.track(new THREE.CylinderGeometry(0.11, 0.08, 0.14, 12));
  kit.mesh(bucketGeometry, brass, -10.8, 1.22, -15.4);

  // 8 bar stools x4
  const stoolSeatGeometry = kit.track(new THREE.CylinderGeometry(0.19, 0.19, 0.08, 12));
  const stoolPostGeometry = kit.track(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 8));
  for (let i = 0; i < 4; i++) {
    const sz = -21 + i * 2;
    kit.mesh(stoolPostGeometry, black, -12.4, 0.33, sz);
    kit.mesh(stoolSeatGeometry, leather, -12.4, 0.7, sz);
    kit.solid(-12.65, -12.15, sz - 0.25, sz + 0.25);
  }

  // 9 pendant lights x3 over the counter
  const shadeGeometry = kit.track(new THREE.ConeGeometry(0.16, 0.18, 12));
  const glow = kit.material({
    color: 0x2c2c30,
    emissive: 0xffc878,
    emissiveIntensity: 1,
  });
  for (let i = 0; i < 3; i++) {
    const pz = -20.5 + i * 2.5;
    kit.box(black, -11.2, 2.05, pz, 0.02, 0.7, 0.02);
    kit.mesh(shadeGeometry, glow, -11.2, 1.62, pz);
  }
  const barLight = new THREE.PointLight(0xffc878, 10, 10, 2);
  barLight.position.set(-11.5, 1.9, -18);
  kit.group.add(barLight);

  // 10 neon BAR sign above the back bar
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#14080a";
      ctx.fillRect(0, 0, 192, 64);
      ctx.textAlign = "center";
      ctx.strokeStyle = "#ff4a6b";
      ctx.lineWidth = 2;
      ctx.font = "bold 38px sans-serif";
      ctx.strokeText("B A R", 96, 45);
      ctx.fillStyle = "#ffb8c8";
      ctx.fillText("B A R", 96, 45);
    },
    192, 64, 1.6, 0.55, -8.18, 2.35, -18, -Math.PI / 2,
  );

  // 11 pool table: bed, rails, legs, 12 balls x3, 13 cue
  kit.box(walnut, -18.5, 0.62, -18, 2.6, 0.18, 1.5);
  kit.box(felt, -18.5, 0.72, -18, 2.3, 0.04, 1.2);
  for (const [lx, lz] of [[-19.6, -18.6], [-17.4, -18.6], [-19.6, -17.4], [-17.4, -17.4]]) {
    kit.box(walnut, lx, 0.28, lz, 0.14, 0.56, 0.14);
  }
  kit.solid(-19.9, -17.1, -18.85, -17.15);
  const ballGeometry = kit.track(new THREE.SphereGeometry(0.04, 10, 8));
  const ballColors = [0xf5f5f0, 0xc8332b, 0x1c1c20];
  ballColors.forEach((color, i) => {
    const ball = kit.material({ color, roughness: 0.2 });
    kit.mesh(ballGeometry, ball, -18.8 + i * 0.25, 0.78, -18.1 + (i % 2) * 0.18);
  });
  const cueGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.02, 1.5, 8));
  const cue = kit.mesh(cueGeometry, walnut, -20.1, 0.75, -16.5);
  cue.rotation.z = 1.25;

  // 14 dartboard on the west wall
  const boardGeometry = kit.track(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18).rotateZ(Math.PI / 2));
  kit.mesh(boardGeometry, black, -29.75, 1.6, -14);
  const ringGeometry = kit.track(new THREE.TorusGeometry(0.18, 0.02, 8, 24).rotateY(Math.PI / 2));
  const red = kit.material({ color: 0xc8332b, roughness: 0.6 });
  kit.mesh(ringGeometry, red, -29.7, 1.6, -14);

  // 15 wine rack with bottles x4 on the north wall
  kit.box(walnut, -26, 1.1, -25.6, 1.2, 1.0, 0.35, true);
  const wineGeometry = kit.track(new THREE.CylinderGeometry(0.045, 0.045, 0.32, 10).rotateX(Math.PI / 2));
  const wine = kit.material({ color: 0x3a1a2e, roughness: 0.25 });
  for (let i = 0; i < 4; i++) {
    kit.mesh(wineGeometry, wine, -26.45 + (i % 2) * 0.9, 0.9 + Math.floor(i / 2) * 0.35, -25.55);
  }

  // 16-17 lounge armchairs x2 + 18 low table with 19 whisky glasses
  for (const [cx, rot] of [[-26.5, 0.8], [-23.5, -0.8]] as const) {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, -21.5);
    chair.rotation.y = rot;
    kit.box(leather, 0, 0.32, 0, 0.85, 0.28, 0.8, false, chair);
    kit.box(leather, 0, 0.68, 0.34, 0.85, 0.7, 0.18, false, chair);
    kit.group.add(chair);
    kit.solid(cx - 0.5, cx + 0.5, -22, -21);
  }
  kit.box(walnut, -25, 0.25, -22.6, 0.9, 0.5, 0.9, true);
  kit.mesh(glassGeometry, glassMaterial, -25.15, 0.56, -22.6);
  kit.mesh(glassGeometry, glassMaterial, -24.85, 0.56, -22.45);

  // 20 rug under the lounge
  const rugGeometry = kit.track(new THREE.PlaneGeometry(4.4, 3).rotateX(-Math.PI / 2));
  const rugMaterial = kit.material({ color: 0x5a2e2e, roughness: 1 });
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.position.set(-25, 0.014, -22);
  rug.receiveShadow = true;
  kit.group.add(rug);

  return kit.build();
}
