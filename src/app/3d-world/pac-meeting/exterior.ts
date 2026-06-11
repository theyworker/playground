import * as THREE from "three";
import type { Collider } from "./house";

// Outdoors, south of the house. The main entrance gap is x 1.5..3.5 at z=10.
export function buildExterior(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x9b948a });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4023 });
  disposables.push(unitBox, stoneMaterial, woodMaterial);

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

  // Lawn under and around everything, and the straight road from the door.
  const lawnGeometry = new THREE.PlaneGeometry(106, 100).rotateX(-Math.PI / 2);
  const lawnMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d4a23,
    roughness: 1,
  });
  const lawn = new THREE.Mesh(lawnGeometry, lawnMaterial);
  lawn.position.set(2, -0.012, 16);
  lawn.receiveShadow = true;
  group.add(lawn);
  disposables.push(lawnGeometry, lawnMaterial);

  const roadGeometry = new THREE.PlaneGeometry(3.5, 39.7).rotateX(-Math.PI / 2);
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2b30,
    roughness: 0.9,
  });
  const road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.position.set(2.5, 0.004, 30.15);
  road.receiveShadow = true;
  group.add(road);
  disposables.push(roadGeometry, roadMaterial);

  // Branch road heading west to the WADX academy (between Devind's
  // Place and the Pilates studio).
  const branchGeometry = new THREE.PlaneGeometry(31.75, 2.5).rotateX(-Math.PI / 2);
  const branch = new THREE.Mesh(branchGeometry, roadMaterial);
  branch.position.set(-15.125, 0.004, 48);
  branch.receiveShadow = true;
  group.add(branch);
  disposables.push(branchGeometry);

  // Dashed center lines.
  const dashMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d8d0 });
  disposables.push(dashMaterial);
  for (let z = 11.5; z < 49; z += 2.2) {
    const dash = box(dashMaterial, 2.5, 0.008, z, 0.14, 0.005, 0.9);
    dash.castShadow = false;
  }
  for (let x = -29.5; x < -0.5; x += 2.2) {
    const dash = box(dashMaterial, x, 0.008, 48, 0.9, 0.005, 0.14);
    dash.castShadow = false;
  }

  // Porch: doormat slab, pillars, canopy, and an open front door.
  box(stoneMaterial, 2.5, 0.025, 10.8, 2.8, 0.05, 1.6);
  box(stoneMaterial, 1.3, 1.1, 10.6, 0.25, 2.2, 0.25, true);
  box(stoneMaterial, 3.7, 1.1, 10.6, 0.25, 2.2, 0.25, true);
  box(woodMaterial, 2.5, 2.26, 10.5, 3.2, 0.14, 1.5);
  const door = box(woodMaterial, 0, 0, 0, 0.95, 2.0, 0.08, true);
  door.position.set(1.85, 1.0, 10.35);
  door.rotation.y = -0.9; // swung open toward the porch
  colliders.pop(); // replace the unrotated collider with a hand-sized one
  colliders.push({ minX: 1.5, maxX: 2.2, minZ: 10.1, maxZ: 10.8 });

  // --- Lamborghini-ish supercar, parked beside the entrance ---
  const car = new THREE.Group();
  car.position.set(5.6, 0, 12.2);
  const paintMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0c419,
    metalness: 0.7,
    roughness: 0.25,
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
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8c8cc,
    metalness: 0.9,
    roughness: 0.25,
  });
  disposables.push(paintMaterial, glassMaterial, tireMaterial, rimMaterial);

  const carBox = (
    material: THREE.Material,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    tiltX = 0,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.rotation.x = tiltX;
    mesh.castShadow = true;
    car.add(mesh);
    return mesh;
  };

  // Low wedge body (nose toward -z / the house), scissor-low cabin, spoiler.
  carBox(paintMaterial, 0, 0.34, 0.15, 1.04, 0.3, 1.9);
  carBox(paintMaterial, 0, 0.42, -0.95, 0.98, 0.16, 0.75, -0.18); // nose wedge
  carBox(glassMaterial, 0, 0.62, 0.05, 0.78, 0.22, 0.85);
  carBox(paintMaterial, 0, 0.56, -0.42, 0.8, 0.1, 0.5, -0.35); // windshield rake
  carBox(paintMaterial, -0.45, 0.78, 1.05, 0.08, 0.18, 0.08); // spoiler struts
  carBox(paintMaterial, 0.45, 0.78, 1.05, 0.08, 0.18, 0.08);
  carBox(paintMaterial, 0, 0.88, 1.05, 1.1, 0.05, 0.32); // spoiler wing
  carBox(glassMaterial, 0, 0.32, 1.13, 0.5, 0.12, 0.06); // exhaust panel
  const lightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xb89e4a,
    emissiveIntensity: 0.5,
  });
  disposables.push(lightMaterial);
  carBox(lightMaterial, -0.35, 0.42, -1.31, 0.22, 0.06, 0.04);
  carBox(lightMaterial, 0.35, 0.42, -1.31, 0.22, 0.06, 0.04);

  const tireGeometry = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 18).rotateZ(
    Math.PI / 2,
  );
  const rimGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.17, 12).rotateZ(
    Math.PI / 2,
  );
  disposables.push(tireGeometry, rimGeometry);
  for (const [wx, wz] of [[-0.52, -0.72], [0.52, -0.72], [-0.52, 0.78], [0.52, 0.78]]) {
    const tire = new THREE.Mesh(tireGeometry, tireMaterial);
    tire.position.set(wx, 0.19, wz);
    tire.castShadow = true;
    car.add(tire);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(wx, 0.19, wz);
    car.add(rim);
  }
  group.add(car);
  colliders.push({ minX: 4.9, maxX: 6.3, minZ: 10.7, maxZ: 13.7 });

  // --- Purple Toyota Vitz "Fake Taxi", parked across the road ---
  const vitz = new THREE.Group();
  vitz.position.set(-1.1, 0, 16.5);
  const vitzPaintMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a2fbe,
    metalness: 0.45,
    roughness: 0.35,
  });
  disposables.push(vitzPaintMaterial);

  const vitzBox = (
    material: THREE.Material,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    tiltX = 0,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.rotation.x = tiltX;
    mesh.castShadow = true;
    vitz.add(mesh);
    return mesh;
  };

  // Tall stubby hatchback (nose toward -z): body, big cabin, flat hatch.
  vitzBox(vitzPaintMaterial, 0, 0.46, 0, 1.0, 0.4, 2.0);
  vitzBox(vitzPaintMaterial, 0, 0.62, -0.78, 0.94, 0.1, 0.45, -0.12); // hood
  vitzBox(glassMaterial, 0, 0.92, 0.12, 0.88, 0.3, 1.3);
  vitzBox(vitzPaintMaterial, 0, 1.12, 0.12, 0.92, 0.08, 1.42); // roof
  vitzBox(vitzPaintMaterial, 0, 0.86, -0.62, 0.9, 0.08, 0.52, -0.55); // windshield rake
  vitzBox(vitzPaintMaterial, 0, 0.9, 0.85, 0.9, 0.08, 0.4, 0.3); // rear hatch
  vitzBox(lightMaterial, -0.32, 0.58, -1.01, 0.2, 0.1, 0.04);
  vitzBox(lightMaterial, 0.32, 0.58, -1.01, 0.2, 0.1, 0.04);
  for (const [wx, wz] of [[-0.5, -0.62], [0.5, -0.62], [-0.5, 0.62], [0.5, 0.62]]) {
    const tire = new THREE.Mesh(tireGeometry, tireMaterial);
    tire.position.set(wx, 0.19, wz);
    tire.castShadow = true;
    vitz.add(tire);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(wx, 0.19, wz);
    vitz.add(rim);
  }

  // "FAKE TAXI" livery: checkered banner with text, used on the roof
  // sign (front/back faces) and as door decals on both sides.
  const taxiCanvas = document.createElement("canvas");
  taxiCanvas.width = 256;
  taxiCanvas.height = 80;
  const taxiCtx = taxiCanvas.getContext("2d")!;
  taxiCtx.fillStyle = "#f7f4ea";
  taxiCtx.fillRect(0, 0, 256, 80);
  taxiCtx.fillStyle = "#1c1c1c";
  for (let x = 0; x < 256; x += 32) {
    taxiCtx.fillRect(x, 0, 16, 8);
    taxiCtx.fillRect(x + 16, 8, 16, 8);
    taxiCtx.fillRect(x + 16, 64, 16, 8);
    taxiCtx.fillRect(x, 72, 16, 8);
  }
  taxiCtx.textAlign = "center";
  taxiCtx.font = "bold 36px sans-serif";
  taxiCtx.fillText("FAKE TAXI", 128, 53);
  const taxiTexture = new THREE.CanvasTexture(taxiCanvas);
  // Box back faces sample the texture mirrored; flip a copy for that side.
  const taxiTextureFlipped = taxiTexture.clone();
  taxiTextureFlipped.wrapS = THREE.RepeatWrapping;
  taxiTextureFlipped.repeat.x = -1;
  const taxiSignMaterial = new THREE.MeshStandardMaterial({ map: taxiTexture });
  const taxiSignBackMaterial = new THREE.MeshStandardMaterial({
    map: taxiTextureFlipped,
  });
  const taxiCapMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f4ea });
  disposables.push(
    taxiTexture, taxiTextureFlipped,
    taxiSignMaterial, taxiSignBackMaterial, taxiCapMaterial,
  );

  const signGeometry = new THREE.BoxGeometry(0.72, 0.22, 0.16);
  disposables.push(signGeometry);
  const sign = new THREE.Mesh(signGeometry, [
    taxiCapMaterial, taxiCapMaterial, taxiCapMaterial,
    taxiCapMaterial, taxiSignMaterial, taxiSignBackMaterial,
  ]);
  sign.position.set(0, 1.28, 0.12);
  sign.castShadow = true;
  vitz.add(sign);

  const decalGeometry = new THREE.PlaneGeometry(0.95, 0.3);
  disposables.push(decalGeometry);
  for (const side of [-1, 1]) {
    const decal = new THREE.Mesh(decalGeometry, taxiSignMaterial);
    decal.position.set(side * 0.505, 0.5, 0);
    decal.rotation.y = side * Math.PI / 2;
    vitz.add(decal);
  }

  group.add(vitz);
  colliders.push({ minX: -1.7, maxX: -0.5, minZ: 15.3, maxZ: 17.7 });

  // Invisible bounds so the crewmate stays on the lawn.
  colliders.push(
    { minX: -52, maxX: 54, minZ: 64, maxZ: 65 }, // south
    { minX: -52, maxX: 54, minZ: -32, maxZ: -31 }, // north
    { minX: -51, maxX: -50, minZ: -32, maxZ: 65 }, // west
    { minX: 48, maxX: 49, minZ: -32, maxZ: 65 }, // east
  );

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
