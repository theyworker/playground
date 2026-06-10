import * as THREE from "three";

export const INNER_RADIUS = 0.62;
export const BEER_BOTTOM = 0.3;
export const BEER_TOP = 1.78;

const FOAM_BLOB_COUNT = 14;

// Lathe profile traced from the bottom center, up the outer wall, over the
// lip, and back down the inner wall — gives the mug visibly thick glass.
const GLASS_PROFILE: [number, number][] = [
  [0, 0],
  [0.55, 0],
  [0.8, 0.05],
  [0.74, 0.3],
  [0.74, 1.82],
  [0.8, 1.92],
  [0.8, 2.0],
  [0.68, 2.0],
  [INNER_RADIUS, 1.9],
  [INNER_RADIUS, 0.28],
  [0, 0.26],
];

export function buildMug(): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // Alpha-blended glass (not transmission, which would hide the beer and
  // bubbles behind it) — realism comes from strong env reflections instead.
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf2f9ff,
    transparent: true,
    opacity: 0.14,
    roughness: 0.02,
    metalness: 0,
    ior: 1.52,
    specularIntensity: 1,
    envMapIntensity: 1.6,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const bodyGeometry = new THREE.LatheGeometry(
    GLASS_PROFILE.map(([x, y]) => new THREE.Vector2(x, y)),
    64,
  );
  const body = new THREE.Mesh(bodyGeometry, glassMaterial);
  body.renderOrder = 3;

  const handleGeometry = new THREE.TorusGeometry(0.42, 0.09, 16, 48, Math.PI);
  const handle = new THREE.Mesh(handleGeometry, glassMaterial);
  handle.position.set(0.78, 1.05, 0);
  handle.rotation.z = -Math.PI / 2;
  handle.renderOrder = 3;

  const beerGeometry = new THREE.CylinderGeometry(
    0.6,
    0.6,
    BEER_TOP - BEER_BOTTOM,
    48,
  );
  // Faint warm emissive fakes light scattering through the liquid; clearcoat
  // gives the surface a wet sheen.
  const beerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb8650a,
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    metalness: 0,
    emissive: 0x3a1d04,
    emissiveIntensity: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 0.8,
    depthWrite: false,
  });
  const beer = new THREE.Mesh(beerGeometry, beerMaterial);
  beer.position.y = (BEER_TOP + BEER_BOTTOM) / 2;
  beer.renderOrder = 2;

  // Sheen approximates the soft micro-scattering of foam; low env intensity
  // keeps it matte rather than plasticky.
  const foamMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff5e0,
    roughness: 1,
    sheen: 0.7,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xfffaf0),
    envMapIntensity: 0.4,
  });
  const foamBaseGeometry = new THREE.CylinderGeometry(0.61, 0.6, 0.32, 48);
  const foamBase = new THREE.Mesh(foamBaseGeometry, foamMaterial);
  foamBase.position.y = BEER_TOP + 0.16;

  const blobGeometry = new THREE.SphereGeometry(1, 16, 16);
  const blobs = new THREE.Group();
  for (let i = 0; i < FOAM_BLOB_COUNT; i++) {
    const blob = new THREE.Mesh(blobGeometry, foamMaterial);
    const angle = (i / FOAM_BLOB_COUNT) * Math.PI * 2;
    const radius = Math.random() * 0.45;
    blob.position.set(
      Math.cos(angle) * radius,
      BEER_TOP + 0.3 + Math.random() * 0.1,
      Math.sin(angle) * radius,
    );
    blob.scale.setScalar(0.1 + Math.random() * 0.1);
    blobs.add(blob);
  }
  // A couple of blobs spilling over the rim.
  for (const angle of [0.6, 2.4]) {
    const drip = new THREE.Mesh(blobGeometry, foamMaterial);
    drip.position.set(Math.cos(angle) * 0.72, 2.0, Math.sin(angle) * 0.72);
    drip.scale.set(0.11, 0.16, 0.11);
    blobs.add(drip);
  }

  group.add(body, handle, beer, foamBase, blobs);
  disposables.push(
    bodyGeometry,
    handleGeometry,
    beerGeometry,
    foamBaseGeometry,
    blobGeometry,
    glassMaterial,
    beerMaterial,
    foamMaterial,
  );

  return {
    group,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
