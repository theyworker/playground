import * as THREE from "three";
import type { Collider } from "./house";
import { drawAustralianFlag, drawNamePlate, drawStatuePlaque } from "./lake-art";

// The lake behind (east of) Tycoon House — now ~25x23, centered (36.5, 26) —
// with the very large Tycoon Yatch moored mid-water and a statue on shore.

const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec3 pos = position;
    pos.y += sin(pos.x * 0.7 + uTime) * 0.035
           + cos(pos.z * 0.9 + uTime * 1.3) * 0.035;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    float dist = length((vUv - 0.5) * 2.0);
    if (dist > 1.0) discard;

    float ripple = sin(vWorld.x * 1.6 + uTime * 0.9)
                 * sin(vWorld.z * 1.9 - uTime * 1.1);
    float swell = sin((vWorld.x + vWorld.z) * 0.7 + uTime * 0.6);

    vec3 color = mix(uShallow, uDeep, smoothstep(0.1, 0.85, 1.0 - dist));
    color += vec3(0.10, 0.14, 0.16) * ripple * 0.4 + vec3(0.04) * swell;
    float glint = pow(max(0.0, ripple * swell), 8.0);
    color += vec3(0.55, 0.6, 0.55) * glint;

    float edgeFade = smoothstep(1.0, 0.94, dist);
    gl_FragColor = vec4(color, edgeFade * 0.96);
  }
`;

const FLAG_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Pinned at the hoist, waving toward the fly.
    pos.z += sin(pos.x * 5.0 - uTime * 5.0) * 0.08 * uv.x;
    pos.y += sin(pos.x * 3.0 - uTime * 3.4) * 0.03 * uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FLAG_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;

  void main() {
    gl_FragColor = texture2D(uMap, vUv);
  }
`;

