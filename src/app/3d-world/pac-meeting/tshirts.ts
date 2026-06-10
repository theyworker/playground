import * as THREE from "three";

export type Shirt = { group: THREE.Group; color: number };

const SHIRT_COLORS = [0x1f3fd6, 0xe6c300, 0x148f2f, 0xc51111, 0x7a2fc4];

// Inside the SE walk-in closet (x 7..14, z 4..10).
const SHIRT_POSITIONS: [number, number][] = [
  [8.6, 8.6],
  [10.2, 5.8],
  [11.6, 8.6],
  [12.9, 5.8],
  [13.1, 8.8],
];

// Spinning pickup t-shirts: walk through one to take its color.
export function buildTshirts(): {
  group: THREE.Group;
  shirts: Shirt[];
  dispose: () => void;
} {
  const group = new THREE.Group();
  const shirts: Shirt[] = [];
  const disposables: { dispose: () => void }[] = [];

  const torsoGeometry = new THREE.BoxGeometry(0.5, 0.55, 0.08);
  const sleeveGeometry = new THREE.BoxGeometry(0.18, 0.3, 0.08);
  const hangerGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8);
  disposables.push(torsoGeometry, sleeveGeometry, hangerGeometry);

  for (let i = 0; i < SHIRT_COLORS.length; i++) {
    const color = SHIRT_COLORS[i];
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    disposables.push(material);

    const shirt = new THREE.Group();
    const torso = new THREE.Mesh(torsoGeometry, material);
    torso.castShadow = true;
    const leftSleeve = new THREE.Mesh(sleeveGeometry, material);
    leftSleeve.position.set(-0.31, 0.14, 0);
    leftSleeve.rotation.z = 0.5;
    const rightSleeve = new THREE.Mesh(sleeveGeometry, material);
    rightSleeve.position.set(0.31, 0.14, 0);
    rightSleeve.rotation.z = -0.5;
    const hanger = new THREE.Mesh(hangerGeometry, material);
    hanger.position.y = 0.38;
    shirt.add(torso, leftSleeve, rightSleeve, hanger);

    const [x, z] = SHIRT_POSITIONS[i];
    shirt.position.set(x, 1.15, z);
    shirt.rotation.y = (i / SHIRT_COLORS.length) * Math.PI * 2;
    group.add(shirt);
    shirts.push({ group: shirt, color });
  }

  return {
    group,
    shirts,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
