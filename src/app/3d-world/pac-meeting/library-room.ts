import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// The mansion library: west wing, north half (x -30..-14, z -10..0).
// Doors: living room at x=-14 (z -6..-4.5), bar at z=-10 (x -26..-24.5).
export function buildLibraryRoom(): RoomBuild {
  const kit = new Kit();

  const walnut = kit.material({ color: 0x5a4030, roughness: 0.55 });
  const leather = kit.material({ color: 0x6b3a2a, roughness: 0.7 });
  const brass = kit.material({ color: 0xb89554, metalness: 0.8, roughness: 0.3 });
  const cream = kit.material({ color: 0xe8e0cc, roughness: 0.9 });
  const black = kit.material({ color: 0x221e1a, roughness: 0.6 });

  const bookColors = [0x7a2e2e, 0x2e4a7a, 0x3a6b3a, 0x9a7b2e, 0x5a3a6b].map(
    (color) => kit.material({ color, roughness: 0.8 }),
  );

  // 1-5 tall bookcases with books (deterministic fills)
  const addBookcase = (x: number, z: number, rotationY: number) => {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(x, 0, z);
    shelfGroup.rotation.y = rotationY;
    kit.box(walnut, 0, 1.1, 0, 2.2, 2.2, 0.45, false, shelfGroup);
    for (const shelfY of [0.45, 1.05, 1.65]) {
      let bookX = -0.9;
      let i = 0;
      while (bookX < 0.85) {
        const width = 0.11 + ((i * 7) % 5) * 0.02;
        const height = 0.36 + ((i * 3) % 4) * 0.04;
        kit.box(
          bookColors[i % bookColors.length],
          bookX + width / 2, shelfY + height / 2, 0.24,
          width, height, 0.2, false, shelfGroup,
        );
        bookX += width + 0.02;
        i++;
      }
    }
    kit.group.add(shelfGroup);
    const horizontal = Math.abs(Math.sin(rotationY)) < 0.5;
    kit.solid(
      x - (horizontal ? 1.1 : 0.25), x + (horizontal ? 1.1 : 0.25),
      z - (horizontal ? 0.25 : 1.1), z + (horizontal ? 0.25 : 1.1),
    );
  };
  addBookcase(-29.6, -7.5, Math.PI / 2);
  addBookcase(-29.6, -4.9, Math.PI / 2);
  addBookcase(-29.6, -2.3, Math.PI / 2);
  addBookcase(-22.5, -9.6, 0);
  addBookcase(-20, -9.6, 0);

  // 6 rolling ladder leaning on the west shelves
  const ladder = new THREE.Group();
  ladder.position.set(-29.2, 0, -6.2);
  ladder.rotation.z = 0.25;
  kit.box(walnut, 0.05, 1.1, -0.25, 0.06, 2.3, 0.06, false, ladder);
  kit.box(walnut, 0.05, 1.1, 0.25, 0.06, 2.3, 0.06, false, ladder);
  for (let i = 0; i < 5; i++) {
    kit.box(walnut, 0.05, 0.35 + i * 0.45, 0, 0.05, 0.05, 0.5, false, ladder);
  }
  kit.group.add(ladder);

  // 7 fireplace with glowing embers + 8 mantel + 9 candlesticks x2
  kit.box(cream, -20.5, 0.85, -0.28, 2.2, 1.7, 0.45, true);
  kit.box(black, -20.5, 0.55, -0.05, 1.1, 1.1, 0.1);
  const ember = kit.material({
    color: 0x3a1a08,
    emissive: 0xd96a2e,
    emissiveIntensity: 1.1,
  });
  kit.box(ember, -20.5, 0.25, -0.04, 0.9, 0.4, 0.08);
  kit.box(walnut, -20.5, 1.78, -0.18, 2.4, 0.12, 0.6);
  const candleGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8));
  kit.mesh(candleGeometry, brass, -21.3, 1.95, -0.2);
  kit.mesh(candleGeometry, brass, -19.7, 1.95, -0.2);
  const fireLight = new THREE.PointLight(0xff9a4a, 5, 6, 2);
  fireLight.position.set(-20.5, 0.6, -1);
  kit.group.add(fireLight);

  // 10-11 leather wingback chairs x2 facing the fire
  for (const [cx, rot] of [[-22.3, 0.5], [-18.7, -0.5]] as const) {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, -2.6);
    chair.rotation.y = rot;
    kit.box(leather, 0, 0.35, 0, 0.8, 0.3, 0.75, false, chair);
    kit.box(leather, 0, 0.75, 0.32, 0.8, 0.85, 0.18, false, chair);
    kit.box(leather, -0.36, 0.55, 0, 0.12, 0.35, 0.7, false, chair);
    kit.box(leather, 0.36, 0.55, 0, 0.12, 0.35, 0.7, false, chair);
    kit.group.add(chair);
    kit.solid(cx - 0.45, cx + 0.45, -3.05, -2.15);
  }

  // 12 side table + 13 reading lamp + 14 teacup
  kit.box(walnut, -20.5, 0.3, -2.9, 0.5, 0.6, 0.5, true);
  const poleGeometry = kit.track(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8));
  kit.mesh(poleGeometry, brass, -20.5, 0.85, -2.9);
  const shadeGeometry = kit.track(new THREE.ConeGeometry(0.13, 0.16, 12));
  const lampGlow = kit.material({
    color: 0xe8dcc0,
    emissive: 0xffe2b0,
    emissiveIntensity: 0.9,
  });
  kit.mesh(shadeGeometry, lampGlow, -20.5, 1.12, -2.9);
  const cupGeometry = kit.track(new THREE.CylinderGeometry(0.04, 0.03, 0.05, 10));
  kit.mesh(cupGeometry, cream, -20.3, 0.63, -2.75);

  // 15 writing desk + 16 chair + 17 open book + 18 inkwell
  kit.box(walnut, -16, 0.4, -8.6, 1.6, 0.08, 0.8);
  for (const [lx, lz] of [[-16.7, -8.9], [-15.3, -8.9], [-16.7, -8.3], [-15.3, -8.3]]) {
    kit.box(walnut, lx, 0.2, lz, 0.07, 0.4, 0.07);
  }
  kit.solid(-16.85, -15.15, -9.05, -8.15);
  kit.box(leather, -16, 0.3, -7.6, 0.5, 0.6, 0.5, true);
  const pageLeft = kit.box(cream, -16.15, 0.46, -8.6, 0.24, 0.02, 0.32);
  pageLeft.rotation.z = 0.06;
  const pageRight = kit.box(cream, -15.88, 0.46, -8.6, 0.24, 0.02, 0.32);
  pageRight.rotation.z = -0.06;
  const inkGeometry = kit.track(new THREE.CylinderGeometry(0.035, 0.045, 0.07, 10));
  kit.mesh(inkGeometry, black, -16.55, 0.48, -8.75);

  // 19 globe on stand + 20 marble bust on pedestal
  const standGeometry = kit.track(new THREE.CylinderGeometry(0.04, 0.22, 0.7, 12));
  kit.mesh(standGeometry, walnut, -15, -0 + 0.35, -2.2);
  const globeGeometry = kit.track(new THREE.SphereGeometry(0.26, 18, 14));
  const globe = kit.material({ color: 0x3a6b8a, roughness: 0.4 });
  kit.mesh(globeGeometry, globe, -15, 0.95, -2.2);
  kit.solid(-15.3, -14.7, -2.5, -1.9);
  kit.box(cream, -27.5, 0.55, -9.5, 0.45, 1.1, 0.45, true);
  const bustGeometry = kit.track(new THREE.SphereGeometry(0.14, 12, 10));
  kit.mesh(bustGeometry, cream, -27.5, 1.28, -9.5);
  kit.box(cream, -27.5, 1.13, -9.5, 0.3, 0.12, 0.18);

  // 21 persian rug + 22 floor book stacks x2 + 23 chandelier
  const rugGeometry = kit.track(new THREE.PlaneGeometry(4.6, 3.2).rotateX(-Math.PI / 2));
  const rugMaterial = kit.material({ color: 0x6b2a2a, roughness: 1 });
  const rug = new THREE.Mesh(rugGeometry, rugMaterial);
  rug.position.set(-20.5, 0.013, -3.2);
  rug.receiveShadow = true;
  kit.group.add(rug);
  for (let i = 0; i < 3; i++) {
    kit.box(bookColors[i % bookColors.length], -23.6, 0.04 + i * 0.07, -6.1, 0.3, 0.06, 0.22);
    kit.box(bookColors[(i + 2) % bookColors.length], -17.2, 0.04 + i * 0.07, -5.3, 0.28, 0.06, 0.2);
  }
  const chandelier = new THREE.Group();
  chandelier.position.set(-21, 2.2, -4.5);
  kit.box(brass, 0, 0, 0, 0.06, 0.5, 0.06, false, chandelier);
  const armGeometry = kit.track(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8).rotateZ(Math.PI / 2));
  const candleGlow = kit.material({
    color: 0xb89554,
    emissive: 0xffd9a0,
    emissiveIntensity: 1,
  });
  for (const rot of [0, Math.PI / 3, (Math.PI * 2) / 3]) {
    const arm = kit.mesh(armGeometry, brass, 0, -0.2, 0, chandelier);
    arm.rotation.y = rot;
    const bulbGeometry = kit.track(new THREE.SphereGeometry(0.045, 8, 8));
    kit.mesh(bulbGeometry, candleGlow, Math.cos(rot) * 0.4, -0.12, -Math.sin(rot) * 0.4, chandelier);
    kit.mesh(bulbGeometry, candleGlow, -Math.cos(rot) * 0.4, -0.12, Math.sin(rot) * 0.4, chandelier);
  }
  kit.group.add(chandelier);

  return kit.build();
}
