import * as THREE from "three";
import type { Collider } from "./house";

// FORM Pilates Studio: the terminus building at the end of the road.
// Footprint x -4..10, z 50..60; door on the north wall at the road
// centerline (gap x 1.75..3.25).
const WALL_HEIGHT = 2.6;
const WALL_THICKNESS = 0.3;

function drawStudioSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#efe9df";
  ctx.fillRect(0, 0, 256, 64);
  ctx.textAlign = "center";
  ctx.fillStyle = "#3e3a34";
  ctx.font = "300 30px serif";
  ctx.fillText("F O R M", 128, 30);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#8a8276";
  ctx.fillText("P I L A T E S   S T U D I O", 128, 50);
}

export function buildPilates(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  // The studio palette: warm plaster, pale oak, sage, cream bouclé, brass.
  const plasterMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9e2d6,
    roughness: 0.9,
  });
  const oakMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9ae85,
    roughness: 0.6,
  });
  const walnutMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a6b4a,
    roughness: 0.55,
  });
  const creamMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2ece0,
    roughness: 0.95,
  });
  const sageMaterial = new THREE.MeshStandardMaterial({
    color: 0xa8b59a,
    roughness: 0.85,
  });
  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0xb89554,
    metalness: 0.8,
    roughness: 0.3,
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c2a26,
    roughness: 0.5,
  });
  const mirrorMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6e4e8,
    emissive: 0x9ab4ba,
    emissiveIntensity: 0.3,
    roughness: 0.05,
    metalness: 0.45,
  });
  disposables.push(
    unitBox, plasterMaterial, oakMaterial, walnutMaterial, creamMaterial,
    sageMaterial, brassMaterial, blackMaterial, mirrorMaterial,
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

  // --- Shell: pale oak floor, plaster walls, stone path from the road ---
  const floorGeometry = new THREE.PlaneGeometry(14, 10).rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeometry, oakMaterial);
  floor.position.set(3, 0.008, 55);
  floor.receiveShadow = true;
  group.add(floor);
  const pathGeometry = new THREE.PlaneGeometry(2, 1.6).rotateX(-Math.PI / 2);
  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d2c4 });
  const path = new THREE.Mesh(pathGeometry, pathMaterial);
  path.position.set(2.5, 0.002, 49.3);
  path.receiveShadow = true;
  group.add(path);
  disposables.push(floorGeometry, pathGeometry, pathMaterial);

  // North wall split by the door; the rest of the shell solid.
  box(plasterMaterial, group, -1.125, WALL_HEIGHT / 2, 50, 5.75, WALL_HEIGHT, WALL_THICKNESS, true);
  box(plasterMaterial, group, 6.625, WALL_HEIGHT / 2, 50, 6.75, WALL_HEIGHT, WALL_THICKNESS, true);
  box(plasterMaterial, group, 3, WALL_HEIGHT / 2, 60, 14, WALL_HEIGHT, WALL_THICKNESS, true);
  box(plasterMaterial, group, -4, WALL_HEIGHT / 2, 55, WALL_THICKNESS, WALL_HEIGHT, 10, true);
  box(plasterMaterial, group, 10, WALL_HEIGHT / 2, 55, WALL_THICKNESS, WALL_HEIGHT, 10, true);

  // Signboard above the entrance.
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 256;
  signCanvas.height = 64;
  drawStudioSign(signCanvas.getContext("2d")!);
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signMaterial = new THREE.MeshStandardMaterial({ map: signTexture });
  const signGeometry = new THREE.PlaneGeometry(2.2, 0.55);
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(2.5, 2.15, 49.83);
  group.add(sign);
  disposables.push(signTexture, signMaterial, signGeometry);

  // Soft warm studio light.
  const light = new THREE.PointLight(0xfff0dc, 16, 14, 1.8);
  light.position.set(3, 2.4, 55);
  group.add(light);

  // Arched mirror panels along the west wall, brass-framed.
  const archGeometry = new THREE.CircleGeometry(0.55, 24, 0, Math.PI);
  const archFrameGeometry = new THREE.CircleGeometry(0.6, 24, 0, Math.PI);
  disposables.push(archGeometry, archFrameGeometry);
  for (const mz of [52.4, 55, 57.6]) {
    box(brassMaterial, group, -3.82, 0.95, mz, 0.04, 1.6, 1.2);
    box(mirrorMaterial, group, -3.8, 0.95, mz, 0.04, 1.5, 1.1);
    const frame = new THREE.Mesh(archFrameGeometry, brassMaterial);
    frame.position.set(-3.82, 1.75, mz);
    frame.rotation.y = Math.PI / 2;
    group.add(frame);
    const arch = new THREE.Mesh(archGeometry, mirrorMaterial);
    arch.position.set(-3.8, 1.7, mz);
    arch.rotation.y = Math.PI / 2;
    group.add(arch);
  }

  // --- Reformers: a row of three facing the mirrors ---
  const springColors = [0xb89554, 0x8a3a2e, 0x4a6b8a];
  const springGeometry = new THREE.CylinderGeometry(0.016, 0.016, 0.5, 8)
    .rotateX(Math.PI / 2);
  const barGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.78, 10)
    .rotateZ(Math.PI / 2);
  const postGeometry = new THREE.CylinderGeometry(0.022, 0.022, 0.34, 8);
  disposables.push(springGeometry, barGeometry, postGeometry);

  const buildReformer = () => {
    const reformer = new THREE.Group();
    // Walnut frame rails on turned legs.
    box(walnutMaterial, reformer, -0.42, 0.42, 0, 0.08, 0.14, 2.5);
    box(walnutMaterial, reformer, 0.42, 0.42, 0, 0.08, 0.14, 2.5);
    box(walnutMaterial, reformer, 0, 0.42, -1.21, 0.92, 0.14, 0.08);
    box(walnutMaterial, reformer, 0, 0.42, 1.21, 0.92, 0.14, 0.08);
    for (const [lx, lz] of [[-0.4, -1.15], [0.4, -1.15], [-0.4, 1.15], [0.4, 1.15]]) {
      box(walnutMaterial, reformer, lx, 0.18, lz, 0.07, 0.36, 0.07);
    }
    // Cream bouclé carriage with headrest and sage shoulder blocks.
    box(creamMaterial, reformer, 0, 0.53, 0.18, 0.76, 0.1, 1.05);
    box(creamMaterial, reformer, 0, 0.57, 0.78, 0.76, 0.07, 0.3);
    box(sageMaterial, reformer, -0.2, 0.65, 0.52, 0.09, 0.14, 0.09);
    box(sageMaterial, reformer, 0.2, 0.65, 0.52, 0.09, 0.14, 0.09);
    // Brass footbar arcing over the head end.
    const footbar = new THREE.Mesh(barGeometry, brassMaterial);
    footbar.position.set(0, 0.78, -0.95);
    reformer.add(footbar);
    for (const px of [-0.38, 0.38]) {
      const post = new THREE.Mesh(postGeometry, brassMaterial);
      post.position.set(px, 0.62, -1.0);
      post.rotation.x = -0.3;
      reformer.add(post);
    }
    // Colored springs running to the carriage.
    springColors.forEach((color, i) => {
      const springMaterial = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.4,
      });
      disposables.push(springMaterial);
      const spring = new THREE.Mesh(springGeometry, springMaterial);
      spring.position.set(-0.14 + i * 0.14, 0.47, -0.62);
      reformer.add(spring);
    });
    // Rope loops on brass risers at the foot end.
    for (const px of [-0.3, 0.3]) {
      const riser = new THREE.Mesh(postGeometry, brassMaterial);
      riser.position.set(px, 0.7, 1.18);
      reformer.add(riser);
    }
    return reformer;
  };

  for (const rz of [52.4, 55, 57.6]) {
    const reformer = buildReformer();
    reformer.position.set(-1.7, 0, rz);
    reformer.rotation.y = Math.PI / 2; // head end toward the mirrors
    group.add(reformer);
    colliders.push({ minX: -3, maxX: -0.4, minZ: rz - 0.55, maxZ: rz + 0.55 });
  }

  // --- Cadillac / trapeze table against the south wall ---
  const cadillac = new THREE.Group();
  cadillac.position.set(7.4, 0, 58.3);
  box(walnutMaterial, cadillac, 0, 0.45, 0, 2.3, 0.16, 1.15);
  for (const [lx, lz] of [[-1.05, -0.48], [1.05, -0.48], [-1.05, 0.48], [1.05, 0.48]]) {
    box(walnutMaterial, cadillac, lx, 0.19, lz, 0.09, 0.38, 0.09);
  }
  box(creamMaterial, cadillac, 0, 0.58, 0, 2.2, 0.1, 1.05);
  // Brass canopy frame.
  for (const [px, pz] of [[-1.08, -0.5], [1.08, -0.5], [-1.08, 0.5], [1.08, 0.5]]) {
    const upright = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.7, 8),
      brassMaterial,
    );
    upright.geometry && disposables.push(upright.geometry);
    upright.position.set(px, 1.45, pz);
    cadillac.add(upright);
  }
  box(brassMaterial, cadillac, 0, 2.3, -0.5, 2.2, 0.05, 0.05);
  box(brassMaterial, cadillac, 0, 2.3, 0.5, 2.2, 0.05, 0.05);
  box(brassMaterial, cadillac, -1.08, 2.3, 0, 0.05, 0.05, 1.05);
  box(brassMaterial, cadillac, 1.08, 2.3, 0, 0.05, 0.05, 1.05);
  // Trapeze bar hanging from the canopy.
  for (const px of [-0.3, 0.3]) {
    box(blackMaterial, cadillac, px, 1.95, 0, 0.02, 0.7, 0.02);
  }
  box(brassMaterial, cadillac, 0, 1.6, 0, 0.66, 0.04, 0.04);
  group.add(cadillac);
  colliders.push({ minX: 6.1, maxX: 8.7, minZ: 57.6, maxZ: 59 });

  // --- Ladder barrel ---
  const barrel = new THREE.Group();
  barrel.position.set(8.9, 0, 53.2);
  barrel.rotation.y = Math.PI / 2;
  const barrelGeometry = new THREE.CylinderGeometry(0.42, 0.42, 0.7, 20, 1, false, 0, Math.PI)
    .rotateZ(Math.PI / 2);
  const barrelMesh = new THREE.Mesh(barrelGeometry, sageMaterial);
  barrelMesh.position.set(0, 0.55, -0.1);
  barrelMesh.castShadow = true;
  barrel.add(barrelMesh);
  disposables.push(barrelGeometry);
  box(walnutMaterial, barrel, 0, 0.35, -0.1, 0.7, 0.7, 0.25);
  // Ladder rungs.
  box(walnutMaterial, barrel, -0.33, 0.6, 0.62, 0.07, 1.2, 0.07);
  box(walnutMaterial, barrel, 0.33, 0.6, 0.62, 0.07, 1.2, 0.07);
  for (const ry of [0.35, 0.62, 0.89, 1.16]) {
    const rung = new THREE.Mesh(barGeometry, walnutMaterial);
    rung.scale.setScalar(0.85);
    rung.position.set(0, ry, 0.62);
    barrel.add(rung);
  }
  group.add(barrel);
  colliders.push({ minX: 8.2, maxX: 9.6, minZ: 52.5, maxZ: 53.9 });

  // --- Wunda chair ---
  const chair = new THREE.Group();
  chair.position.set(5.2, 0, 51.4);
  box(walnutMaterial, chair, 0, 0.45, 0, 0.6, 0.9, 0.6);
  box(creamMaterial, chair, 0, 0.93, 0, 0.62, 0.07, 0.62);
  box(blackMaterial, chair, 0, 0.42, 0.34, 0.5, 0.06, 0.04); // pedal
  group.add(chair);
  colliders.push({ minX: 4.9, maxX: 5.5, minZ: 51.1, maxZ: 51.7 });

  // --- Mat corner: rolled mats, stability balls, a potted plant ---
  const matGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.62, 12);
  disposables.push(matGeometry);
  const matColors = [0xa8b59a, 0xd8c8b2, 0x9aa8b5];
  matColors.forEach((color, i) => {
    const matMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    disposables.push(matMaterial);
    const mat = new THREE.Mesh(matGeometry, matMaterial);
    mat.rotation.z = Math.PI / 2;
    mat.position.set(-3.3, 0.09 + i * 0.17, 59.3 - i * 0.02);
    mat.castShadow = true;
    group.add(mat);
  });
  const ballGeometry = new THREE.SphereGeometry(0.3, 18, 14);
  disposables.push(ballGeometry);
  for (const [bx, bz, color] of [[-2.4, 59.2, 0xc9c2b4], [-1.8, 59.4, 0xa8b59a]] as const) {
    const ballMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
    });
    disposables.push(ballMaterial);
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(bx, 0.3, bz);
    ball.castShadow = true;
    group.add(ball);
  }
  colliders.push({ minX: -3.7, maxX: -1.4, minZ: 58.9, maxZ: 59.7 });

  // Reception bench and plant by the door.
  box(walnutMaterial, group, 0.2, 0.24, 50.7, 1.4, 0.12, 0.45);
  box(walnutMaterial, group, -0.3, 0.1, 50.7, 0.08, 0.2, 0.4);
  box(walnutMaterial, group, 0.7, 0.1, 50.7, 0.08, 0.2, 0.4);
  const potGeometry = new THREE.CylinderGeometry(0.18, 0.14, 0.3, 14);
  const leafGeometry = new THREE.ConeGeometry(0.08, 0.55, 8);
  const potMaterial = new THREE.MeshStandardMaterial({ color: 0xb8a890 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x5a7a4a });
  disposables.push(potGeometry, leafGeometry, potMaterial, leafMaterial);
  const pot = new THREE.Mesh(potGeometry, potMaterial);
  pot.position.set(4.4, 0.15, 50.8);
  group.add(pot);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
    const angle = (i / 5) * Math.PI * 2;
    leaf.position.set(
      4.4 + Math.cos(angle) * 0.07, 0.55, 50.8 + Math.sin(angle) * 0.07,
    );
    leaf.rotation.set(Math.sin(angle) * 0.35, 0, -Math.cos(angle) * 0.35);
    group.add(leaf);
  }
  colliders.push({ minX: 4.1, maxX: 4.7, minZ: 50.5, maxZ: 51.1 });

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
