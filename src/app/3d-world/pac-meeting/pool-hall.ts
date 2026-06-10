import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// The mansion pool hall: north wing, east side (x -8..14, z -26..-10).
// Doors: bar at x=-8 (z -13..-11.5), bedroom at z=-10 (x 7..8.5).
// Pool basin x -2..8, z -23..-15 — coping is solid, no swimming yet.
export function buildPoolHall(): RoomBuild {
  const kit = new Kit();

  const tile = kit.material({ color: 0xd8e2e0, roughness: 0.3 });
  const coping = kit.material({ color: 0xb8c2c0, roughness: 0.5 });
  const water = kit.material({
    color: 0x3aa8c9,
    emissive: 0x1a6886,
    emissiveIntensity: 0.35,
    roughness: 0.1,
  });
  const chrome = kit.material({ color: 0xc8d0d4, metalness: 0.85, roughness: 0.2 });
  const teak = kit.material({ color: 0x9a7b52, roughness: 0.6 });
  const white = kit.material({ color: 0xf5f5f0, roughness: 0.6 });

  // 1 tiled floor
  const floorGeometry = kit.track(new THREE.PlaneGeometry(21.4, 15.4).rotateX(-Math.PI / 2));
  const floor = new THREE.Mesh(floorGeometry, tile);
  floor.position.set(3, 0.012, -18);
  floor.receiveShadow = true;
  kit.group.add(floor);

  // 2 the pool: water surface + dark basin rim shadow
  const basinGeometry = kit.track(new THREE.PlaneGeometry(10, 8).rotateX(-Math.PI / 2));
  const deep = kit.material({ color: 0x14506b, roughness: 0.4 });
  const basin = new THREE.Mesh(basinGeometry, deep);
  basin.position.set(3, 0.016, -19);
  kit.group.add(basin);
  const waterGeometry = kit.track(new THREE.PlaneGeometry(9.4, 7.4).rotateX(-Math.PI / 2));
  const waterMesh = new THREE.Mesh(waterGeometry, water);
  waterMesh.position.set(3, 0.05, -19);
  kit.group.add(waterMesh);

  // 3 coping border (solid — keeps the crewmate dry)
  kit.box(coping, 3, 0.07, -23.2, 10.8, 0.14, 0.4, true);
  kit.box(coping, 3, 0.07, -14.8, 10.8, 0.14, 0.4, true);
  kit.box(coping, -2.2, 0.07, -19, 0.4, 0.14, 8.8, true);
  kit.box(coping, 8.2, 0.07, -19, 0.4, 0.14, 8.8, true);

  // 4 lane ropes x2 with float beads
  const beadGeometry = kit.track(new THREE.SphereGeometry(0.05, 8, 8));
  const lane = kit.material({ color: 0xc8332b, roughness: 0.6 });
  for (const lx of [0.5, 5.5]) {
    for (let i = 0; i < 9; i++) {
      kit.mesh(beadGeometry, i % 2 === 0 ? lane : white, lx, 0.06, -22.4 + i * 0.85);
    }
  }

  // 5 chrome ladders x2 (rails + rungs)
  const railGeometry = kit.track(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8));
  const rungGeometry = kit.track(new THREE.CylinderGeometry(0.02, 0.02, 0.34, 8).rotateZ(Math.PI / 2));
  for (const lz of [-22.2, -15.8]) {
    kit.mesh(railGeometry, chrome, 7.95, 0.4, lz - 0.2);
    kit.mesh(railGeometry, chrome, 7.95, 0.4, lz + 0.2);
    for (const ry of [0.2, 0.45]) {
      const rung = kit.mesh(rungGeometry, chrome, 7.95, ry, lz);
      rung.rotation.y = Math.PI / 2;
    }
  }

  // 6 diving board + 7 starting block
  kit.box(chrome, -3.1, 0.3, -19, 0.7, 0.6, 0.7, true);
  kit.box(white, -2.2, 0.62, -19, 2.4, 0.08, 0.5);
  kit.box(coping, 3, 0.25, -23.6, 0.7, 0.5, 0.5, true);

  // 8 loungers x4 along the south side
  for (let i = 0; i < 4; i++) {
    const lounger = new THREE.Group();
    lounger.position.set(-3.5 + i * 3.2, 0, -11.6);
    kit.box(teak, 0, 0.22, 0, 0.7, 0.08, 1.7, false, lounger);
    const back = kit.box(teak, 0, 0.45, -0.72, 0.7, 0.08, 0.66, false, lounger);
    back.rotation.x = -0.55;
    for (const [lx, lz] of [[-0.3, -0.7], [0.3, -0.7], [-0.3, 0.7], [0.3, 0.7]]) {
      kit.box(teak, lx, 0.09, lz, 0.06, 0.18, 0.06, false, lounger);
    }
    kit.group.add(lounger);
    kit.solid(-3.9 + i * 3.2, -3.1 + i * 3.2, -12.55, -10.75);
  }

  // 9 side tables x2 + 10 drinks
  const tableGeometry = kit.track(new THREE.CylinderGeometry(0.25, 0.2, 0.45, 12));
  const drinkGeometry = kit.track(new THREE.CylinderGeometry(0.04, 0.03, 0.12, 10));
  const juice = kit.material({ color: 0xe8a020, roughness: 0.3 });
  for (const tx of [-1.9, 4.5]) {
    kit.mesh(tableGeometry, teak, tx, 0.22, -11.6);
    kit.mesh(drinkGeometry, juice, tx, 0.5, -11.6);
    kit.solid(tx - 0.3, tx + 0.3, -11.9, -11.3);
  }

  // 11 towel rack with towels x3
  kit.box(chrome, 12.8, 0.7, -12, 0.08, 1.4, 1.6, true);
  const towelColors = [0x4a8ab5, 0xf5f5f0, 0xa8b59a];
  towelColors.forEach((color, i) => {
    const towel = kit.material({ color, roughness: 1 });
    kit.box(towel, 12.7, 1.15 - i * 0.32, -12, 0.12, 0.22, 1.3);
  });

  // 12 lifebuoy on the wall + 13 POOL RULES sign
  const buoyGeometry = kit.track(new THREE.TorusGeometry(0.28, 0.08, 10, 24));
  kit.mesh(buoyGeometry, lane, 13.78, 1.5, -18).rotation.y = Math.PI / 2;
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#f0f4f4";
      ctx.fillRect(0, 0, 160, 128);
      ctx.strokeStyle = "#2e6b8a";
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 152, 120);
      ctx.textAlign = "center";
      ctx.fillStyle = "#2e6b8a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("POOL RULES", 80, 30);
      ctx.font = "11px sans-serif";
      ctx.fillText("NO RUNNING", 80, 58);
      ctx.fillText("NO DIVING (SHALLOW)", 80, 80);
      ctx.fillText("TYCOONS SWIM FREE", 80, 102);
    },
    160, 128, 1.0, 0.8, 3, 1.6, -25.82, 0,
  );

  // 14 potted palms x2
  const potGeometry = kit.track(new THREE.CylinderGeometry(0.22, 0.17, 0.35, 12));
  const frondGeometry = kit.track(new THREE.ConeGeometry(0.1, 0.7, 8));
  const terracotta = kit.material({ color: 0xa9573a, roughness: 0.8 });
  const palm = kit.material({ color: 0x4a7a3a, roughness: 0.9 });
  for (const px of [-6.5, 11.5]) {
    kit.mesh(potGeometry, terracotta, px, 0.17, -24.8);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const frond = kit.mesh(
        frondGeometry, palm,
        px + Math.cos(angle) * 0.12, 0.65, -24.8 + Math.sin(angle) * 0.12,
      );
      frond.rotation.set(Math.sin(angle) * 0.5, 0, -Math.cos(angle) * 0.5);
    }
    kit.solid(px - 0.3, px + 0.3, -25.1, -24.5);
  }

  // 15 inflatable ring + 16 beach ball floating, 17 rubber duck
  const ringGeometry = kit.track(new THREE.TorusGeometry(0.3, 0.1, 10, 20).rotateX(Math.PI / 2));
  const pink = kit.material({ color: 0xe26fa8, roughness: 0.4 });
  kit.mesh(ringGeometry, pink, 1.2, 0.1, -17);
  const ballGeometry = kit.track(new THREE.SphereGeometry(0.22, 14, 12));
  const beach = kit.material({ color: 0xe8d44d, roughness: 0.4 });
  kit.mesh(ballGeometry, beach, 5.2, 0.22, -20.8);
  const duckGeometry = kit.track(new THREE.SphereGeometry(0.12, 10, 8));
  const duck = kit.material({ color: 0xf2c10f, roughness: 0.5 });
  kit.mesh(duckGeometry, duck, 3.4, 0.12, -16.4);
  const headGeometry = kit.track(new THREE.SphereGeometry(0.07, 8, 8));
  kit.mesh(headGeometry, duck, 3.48, 0.24, -16.4);

  // 18 depth markers x2 + 19 ceiling light + 20 outdoor shower post
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#e8eeee";
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = "#c8332b";
      ctx.textAlign = "center";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("1.2m", 32, 22);
    },
    64, 32, 0.45, 0.22, -2.41, 0.3, -19, Math.PI / 2,
  );
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#e8eeee";
      ctx.fillRect(0, 0, 64, 32);
      ctx.fillStyle = "#c8332b";
      ctx.textAlign = "center";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("2.4m", 32, 22);
    },
    64, 32, 0.45, 0.22, 8.41, 0.3, -19, -Math.PI / 2,
  );
  const poolLight = new THREE.PointLight(0xbfe8f2, 12, 14, 1.8);
  poolLight.position.set(3, 2.3, -19);
  kit.group.add(poolLight);
  kit.box(chrome, 10.5, 1.1, -23.5, 0.08, 2.2, 0.08, true);
  const showerHeadGeometry = kit.track(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12));
  kit.mesh(showerHeadGeometry, chrome, 10.3, 2.15, -23.5);

  return kit.build();
}
