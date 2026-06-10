import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";
import { drawPoster, drawWadxSign, POSTERS } from "./wadx-art";

// WADX CELPIP Preparation Academy: x -32..-8, z 50..63, on the south
// side of the branch road. Six rooms: reception (center-north),
// listening lab (NW), reading room (NE), speaking studio (SW),
// writing hall (S-center), staff office (SE). 150+ test-center props.
const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

export function buildWadx(): RoomBuild {
  const kit = new Kit();

  const wallMaterial = kit.material({ color: 0xcfd4d8, roughness: 0.9 });
  const carpet = kit.material({ color: 0x4a5a6b, roughness: 1 });
  const deskMaterial = kit.material({ color: 0xd8cdb8, roughness: 0.6 });
  const darkDesk = kit.material({ color: 0x5a6470, roughness: 0.6 });
  const chairMaterial = kit.material({ color: 0x35508a, roughness: 0.7 });
  const black = kit.material({ color: 0x1f2226, roughness: 0.4 });
  const screenMaterial = kit.material({
    color: 0x9ecbe8,
    emissive: 0x4a8ab5,
    emissiveIntensity: 0.5,
  });
  const paper = kit.material({ color: 0xf5f2e8, roughness: 0.9 });
  const orange = kit.material({ color: 0xe8633a, roughness: 0.6 });
  const steel = kit.material({ color: 0x8a9098, metalness: 0.6, roughness: 0.4 });

  const wall = (x: number, z: number, w: number, d: number) =>
    kit.box(wallMaterial, x, WALL_HEIGHT / 2, z, w, WALL_HEIGHT, d, true);

  // --- Shell: carpet floor + outer walls (main door gap x -21..-19) ---
  const floorGeometry = kit.track(new THREE.PlaneGeometry(24, 13).rotateX(-Math.PI / 2));
  const floor = new THREE.Mesh(floorGeometry, carpet);
  floor.position.set(-20, 0.008, 56.5);
  floor.receiveShadow = true;
  kit.group.add(floor);

  wall(-26.5, 50, 11, WALL_THICKNESS); // north, west of door
  wall(-13.5, 50, 11, WALL_THICKNESS); // north, east of door
  wall(-20, 63, 24, WALL_THICKNESS); // south
  wall(-32, 56.5, WALL_THICKNESS, 13); // west
  wall(-8, 56.5, WALL_THICKNESS, 13); // east
  // Interior: listening | reception | reading (door gaps z 52.5..54).
  wall(-24, 51.25, WALL_THICKNESS, 2.5);
  wall(-24, 55, WALL_THICKNESS, 2);
  wall(-16, 51.25, WALL_THICKNESS, 2.5);
  wall(-16, 55, WALL_THICKNESS, 2);
  // Cross wall z=56 with gaps at x -29..-27.5, -21..-19.5, -12..-10.5.
  wall(-30.5, 56, 3, WALL_THICKNESS);
  wall(-24.25, 56, 6.5, WALL_THICKNESS);
  wall(-15.75, 56, 7.5, WALL_THICKNESS);
  wall(-9.25, 56, 2.5, WALL_THICKNESS);
  // Speaking | writing and writing | office dividers.
  wall(-25, 59.5, WALL_THICKNESS, 7);
  wall(-15, 59.5, WALL_THICKNESS, 7);

  // Entrance path + WADX sign over the door.
  const pathGeometry = kit.track(new THREE.PlaneGeometry(2, 1.2).rotateX(-Math.PI / 2));
  const pathMaterial = kit.material({ color: 0x8d8478, roughness: 0.9 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(-20, 0.004, 49.6);
  path.receiveShadow = true;
  kit.group.add(path);
  kit.canvasPlane(drawWadxSign, 256, 64, 2.6, 0.65, -20, 2.1, 49.83, Math.PI);

  // --- CELPIP instruction posters pasted around the center ---
  const poster = (index: number, x: number, y: number, z: number, rotationY: number) =>
    kit.canvasPlane((ctx) => drawPoster(ctx, POSTERS[index]), 192, 128, 1.05, 0.7, x, y, z, rotationY);
  poster(0, -28, 1.5, 50.18, 0); // listening rules in the lab
  poster(8, -31.82, 1.5, 53, Math.PI / 2); // computer-delivered, lab west
  poster(1, -12, 1.5, 50.18, 0); // reading rules in reading room
  poster(7, -8.18, 1.5, 53, -Math.PI / 2); // scores, reading east wall
  poster(2, -20, 1.5, 56.18, 0); // writing rules in the hall
  poster(3, -31.82, 1.5, 59.5, Math.PI / 2); // speaking rules in studio
  poster(4, -23.5, 1.5, 50.18, 0); // test day rules at reception
  poster(5, -16.5, 1.5, 50.18, 0); // no phones at reception
  poster(6, -24.82, 1.5, 59.5, -Math.PI / 2); // quiet please in writing hall

  // --- Reception (x -24..-16, z 50..56): ~30 items ---
  kit.box(darkDesk, -20, 0.55, 52, 2.6, 1.1, 0.9, true); // counter
  kit.box(deskMaterial, -20, 1.13, 52, 2.8, 0.06, 1.1); // counter top
  kit.box(black, -20.6, 1.35, 52, 0.5, 0.38, 0.05); // monitor
  kit.box(black, -20.6, 1.18, 52, 0.12, 0.1, 0.12); // monitor stand
  kit.box(orange, -19.5, 1.2, 52, 0.18, 0.08, 0.12); // desk bell
  const penCupGeometry = kit.track(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8));
  kit.mesh(penCupGeometry, black, -19.1, 1.22, 52);
  kit.box(black, -20, 1.18, 51.7, 0.3, 0.06, 0.2); // phone
  kit.box(paper, -19.6, 1.17, 52.3, 0.25, 0.01, 0.32); // sign-in sheet
  for (let i = 0; i < 6; i++) { // waiting chairs
    const wx = -23.2 + (i % 3) * 1.0;
    const wz = 54 + Math.floor(i / 3) * 1.2;
    kit.box(chairMaterial, wx, 0.25, wz, 0.5, 0.5, 0.5, true);
    kit.box(chairMaterial, wx, 0.65, wz + 0.22, 0.5, 0.4, 0.08);
  }
  kit.box(deskMaterial, -17.2, 0.22, 54.6, 0.9, 0.44, 0.9, true); // coffee table
  const magazineColors = [0xb53a3a, 0x3a7ab5, 0x3a8f5a];
  magazineColors.forEach((color, i) => {
    const magazine = kit.material({ color, roughness: 0.7 });
    kit.box(magazine, -17.25 + i * 0.06, 0.46 + i * 0.015, 54.6, 0.3, 0.015, 0.22)
      .rotation.y = i * 0.4;
  });
  kit.box(steel, -16.5, 0.6, 50.6, 0.4, 1.2, 0.4, true); // water dispenser
  const jugGeometry = kit.track(new THREE.CylinderGeometry(0.13, 0.13, 0.28, 12));
  const blue = kit.material({ color: 0x4a8ab5, roughness: 0.3 });
  kit.mesh(jugGeometry, blue, -16.5, 1.35, 50.6);
  const cupGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.025, 0.08, 8));
  kit.mesh(cupGeometry, paper, -16.2, 0.65, 50.85);
  kit.mesh(cupGeometry, paper, -16.32, 0.65, 50.92);
  const potGeometry = kit.track(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 12));
  const leafGeometry = kit.track(new THREE.ConeGeometry(0.09, 0.5, 8));
  const terracotta = kit.material({ color: 0xa9573a, roughness: 0.8 });
  const plant = kit.material({ color: 0x4a7a3a, roughness: 0.9 });
  for (const px of [-23.4, -16.6]) {
    kit.mesh(potGeometry, terracotta, px, 0.14, 51);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const leaf = kit.mesh(leafGeometry, plant, px + Math.cos(angle) * 0.08, 0.5, 51 + Math.sin(angle) * 0.08);
      leaf.rotation.set(Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4);
    }
  }
  const clockGeometry = kit.track(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 18).rotateX(Math.PI / 2));
  kit.mesh(clockGeometry, paper, -20, 2.0, 50.2);
  for (let i = 0; i < 3; i++) { // queue posts
    const postGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.12, 0.85, 10));
    kit.mesh(postGeometry, steel, -20 + (i - 1) * 0.9, 0.42, 53.4);
  }
  const matGeometry = kit.track(new THREE.PlaneGeometry(1.6, 0.9).rotateX(-Math.PI / 2));
  const matMaterial = kit.material({ color: 0x6b3a2a, roughness: 1 });
  const mat = new THREE.Mesh(matGeometry, matMaterial);
  mat.position.set(-20, 0.012, 50.8);
  mat.receiveShadow = true;
  kit.group.add(mat);
  const lobbyLight = new THREE.PointLight(0xfff2dc, 12, 16, 1.8);
  lobbyLight.position.set(-20, 2.3, 55);
  kit.group.add(lobbyLight);

  // --- Listening lab (x -32..-24, z 50..56): 8 stations, ~52 items ---
  for (let i = 0; i < 8; i++) {
    const sx = -30.8 + (i % 4) * 1.7;
    const sz = 51.8 + Math.floor(i / 4) * 2.5;
    kit.box(deskMaterial, sx, 0.4, sz, 1.4, 0.8, 0.7, true); // desk
    kit.box(black, sx, 1.05, sz - 0.15, 0.55, 0.4, 0.05); // monitor
    kit.box(black, sx, 0.83, sz + 0.12, 0.45, 0.025, 0.16); // keyboard
    const phonesGeometry = kit.track(new THREE.TorusGeometry(0.09, 0.025, 8, 16));
    kit.mesh(phonesGeometry, orange, sx + 0.5, 0.86, sz);
    kit.box(chairMaterial, sx, 0.24, sz + 0.75, 0.45, 0.48, 0.45); // chair
    kit.box(chairMaterial, sx, 0.62, sz + 0.95, 0.45, 0.36, 0.07);
  }
  kit.box(darkDesk, -25, 0.42, 55.3, 1.4, 0.84, 0.7, true); // instructor desk
  kit.box(steel, -31.5, 1.95, 50.4, 0.3, 0.4, 0.2); // wall speaker
  kit.box(steel, -24.5, 1.95, 50.4, 0.3, 0.4, 0.2); // wall speaker

  // --- Reading room (x -16..-8, z 50..56): ~46 items ---
  const bookColors = [0xb53a3a, 0x3a7ab5, 0x3a8f5a, 0xb5743a].map((color) =>
    kit.material({ color, roughness: 0.8 }),
  );
  for (const shelfX of [-14, -10.5]) { // 2 shelves, 12 books each
    kit.box(darkDesk, shelfX, 0.95, 50.55, 1.8, 1.9, 0.4, true);
    for (let s = 0; s < 2; s++) {
      for (let b = 0; b < 6; b++) {
        kit.box(
          bookColors[(s * 6 + b) % 4],
          shelfX - 0.7 + b * 0.28, 0.62 + s * 0.62, 50.62,
          0.14, 0.4, 0.18,
        );
      }
    }
  }
  for (let i = 0; i < 4; i++) { // reading tables with chairs + booklets
    const tx = -14.5 + (i % 2) * 4;
    const tz = 52.6 + Math.floor(i / 2) * 2;
    kit.box(deskMaterial, tx, 0.38, tz, 1.5, 0.76, 0.9, true);
    kit.box(chairMaterial, tx - 0.4, 0.24, tz + 0.75, 0.45, 0.48, 0.45);
    kit.box(chairMaterial, tx + 0.4, 0.24, tz + 0.75, 0.45, 0.48, 0.45);
    kit.box(paper, tx - 0.35, 0.78, tz, 0.3, 0.015, 0.4);
    kit.box(paper, tx + 0.3, 0.78, tz - 0.1, 0.3, 0.015, 0.4);
    const pencilGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6).rotateZ(Math.PI / 2));
    kit.mesh(pencilGeometry, orange, tx, 0.79, tz + 0.25);
  }
  const lampShade = kit.material({
    color: 0xe8dcc0,
    emissive: 0xffe2b0,
    emissiveIntensity: 0.7,
  });
  const lampGeometry = kit.track(new THREE.ConeGeometry(0.1, 0.14, 10));
  kit.mesh(lampGeometry, lampShade, -14.5, 0.95, 52.6);
  kit.mesh(lampGeometry, lampShade, -10.5, 0.95, 54.6);

  // --- Writing hall (x -25..-15, z 56..63): 12 exam desks, ~58 items ---
  for (let i = 0; i < 12; i++) {
    const dx = -23 + (i % 3) * 3;
    const dz = 57.6 + Math.floor(i / 3) * 1.35;
    kit.box(deskMaterial, dx, 0.38, dz, 1.1, 0.76, 0.6, true);
    kit.box(chairMaterial, dx, 0.23, dz + 0.62, 0.42, 0.46, 0.42);
    kit.box(paper, dx, 0.775, dz, 0.32, 0.012, 0.42); // answer sheet
    const pencilGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6).rotateZ(Math.PI / 2 + 0.4));
    kit.mesh(pencilGeometry, orange, dx + 0.28, 0.785, dz);
  }
  kit.box(paper, -20, 1.5, 62.8, 3.2, 1.3, 0.08); // whiteboard
  kit.box(darkDesk, -20, 1.5, 62.86, 3.4, 1.5, 0.04); // whiteboard frame
  kit.box(darkDesk, -16.3, 0.42, 62.2, 1.3, 0.84, 0.7, true); // invigilator desk
  kit.mesh(clockGeometry, paper, -20, 2.05, 56.2);
  // (One point light at reception covers the center — every extra
  // point light adds per-fragment cost to the whole scene.)

  // --- Speaking studio (x -32..-25, z 56..63): 4 booths, ~34 items ---
  for (let i = 0; i < 4; i++) {
    const bz = 57.3 + i * 1.45;
    kit.box(darkDesk, -31.2, 0.75, bz - 0.65, 1.4, 1.5, 0.08); // partition
    kit.box(deskMaterial, -31.4, 0.4, bz, 1.0, 0.8, 0.6, true); // booth desk
    const micStandGeometry = kit.track(new THREE.CylinderGeometry(0.015, 0.04, 0.22, 8));
    kit.mesh(micStandGeometry, black, -31.5, 0.92, bz);
    const micGeometry = kit.track(new THREE.SphereGeometry(0.035, 8, 8));
    kit.mesh(micGeometry, orange, -31.5, 1.05, bz);
    kit.box(black, -31.1, 0.84, bz, 0.25, 0.06, 0.18); // recorder
    kit.box(chairMaterial, -30.5, 0.23, bz, 0.42, 0.46, 0.42); // stool
  }
  for (let i = 0; i < 6; i++) { // acoustic foam panels
    const foam = kit.material({ color: 0x3a3f4a, roughness: 1 });
    kit.box(foam, -28 + (i % 3) * 1.1, 1.4 + Math.floor(i / 3) * 0.9, 62.82, 0.9, 0.7, 0.06);
  }

  // --- Staff office (x -15..-8, z 56..63): ~22 items ---
  kit.box(darkDesk, -11, 0.42, 58, 1.8, 0.84, 0.9, true); // office desk
  kit.box(black, -11.3, 0.92, 58, 0.45, 0.3, 0.3); // laptop base+screen
  kit.box(screenMaterial, -11.3, 1.1, 57.9, 0.4, 0.26, 0.02);
  const mugGeometry = kit.track(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10));
  kit.mesh(mugGeometry, orange, -10.5, 0.9, 58.2);
  kit.box(chairMaterial, -11, 0.28, 59, 0.5, 0.56, 0.5); // office chair
  kit.box(steel, -8.6, 0.65, 56.7, 0.5, 1.3, 0.55, true); // filing cabinet
  kit.box(steel, -8.6, 0.65, 57.5, 0.5, 1.3, 0.55, true); // filing cabinet
  kit.box(darkDesk, -9, 0.9, 62.5, 1.6, 1.8, 0.4, true); // office bookshelf
  for (let b = 0; b < 8; b++) {
    kit.box(bookColors[b % 4], -9.65 + b * 0.18, 0.55 + (b % 2) * 0.6, 62.55, 0.12, 0.38, 0.16);
  }
  for (let i = 0; i < 3; i++) { // framed certificates
    kit.box(deskMaterial, -13 + i * 1.4, 1.7, 62.84, 0.55, 0.7, 0.04);
    kit.box(paper, -13 + i * 1.4, 1.7, 62.81, 0.45, 0.6, 0.03);
  }
  const trophyGeometry = kit.track(new THREE.ConeGeometry(0.07, 0.18, 10));
  const gold = kit.material({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
  kit.mesh(trophyGeometry, gold, -8.7, 1.62, 62.5);
  kit.box(steel, -14.5, 0.9, 56.7, 0.6, 1.8, 0.5, true); // phone lockers
  kit.box(steel, -11, 0.3, 62.0, 0.5, 0.6, 0.45, true); // printer
  kit.box(paper, -11, 0.63, 62.0, 0.3, 0.04, 0.25); // printer paper

  return kit.build();
}
