import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";

// The mansion tennis court, on the west lawn (court x -45.5..-34.5,
// z -10..10). Hedge perimeter with a gate on the east side facing the
// gym door in the mansion's west wall.
export function buildTennis(): RoomBuild {
  const kit = new Kit();

  const courtMaterial = kit.material({ color: 0x2e6b5a, roughness: 0.9 });
  const lineMaterial = kit.material({ color: 0xf0f0ea, roughness: 0.8 });
  const hedge = kit.material({ color: 0x3a5a2e, roughness: 1 });
  const steel = kit.material({ color: 0x8a8f96, metalness: 0.6, roughness: 0.4 });
  const wood = kit.material({ color: 0x6f5643, roughness: 0.7 });

  // 1 court surface
  const courtGeometry = kit.track(new THREE.PlaneGeometry(11, 20).rotateX(-Math.PI / 2));
  const court = new THREE.Mesh(courtGeometry, courtMaterial);
  court.position.set(-40, 0.01, 0);
  court.receiveShadow = true;
  kit.group.add(court);

  // 2 line markings (baselines, doubles + singles sidelines, service
  // boxes, center line, center marks) — 12 painted lines
  const line = (x: number, z: number, w: number, d: number) => {
    const mesh = kit.box(lineMaterial, x, 0.018, z, w, 0.008, d);
    mesh.castShadow = false;
    return mesh;
  };
  line(-40, -9, 9.6, 0.1); // baselines
  line(-40, 9, 9.6, 0.1);
  line(-44.8, 0, 0.1, 18.1); // doubles sidelines
  line(-35.2, 0, 0.1, 18.1);
  line(-43.6, 0, 0.08, 18.1); // singles sidelines
  line(-36.4, 0, 0.08, 18.1);
  line(-40, -4.5, 7.2, 0.08); // service lines
  line(-40, 4.5, 7.2, 0.08);
  line(-40, 0, 0.08, 9); // center service line
  line(-40, -8.85, 0.08, 0.3); // center marks
  line(-40, 8.85, 0.08, 0.3);

  // 3 net: posts, mesh, white band — solid across the middle
  kit.box(steel, -44.9, 0.55, 0, 0.1, 1.1, 0.1, true);
  kit.box(steel, -35.1, 0.55, 0, 0.1, 1.1, 0.1, true);
  // Square-mesh netting drawn to canvas (wireframe planes show their
  // triangle diagonals, which reads as a crooked net).
  const netCanvas = document.createElement("canvas");
  netCanvas.width = 256;
  netCanvas.height = 32;
  const netCtx = netCanvas.getContext("2d")!;
  netCtx.clearRect(0, 0, 256, 32);
  netCtx.strokeStyle = "rgba(220, 220, 205, 0.9)";
  netCtx.lineWidth = 1;
  for (let x = 0; x <= 256; x += 4) {
    netCtx.beginPath();
    netCtx.moveTo(x, 0);
    netCtx.lineTo(x, 32);
    netCtx.stroke();
  }
  for (let y = 0; y <= 32; y += 4) {
    netCtx.beginPath();
    netCtx.moveTo(0, y);
    netCtx.lineTo(256, y);
    netCtx.stroke();
  }
  const netTexture = kit.track(new THREE.CanvasTexture(netCanvas));
  const netGeometry = kit.track(new THREE.PlaneGeometry(9.8, 0.9));
  const netMaterial = kit.track(
    new THREE.MeshBasicMaterial({
      map: netTexture,
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );
  const net = new THREE.Mesh(netGeometry, netMaterial);
  net.position.set(-40, 0.55, 0);
  kit.group.add(net);
  kit.box(lineMaterial, -40, 1.0, 0, 9.8, 0.07, 0.04);
  kit.solid(-44.8, -35.2, -0.08, 0.08);

  // 4 umpire chair
  const umpire = new THREE.Group();
  umpire.position.set(-34.3, 0, 1.6);
  kit.box(steel, 0, 0.9, 0, 0.12, 1.8, 0.12, false, umpire);
  kit.box(steel, 0.3, 0.9, 0, 0.12, 1.8, 0.12, false, umpire);
  kit.box(wood, 0.15, 1.85, 0, 0.55, 0.08, 0.5, false, umpire);
  kit.box(wood, 0.15, 2.2, -0.22, 0.55, 0.6, 0.08, false, umpire);
  for (let i = 0; i < 4; i++) {
    kit.box(steel, 0.15, 0.3 + i * 0.4, 0.18, 0.5, 0.05, 0.05, false, umpire);
  }
  kit.group.add(umpire);
  kit.solid(-34.7, -33.9, 1.2, 2.0);

  // 5 player benches x2 + 6 rackets x2 + 7 balls x3 + 8 ball cart
  for (const bz of [-2.2, 3.8] as const) {
    kit.box(wood, -34.2, 0.28, bz, 0.45, 0.1, 1.5, true);
    kit.box(wood, -34.2, 0.12, bz - 0.6, 0.4, 0.22, 0.08);
    kit.box(wood, -34.2, 0.12, bz + 0.6, 0.4, 0.22, 0.08);
  }
  const headGeometry = kit.track(new THREE.TorusGeometry(0.14, 0.025, 8, 18));
  const gripGeometry = kit.track(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8));
  for (const [rz, tilt] of [[-2.0, 0.4], [3.6, -0.3]] as const) {
    const racket = new THREE.Group();
    racket.position.set(-34.15, 0.42, rz);
    racket.rotation.set(Math.PI / 2, 0, tilt);
    const head = kit.mesh(headGeometry, steel, 0, 0.25, 0, racket);
    head.rotation.x = 0;
    kit.mesh(gripGeometry, wood, 0, 0, 0, racket);
    kit.group.add(racket);
  }
  const ballGeometry = kit.track(new THREE.SphereGeometry(0.045, 10, 8));
  const tennisBall = kit.material({ color: 0xd4e84d, roughness: 0.7 });
  for (const [bx, bz] of [[-39, -6.5], [-41.5, 5.5], [-37.5, 1.2]]) {
    kit.mesh(ballGeometry, tennisBall, bx, 0.045, bz);
  }
  const cartGeometry = kit.track(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 14));
  kit.mesh(cartGeometry, steel, -35, 0.25, -5.5);
  for (let i = 0; i < 5; i++) {
    kit.mesh(ballGeometry, tennisBall, -35.1 + (i % 3) * 0.12, 0.52, -5.55 + Math.floor(i / 3) * 0.12);
  }
  kit.solid(-35.35, -34.65, -5.85, -5.15);

  // 9 scoreboard on the south hedge
  kit.canvasPlane(
    (ctx) => {
      ctx.fillStyle = "#1c2820";
      ctx.fillRect(0, 0, 192, 96);
      ctx.strokeStyle = "#d4e84d";
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, 184, 88);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f0f0ea";
      ctx.font = "bold 14px monospace";
      ctx.fillText("TYCOON OPEN", 96, 28);
      ctx.fillStyle = "#d4e84d";
      ctx.font = "bold 20px monospace";
      ctx.fillText("RED  6 - 0  BLUE", 96, 66);
    },
    192, 96, 1.8, 0.9, -40, 1.2, 10.4, Math.PI,
  );

  // 10 floodlights x2
  for (const [fx, fz] of [[-46.2, -7], [-33.8, 7]] as const) {
    kit.box(steel, fx, 1.6, fz, 0.14, 3.2, 0.14, true);
    const lampGlow = kit.material({
      color: 0x9a9a8e,
      emissive: 0xfff4d0,
      emissiveIntensity: 1.2,
    });
    kit.box(lampGlow, fx, 3.2, fz, 0.6, 0.3, 0.2);
  }

  // 11 hedge perimeter with a gate on the east side (gap z -1.5..1.5)
  kit.box(hedge, -40, 0.5, -11, 13.4, 1.0, 0.6, true); // north
  kit.box(hedge, -40, 0.5, 11, 13.4, 1.0, 0.6, true); // south
  kit.box(hedge, -46.7, 0.5, 0, 0.6, 1.0, 22.6, true); // west
  kit.box(hedge, -33.3, 0.5, -6.55, 0.6, 1.0, 10.1, true); // east, north of gate
  kit.box(hedge, -33.3, 0.5, 6.55, 0.6, 1.0, 10.1, true); // east, south of gate

  // 12 stone path from the gym door to the gate
  const pathGeometry = kit.track(new THREE.PlaneGeometry(3.2, 1.6).rotateX(-Math.PI / 2));
  const pathMaterial = kit.material({ color: 0x8d8478, roughness: 0.9 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(-31.6, 0.005, 2.2);
  path.rotation.y = 0.35;
  path.receiveShadow = true;
  kit.group.add(path);

  return kit.build();
}