export function buildLake(): {
  group: THREE.Group;
  colliders: Collider[];
  update: (delta: number) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const colliders: Collider[] = [];
  const disposables: { dispose: () => void }[] = [];

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const hullWhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6f5f0,
    roughness: 0.25,
    metalness: 0.1,
  });
  const hullNavyMaterial = new THREE.MeshStandardMaterial({
    color: 0x16243c,
    roughness: 0.3,
    metalness: 0.3,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a44a,
    metalness: 0.85,
    roughness: 0.25,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2530,
    metalness: 0.5,
    roughness: 0.1,
  });
  const teakMaterial = new THREE.MeshStandardMaterial({ color: 0x9a7b52 });
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b4a8,
    roughness: 0.9,
  });
  disposables.push(
    unitBox, hullWhiteMaterial, hullNavyMaterial, goldMaterial,
    glassMaterial, teakMaterial, stoneMaterial,
  );

  const box = (
    material: THREE.Material,
    parent: THREE.Object3D,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
  ) => {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // --- The lake: sandy rim + shader water with moving ripples ---
  const rimGeometry = new THREE.CircleGeometry(13.4, 56).rotateX(-Math.PI / 2);
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b98a });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.position.set(36.5, -0.006, 26);
  rim.scale.set(1, 1, 0.91);
  rim.receiveShadow = true;
  group.add(rim);
  disposables.push(rimGeometry, rimMaterial);

  const waterGeometry = new THREE.PlaneGeometry(25.2, 22.8, 48, 44).rotateX(
    -Math.PI / 2,
  );
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x10384f) },
      uShallow: { value: new THREE.Color(0x2e7390) },
    },
    vertexShader: WATER_VERTEX,
    fragmentShader: WATER_FRAGMENT,
    transparent: true,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(36.5, 0.03, 26);
  group.add(water);
  disposables.push(waterGeometry, waterMaterial);

  // No walking on water: AABB strips tiling the ellipse.
  colliders.push(
    { minX: 29, maxX: 44, minZ: 15.2, maxZ: 19 },
    { minX: 25.5, maxX: 47.5, minZ: 19, maxZ: 23 },
    { minX: 24.2, maxX: 48.8, minZ: 23, maxZ: 29 },
    { minX: 25.5, maxX: 47.5, minZ: 29, maxZ: 33 },
    { minX: 29, maxX: 44, minZ: 33, maxZ: 36.8 },
  );

  // --- The Tycoon Yatch, superyacht edition (~18 units stem to stern) ---
  const yacht = new THREE.Group();
  yacht.position.set(37, 0, 26);
  yacht.rotation.y = 0.5;

  box(hullNavyMaterial, yacht, 0, 0.32, 0, 4.2, 0.6, 14); // lower hull
  box(hullWhiteMaterial, yacht, 0, 0.9, 0, 4.4, 0.58, 14.4); // upper hull
  box(goldMaterial, yacht, 0, 0.62, 0, 4.45, 0.05, 14.45); // waterline stripe
  // Rounded bow: a squashed smooth cone.
  const bowGeometry = new THREE.ConeGeometry(2.2, 4.4, 24).rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeometry, hullWhiteMaterial);
  bow.scale.set(0.98, 0.2, 1);
  bow.position.set(0, 0.75, -9.1);
  bow.castShadow = true;
  yacht.add(bow);
  disposables.push(bowGeometry);
  // Rounded stern.
  const sternGeometry = new THREE.CylinderGeometry(2.18, 2.18, 1.16, 24, 1, false, 0, Math.PI);
  const stern = new THREE.Mesh(sternGeometry, hullWhiteMaterial);
  stern.scale.set(1, 1, 0.7);
  stern.position.set(0, 0.61, 7.2);
  stern.castShadow = true;
  yacht.add(stern);
  disposables.push(sternGeometry);

  // Decks stepping back, wrapped in dark glazing with gold trim.
  box(teakMaterial, yacht, 0, 1.22, 0.2, 3.9, 0.06, 13.4); // teak main deck
  box(hullWhiteMaterial, yacht, 0, 1.62, 0.8, 3.6, 0.75, 9.6);
  box(glassMaterial, yacht, 0, 1.68, 0.8, 3.66, 0.34, 9.0);
  box(goldMaterial, yacht, 0, 2.01, 0.8, 3.68, 0.04, 9.65);
  box(hullWhiteMaterial, yacht, 0, 2.32, 1.5, 2.9, 0.68, 6.6);
  box(glassMaterial, yacht, 0, 2.36, 1.5, 2.96, 0.3, 6.1);
  box(goldMaterial, yacht, 0, 2.67, 1.5, 2.98, 0.04, 6.65);
  // Bridge with raked windshield and flying roof.
  box(glassMaterial, yacht, 0, 2.95, 0.7, 2.2, 0.55, 2.6);
  const windshield = box(glassMaterial, yacht, 0, 2.95, -0.85, 2.1, 0.1, 1.3);
  windshield.rotation.x = -0.45;
  box(hullWhiteMaterial, yacht, 0, 3.28, 0.9, 2.6, 0.1, 3.4);
  // Radar arch, mast, and dome.
  const archLeft = box(hullWhiteMaterial, yacht, -1.0, 3.6, 2.4, 0.12, 0.65, 0.5);
  archLeft.rotation.z = 0.25;
  const archRight = box(hullWhiteMaterial, yacht, 1.0, 3.6, 2.4, 0.12, 0.65, 0.5);
  archRight.rotation.z = -0.25;
  box(hullWhiteMaterial, yacht, 0, 3.92, 2.4, 2.0, 0.1, 0.5);
  const domeGeometry = new THREE.SphereGeometry(0.18, 14, 10);
  const dome = new THREE.Mesh(domeGeometry, hullWhiteMaterial);
  dome.position.set(0, 4.1, 2.4);
  yacht.add(dome);
  disposables.push(domeGeometry);
  const mastGeometry = new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8);
  const mast = new THREE.Mesh(mastGeometry, goldMaterial);
  mast.position.set(0, 4.3, 2.1);
  yacht.add(mast);
  disposables.push(mastGeometry);

  // Gold deck railings and foredeck details.
  box(goldMaterial, yacht, -1.86, 1.55, 0.2, 0.05, 0.2, 12.8);
  box(goldMaterial, yacht, 1.86, 1.55, 0.2, 0.05, 0.2, 12.8);
  box(goldMaterial, yacht, 0, 1.55, 7.05, 3.7, 0.2, 0.05);
  for (const lx of [-0.8, 0.4]) {
    const lounger = box(hullWhiteMaterial, yacht, lx, 1.32, -5.2, 0.6, 0.14, 1.5);
    lounger.rotation.y = 0.12;
  }
  const tubGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.34, 20);
  const tub = new THREE.Mesh(tubGeometry, hullWhiteMaterial);
  tub.position.set(0, 2.1, 5.6);
  yacht.add(tub);
  const tubWaterGeometry = new THREE.CircleGeometry(0.72, 20).rotateX(-Math.PI / 2);
  const tubWaterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3aa8c9,
    roughness: 0.1,
  });
  const tubWater = new THREE.Mesh(tubWaterGeometry, tubWaterMaterial);
  tubWater.position.set(0, 2.28, 5.6);
  yacht.add(tubWater);
  disposables.push(tubGeometry, tubWaterGeometry, tubWaterMaterial);

  // Name plates: both sides of the hull and the stern.
  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = 256;
  plateCanvas.height = 48;
  drawNamePlate(plateCanvas.getContext("2d")!);
  const plateTexture = new THREE.CanvasTexture(plateCanvas);
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plateTexture });
  const plateGeometry = new THREE.PlaneGeometry(3.0, 0.55);
  disposables.push(plateTexture, plateMaterial, plateGeometry);
  for (const side of [1, -1]) {
    const plate = new THREE.Mesh(plateGeometry, plateMaterial);
    plate.position.set(side * 2.21, 0.9, 4.2);
    plate.rotation.y = (side * Math.PI) / 2;
    yacht.add(plate);
  }
  const sternPlate = new THREE.Mesh(plateGeometry, plateMaterial);
  sternPlate.position.set(0, 0.9, 8.74);
  yacht.add(sternPlate);

  // Australian flag on a stern pole, waving in the shader breeze.
  const poleGeometry = new THREE.CylinderGeometry(0.03, 0.04, 1.7, 8);
  const pole = new THREE.Mesh(poleGeometry, goldMaterial);
  pole.position.set(0, 2.1, 7.9);
  pole.rotation.x = 0.25; // raked aft, ensign style
  yacht.add(pole);
  disposables.push(poleGeometry);
  const flagCanvas = document.createElement("canvas");
  flagCanvas.width = 256;
  flagCanvas.height = 128;
  drawAustralianFlag(flagCanvas.getContext("2d")!);
  const flagTexture = new THREE.CanvasTexture(flagCanvas);
  const flagMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: flagTexture } },
    vertexShader: FLAG_VERTEX,
    fragmentShader: FLAG_FRAGMENT,
    side: THREE.DoubleSide,
  });
  const flagGeometry = new THREE.PlaneGeometry(1.4, 0.75, 18, 8);
  const flag = new THREE.Mesh(flagGeometry, flagMaterial);
  flag.position.set(0.72, 2.85, 8.1);
  group.add(yacht);
  flag.rotation.y = 0; // trails to starboard with the breeze
  yacht.add(flag);
  disposables.push(flagTexture, flagMaterial, flagGeometry);

  // --- Statue of the boy Tycoon on the shore ---
  const statue = new THREE.Group();
  statue.position.set(23.5, 0, 22.8);
  statue.rotation.y = Math.PI / 2; // gazing out over the water
  box(stoneMaterial, statue, 0, 0.25, 0, 0.85, 0.5, 0.85); // pedestal
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
  const torsoGeometry = new THREE.CapsuleGeometry(0.13, 0.22, 4, 10);
  const headGeometry = new THREE.SphereGeometry(0.12, 12, 10);
  const armGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8);
  disposables.push(legGeometry, torsoGeometry, headGeometry, armGeometry);
  for (const lx of [-0.08, 0.08]) {
    const leg = new THREE.Mesh(legGeometry, stoneMaterial);
    leg.position.set(lx, 0.675, 0);
    leg.castShadow = true;
    statue.add(leg);
  }
  const torso = new THREE.Mesh(torsoGeometry, stoneMaterial);
  torso.position.set(0, 1.08, 0);
  torso.castShadow = true;
  statue.add(torso);
  const head = new THREE.Mesh(headGeometry, stoneMaterial);
  head.position.set(0, 1.45, 0);
  head.castShadow = true;
  statue.add(head);
  const armDown = new THREE.Mesh(armGeometry, stoneMaterial);
  armDown.position.set(-0.19, 1.05, 0);
  armDown.rotation.z = 0.15;
  statue.add(armDown);
  const armUp = new THREE.Mesh(armGeometry, stoneMaterial);
  armUp.position.set(0.21, 1.28, 0.06);
  armUp.rotation.z = -2.4; // raised, waving at the yacht
  statue.add(armUp);
  // One plaque per pedestal face.
  const plaqueCanvas = document.createElement("canvas");
  plaqueCanvas.width = 256;
  plaqueCanvas.height = 64;
  drawStatuePlaque(plaqueCanvas.getContext("2d")!);
  const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas);
  const plaqueMaterial = new THREE.MeshStandardMaterial({ map: plaqueTexture });
  const plaqueGeometry = new THREE.PlaneGeometry(0.66, 0.165);
  disposables.push(plaqueTexture, plaqueMaterial, plaqueGeometry);
  const plaqueSides: [number, number, number][] = [
    [0, -0.43, Math.PI],
    [0, 0.43, 0],
    [-0.43, 0, -Math.PI / 2],
    [0.43, 0, Math.PI / 2],
  ];
  for (const [px, pz, rotationY] of plaqueSides) {
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial);
    plaque.position.set(px, 0.27, pz);
    plaque.rotation.y = rotationY;
    statue.add(plaque);
  }
  group.add(statue);
  colliders.push({ minX: 23.05, maxX: 23.95, minZ: 22.35, maxZ: 23.25 });

  let time = 0;
  const update = (delta: number) => {
    time += delta;
    waterMaterial.uniforms.uTime.value = time;
    flagMaterial.uniforms.uTime.value = time;
    // A gentle ride at anchor.
    yacht.position.y = Math.sin(time * 0.6) * 0.05;
    yacht.rotation.x = Math.sin(time * 0.5) * 0.008;
    yacht.rotation.z = Math.sin(time * 0.43 + 1) * 0.012;
  };

  return {
    group,
    colliders,
    update,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
