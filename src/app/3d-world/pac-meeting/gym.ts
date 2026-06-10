import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// The mansion gym: west wing, south half (x -30..-14, z 0..10).
// Door from the living room at x=-14 (z 1..2.5), door to the tennis
// court at x=-30 (z 5..6.5).
export function buildGym(): RoomBuild {
  const kit = new Kit();

  const rubber = kit.material({ color: 0x2e3136, roughness: 0.95 });
  const steel = kit.material({ color: 0x8a8f96, metalness: 0.7, roughness: 0.35 });
  const black = kit.material({ color: 0x1c1c20, roughness: 0.5 });
  const red = kit.material({ color: 0xb33a3a, roughness: 0.6 });
  const mirror = kit.material({
    color: 0xd6e4e8,
    emissive: 0x9ab4ba,
    emissiveIntensity: 0.3,
    roughness: 0.05,
    metalness: 0.45,
  });
  const wood = kit.material({ color: 0xc9ae85, roughness: 0.6 });

  // 1 rubber gym floor
  const matGeometry = kit.track(new THREE.PlaneGeometry(15.4, 9.4).rotateX(-Math.PI / 2));
  const gymFloor = new THREE.Mesh(matGeometry, rubber);
  gymFloor.position.set(-22, 0.012, 5);
  gymFloor.receiveShadow = true;
  kit.group.add(gymFloor);

  // 2 mirror wall panels x3 on the south wall
  for (const mx of [-26, -22, -18]) {
    kit.box(black, mx, 1.2, 9.78, 3.0, 1.9, 0.06);
    kit.box(mirror, mx, 1.2, 9.74, 2.85, 1.75, 0.04);
  }

  // 3-4 treadmills x2 (deck, belt, rails, console)
  for (const tz of [2.2, 4.6]) {
    kit.box(black, -28.2, 0.18, tz, 0.85, 0.18, 2.0, true);
    kit.box(rubber, -28.2, 0.28, tz + 0.2, 0.6, 0.04, 1.5);
    kit.box(steel, -28.5, 0.7, tz - 0.85, 0.05, 0.85, 0.05);
    kit.box(steel, -27.9, 0.7, tz - 0.85, 0.05, 0.85, 0.05);
    kit.box(black, -28.2, 1.15, tz - 0.85, 0.7, 0.3, 0.1);
  }

  // 5 dumbbell rack + 6 dumbbells x6
  kit.box(steel, -26.5, 0.4, 0.65, 2.0, 0.12, 0.5, true);
  kit.box(steel, -27.4, 0.2, 0.65, 0.08, 0.4, 0.45);
  kit.box(steel, -25.6, 0.2, 0.65, 0.08, 0.4, 0.45);
  const bellGeometry = kit.track(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10).rotateZ(Math.PI / 2));
  const barGeometry = kit.track(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8).rotateZ(Math.PI / 2));
  for (let i = 0; i < 6; i++) {
    const x = -27.2 + i * 0.28;
    kit.mesh(barGeometry, steel, x, 0.52, 0.65);
    kit.mesh(bellGeometry, black, x - 0.1, 0.52, 0.65);
    kit.mesh(bellGeometry, black, x + 0.1, 0.52, 0.65);
  }

  // 7 bench press: bench + uprights + barbell with plates
  kit.box(red, -23.5, 0.45, 6.8, 0.45, 0.12, 1.5, true);
  kit.box(steel, -23.5, 0.2, 6.2, 0.35, 0.4, 0.08);
  kit.box(steel, -23.5, 0.2, 7.4, 0.35, 0.4, 0.08);
  kit.box(steel, -24.2, 0.6, 6.3, 0.08, 1.2, 0.08, true);
  kit.box(steel, -22.8, 0.6, 6.3, 0.08, 1.2, 0.08, true);
  const longBarGeometry = kit.track(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8).rotateZ(Math.PI / 2));
  kit.mesh(longBarGeometry, steel, -23.5, 1.18, 6.3);
  const plateGeometry = kit.track(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16).rotateZ(Math.PI / 2));
  for (const px of [-24.5, -24.4, -22.6, -22.5]) {
    kit.mesh(plateGeometry, black, px, 1.18, 6.3);
  }

  // 8 squat rack
  kit.box(steel, -21, 1.0, 1.0, 0.1, 2.0, 0.1, true);
  kit.box(steel, -19.8, 1.0, 1.0, 0.1, 2.0, 0.1, true);
  kit.box(steel, -20.4, 1.95, 1.0, 1.4, 0.1, 0.1);
  kit.mesh(longBarGeometry, steel, -20.4, 1.35, 1.0);

  // 9 exercise bike
  kit.box(red, -17.5, 0.5, 2.6, 0.18, 0.5, 1.0, true);
  kit.box(black, -17.5, 0.95, 2.2, 0.3, 0.12, 0.3);
  kit.box(steel, -17.5, 1.05, 3.0, 0.4, 0.08, 0.08);
  const wheelGeometry = kit.track(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 16).rotateZ(Math.PI / 2));
  kit.mesh(wheelGeometry, black, -17.5, 0.35, 2.9);

  // 10 rowing machine
  const rower = kit.box(black, -16.8, 0.16, 6.5, 0.3, 0.1, 2.2, true);
  rower.rotation.y = 0.3;
  kit.box(steel, -17.1, 0.35, 5.6, 0.35, 0.3, 0.35);
  kit.box(black, -16.6, 0.3, 7.0, 0.28, 0.08, 0.28);

  // 11 kettlebells x3 + 12 medicine balls x2
  const kettleGeometry = kit.track(new THREE.SphereGeometry(0.12, 12, 10));
  for (let i = 0; i < 3; i++) {
    kit.mesh(kettleGeometry, black, -24.5 + i * 0.35, 0.12, 0.7);
  }
  const medGeometry = kit.track(new THREE.SphereGeometry(0.17, 14, 10));
  kit.mesh(medGeometry, red, -15.2, 0.17, 8.8);
  kit.mesh(medGeometry, black, -14.8, 0.17, 8.3);

  // 13 yoga mats x2 rolled in the corner
  const yogaGeometry = kit.track(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12));
  const sage = kit.material({ color: 0xa8b59a, roughness: 0.9 });
  for (let i = 0; i < 2; i++) {
    const yogaMat = kit.mesh(yogaGeometry, sage, -29.3, 0.08 + i * 0.16, 8.9);
    yogaMat.rotation.z = Math.PI / 2;
  }

  // 14 water cooler + 15 towel shelf with towels
  kit.box(steel, -14.6, 0.55, 8.9, 0.4, 1.1, 0.4, true);
  const jugGeometry = kit.track(new THREE.CylinderGeometry(0.14, 0.14, 0.3, 12));
  const blue = kit.material({ color: 0x4a8ab5, roughness: 0.3 });
  kit.mesh(jugGeometry, blue, -14.6, 1.25, 8.9);
  kit.box(wood, -14.4, 1.1, 0.4, 0.5, 0.05, 0.6);
  const towelColors = [0xf5f5f0, 0xa8b59a, 0x4a8ab5];
  towelColors.forEach((color, i) => {
    const towel = kit.material({ color, roughness: 1 });
    kit.box(towel, -14.4, 1.16 + i * 0.05, 0.4, 0.4, 0.05, 0.5);
  });

  // 16 wall fan + 17 wall clock
  const fanGeometry = kit.track(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16).rotateX(Math.PI / 2));
  kit.mesh(fanGeometry, steel, -25, 2.1, 0.25);
  const clockGeometry = kit.track(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 18).rotateX(Math.PI / 2));
  const white = kit.material({ color: 0xf5f5f0, roughness: 0.4 });
  kit.mesh(clockGeometry, white, -18, 2.1, 0.25);

  // 18 motivational poster
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#1c1c20";
      ctx.fillRect(0, 0, 192, 96);
      ctx.textAlign = "center";
      ctx.fillStyle = "#e8e2d4";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("TRAIN.", 96, 44);
      ctx.fillStyle = "#b33a3a";
      ctx.font = "12px sans-serif";
      ctx.fillText("THE TYCOON WAY", 96, 70);
    },
    192, 96, 1.4, 0.7, -29.82, 1.6, 3.2, Math.PI / 2,
  );

  // 19 plate tree + 20 resistance band pegs
  kit.box(steel, -15.5, 0.6, 4.5, 0.1, 1.2, 0.1, true);
  for (const py of [0.4, 0.8]) {
    kit.mesh(plateGeometry, black, -15.5, py, 4.62);
  }
  const bandColors = [0xe8a020, 0x6fa83a];
  bandColors.forEach((color, i) => {
    const band = kit.material({ color, roughness: 0.8 });
    kit.box(band, -14.25, 1.5 + i * 0.25, 6.5, 0.05, 0.18, 0.3);
  });

  return kit.build();
}
