import * as THREE from "three";
import type { Collider } from "./house";

// Subtle striped wallpaper, generated at runtime so no asset files are needed.
export function makeWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b9a890";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#ad9c83";
  for (let x = 0; x < 128; x += 32) {
    ctx.fillRect(x, 0, 14, 128);
  }
  ctx.fillStyle = "#c5b49c";
  for (let x = 16; x < 128; x += 32) {
    for (let y = 8; y < 128; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

export function buildDecor(): {
  group: THREE.Group;
  colliders: Collider[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3a36 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfe3f2,
    emissive: 0x9cc8e8,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const curtainMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a4f3e,
    roughness: 0.9,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x6f5643 });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0x55595f,
    metalness: 0.6,
    roughness: 0.4,
  });
  disposables.push(
    unitBox,
    frameMaterial,
    glassMaterial,
    curtainMaterial,
    woodMaterial,
    metalMaterial,
  );

  const box = (
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // --- Rugs (flat, non-solid) ---
  const rugRoundGeometry = new THREE.CircleGeometry(2.2, 48).rotateX(-Math.PI / 2);
  const rugRoundMaterial = new THREE.MeshStandardMaterial({
    color: 0x7d3c98,
    roughness: 1,
  });
  const roundRug = new THREE.Mesh(rugRoundGeometry, rugRoundMaterial);
  roundRug.position.set(-6, 0.01, 3.5);
  roundRug.receiveShadow = true;
  group.add(roundRug);
  disposables.push(rugRoundGeometry, rugRoundMaterial);

  const rugRectGeometry = new THREE.PlaneGeometry(2.6, 1.8).rotateX(-Math.PI / 2);
  const rugRectMaterial = new THREE.MeshStandardMaterial({
    color: 0x2e6f5e,
    roughness: 1,
  });
  const bedroomRug = new THREE.Mesh(rugRectGeometry, rugRectMaterial);
  bedroomRug.position.set(8, 0.01, -3.6);
  bedroomRug.receiveShadow = true;
  group.add(bedroomRug);
  const hallwayRug = new THREE.Mesh(rugRectGeometry, rugRectMaterial.clone());
  (hallwayRug.material as THREE.MeshStandardMaterial).color.set(0xa44a3f);
  hallwayRug.position.set(2, 0.01, -3.5);
  hallwayRug.rotation.y = Math.PI / 2;
  hallwayRug.receiveShadow = true;
  group.add(hallwayRug);
  disposables.push(rugRectGeometry, rugRectMaterial, hallwayRug.material as THREE.Material);

  // --- Windows with curtains (mounted on inner wall faces, non-solid) ---
  const addWindow = (x: number, z: number, rotationY: number) => {
    const window = new THREE.Group();
    window.position.set(x, 1.45, z);
    window.rotation.y = rotationY;
    // Frame and cross bars around a glowing "glass" pane.
    box(frameMaterial, window, 0, 0, 0, 1.7, 1.25, 0.08);
    box(glassMaterial, window, 0, 0, 0.02, 1.5, 1.05, 0.05);
    box(frameMaterial, window, 0, 0, 0.05, 0.06, 1.05, 0.04);
    box(frameMaterial, window, 0, 0, 0.05, 1.5, 0.06, 0.04);
    // Curtain rod plus two side panels.
    const rodGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 12).rotateZ(
      Math.PI / 2,
    );
    const rod = new THREE.Mesh(rodGeometry, frameMaterial);
    rod.position.set(0, 0.78, 0.16);
    window.add(rod);
    disposables.push(rodGeometry);
    box(curtainMaterial, window, -0.95, -0.05, 0.14, 0.4, 1.65, 0.07);
    box(curtainMaterial, window, 0.95, -0.05, 0.14, 0.4, 1.65, 0.07);
    group.add(window);
  };
  addWindow(-5, -7.8, 0); // north wall, living area
  addWindow(7, -7.8, 0); // north wall, bedroom
  addWindow(-10.8, 2, Math.PI / 2); // west wall, lounge
  addWindow(3, 7.8, Math.PI); // south wall

  // --- Bookshelves with colored books (solid) ---
  const bookPalette = [0xb04a4a, 0x4a6fb0, 0x4ab06f, 0xb0974a, 0x7d5ba6].map(
    (color) => {
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      disposables.push(material);
      return material;
    },
  );
  const addBookshelf = (x: number, z: number, rotationY: number) => {
    const shelf = new THREE.Group();
    shelf.position.set(x, 0, z);
    shelf.rotation.y = rotationY;
    box(woodMaterial, shelf, 0, 0.9, 0, 1.8, 1.8, 0.45); // carcass
    for (const shelfY of [0.55, 1.15]) {
      let bookX = -0.7;
      let i = 0;
      while (bookX < 0.65) {
        const width = 0.12 + ((i * 7) % 5) * 0.02;
        const height = 0.34 + ((i * 3) % 4) * 0.04;
        box(
          bookPalette[i % bookPalette.length],
          shelf,
          bookX + width / 2,
          shelfY + height / 2 - 0.05,
          0.24,
          width,
          height,
          0.2,
        );
        bookX += width + 0.025;
        i++;
      }
    }
    group.add(shelf);
    const halfW = rotationY === 0 || rotationY === Math.PI ? 0.9 : 0.25;
    const halfD = rotationY === 0 || rotationY === Math.PI ? 0.25 : 0.9;
    colliders.push({
      minX: x - halfW,
      maxX: x + halfW,
      minZ: z - halfD,
      maxZ: z + halfD,
    });
  };
  addBookshelf(-9, -7.5, 0); // against north wall, kitchen side
  addBookshelf(10.6, 2.5, -Math.PI / 2); // against east wall, lounge

  // --- Trash can (solid) ---
  const canGeometry = new THREE.CylinderGeometry(0.26, 0.22, 0.62, 20);
  const can = new THREE.Mesh(canGeometry, metalMaterial);
  can.position.set(-8.2, 0.31, -4.9);
  can.castShadow = true;
  can.receiveShadow = true;
  group.add(can);
  const rimGeometry = new THREE.TorusGeometry(0.26, 0.025, 8, 24).rotateX(
    Math.PI / 2,
  );
  const rim = new THREE.Mesh(rimGeometry, metalMaterial);
  rim.position.set(-8.2, 0.62, -4.9);
  group.add(rim);
  disposables.push(canGeometry, rimGeometry);
  colliders.push({ minX: -8.5, maxX: -7.9, minZ: -5.2, maxZ: -4.6 });

  return {
    group,
    colliders,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
