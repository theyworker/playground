import * as THREE from "three";
import { Kit } from "../pac-meeting/mansion-kit";
import { finish, sharedMaterial } from "./materials";
import {
  groundSurface,
  lightPoolTexture,
  plankMaterial,
  proceduralTexture,
  surfaceMaterial,
} from "./textures";
import type { GroundKind } from "./textures";
import type { SceneSetting } from "./types";

// Setting-driven stage dressing. Every scene resolves to a small token
// palette (sky, sun, ambient, fog, ground) so its look is one deliberate
// decision instead of defaults, then the geometry side adds exactly one
// signature atmospheric move per setting: drifting clouds for the sunny
// park, a rain-streaked window with a cool light pool for the cafe, and
// a glowing golden-hour horizon for the late-afternoon street.
//
// Intensities assume ACES filmic tone mapping on the renderer (which
// compresses mids), a hemisphere ambient, and a low-level IBL room
// environment — see stage-scene.ts.

export interface ScenePalette {
  skyTop: number;
  skyBottom: number;
  /** Optional warm band blended into the horizon (golden hour). */
  horizonGlow?: number;
  sun: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  /** Hemisphere sky tint — the soft ambient from above. */
  ambient: number;
  ambientIntensity: number;
  /** Hemisphere ground-bounce tint, from the location's surface. */
  groundBounce: number;
  /** scene.environmentIntensity for the neutral IBL room. */
  envIntensity: number;
  /** Distance fog tuned to the depth grid (fg z=4, bg z=-5, camera z=10)
   *  so the background row reads as further away. */
  fog: number;
  fogNear: number;
  fogFar: number;
  ground: number;
  groundKind: GroundKind;
}

export interface EnvironmentBuild {
  group: THREE.Group;
  palette: ScenePalette;
  update: (elapsed: number) => void;
  dispose: () => void;
}

// Room footprint; walls are low enough that the clamped camera sees over
// them, and rain only spawns outside this box.
const ROOM_HALF_X = 8;
const ROOM_BACK_Z = -8;
const ROOM_FRONT_Z = 7;
const WALL_HEIGHT = 3.1;
const WALL_THICKNESS = 0.25;

// Window opening in the right wall. The clamped camera (z=10, fov 50)
// only sees the x=8 wall for z below about -0.7, so the window sits in
// the midground-back stretch to stay on screen.
const WINDOW = { zMin: -4.4, zMax: -1.6, yMin: 0.9, yMax: 2.4 } as const;

const RAIN_COUNT = 600;
const RAIN_TOP = 11;

function groundFor(setting: SceneSetting): { kind: GroundKind; tint: number } {
  const location = setting.location.toLowerCase();
  if (/park|garden|forest|lawn/.test(location)) {
    return { kind: "grass", tint: 0x2d4a23 };
  }
  if (/street|bus|road|stop|city|sidewalk/.test(location)) {
    return { kind: "asphalt", tint: 0x35383f };
  }
  if (/beach|sand/.test(location)) {
    return { kind: "sand", tint: 0xc4ab7a };
  }
  return { kind: "stone", tint: 0x4a5160 };
}

export function paletteFor(setting: SceneSetting): ScenePalette {
  const time = setting.time_of_day.toLowerCase();
  const ground = groundFor(setting);
  // Bright-day defaults.
  const palette: ScenePalette = {
    skyTop: 0x4f87c7,
    skyBottom: 0xcfe4f4,
    sun: 0xffffff,
    sunIntensity: 1.8,
    sunPosition: [6, 12, 4],
    ambient: 0xcdd6e8,
    ambientIntensity: 0.65,
    groundBounce: ground.tint,
    envIntensity: 0.5,
    fog: 0xc2dcef,
    fogNear: 13,
    fogFar: 32,
    ground: ground.tint,
    groundKind: ground.kind,
  };
  if (time.includes("morning")) {
    palette.skyTop = 0x4d8ed1;
    palette.skyBottom = 0xd9edf9;
    palette.sun = 0xfff3d6;
    palette.sunIntensity = 1.9;
    palette.ambient = 0xbfd4ff;
    palette.ambientIntensity = 0.7;
    palette.fog = 0xcde4f4;
  } else if (time.includes("afternoon")) {
    // Golden hour: low western sun, warm horizon band, warm haze.
    palette.skyTop = 0x5e5a8e;
    palette.skyBottom = 0xe8a25e;
    palette.horizonGlow = 0xffd9a0;
    palette.sun = 0xffc98a;
    palette.sunIntensity = 1.6;
    palette.sunPosition = [-8, 6, 5];
    palette.ambient = 0xd9c2a6;
    palette.ambientIntensity = 0.65;
    palette.fog = 0xdca878;
    palette.fogNear = 12;
    palette.fogFar = 30;
  } else if (/evening|night|dusk/.test(time)) {
    palette.skyTop = 0x0c1126;
    palette.skyBottom = 0x2c3354;
    palette.sun = 0x8ca3d9;
    palette.sunIntensity = 0.7;
    palette.sunPosition = [-4, 8, -3];
    palette.ambient = 0x39406b;
    palette.ambientIntensity = 0.55;
    palette.envIntensity = 0.18;
    palette.fog = 0x222a44;
    palette.fogNear = 14;
    palette.fogFar = 34;
  }
  const rainy = /rain|storm|drizzle/.test(setting.weather.toLowerCase());
  if (rainy) {
    // Overcast: flatter light, gray sky, closer haze.
    palette.sunIntensity *= 0.45;
    palette.ambientIntensity *= 0.85;
    palette.envIntensity *= 0.7;
    palette.skyTop = 0x525c6a;
    palette.skyBottom = 0x8d96a1;
    palette.fog = 0x78828e;
    palette.fogNear = 11;
    palette.fogFar = 28;
  }
  if (setting.indoor) {
    // Warm interior tokens; the sky band above the walls stays whatever
    // the weather outside says it is.
    palette.ambient = 0xe8d9c0;
    palette.ambientIntensity = 0.75;
    palette.groundBounce = 0x5a4632;
    palette.envIntensity = 0.45;
    palette.fogNear = 16;
    palette.fogFar = 40;
    if (rainy) {
      palette.skyTop = 0x3a4250;
      palette.skyBottom = 0x6a7480;
      palette.fog = 0x555f6b;
    }
  }
  return palette;
}

// ---------------------------------------------------------------------------
// Weather + signature moves
// ---------------------------------------------------------------------------

/** Rain as one InstancedMesh of textured streak planes (a single draw
 *  call); each instance just translates downward on a seeded loop. */
function buildRain(kit: Kit, indoor: boolean): {
  update: (elapsed: number) => void;
} {
  const xs = new Float32Array(RAIN_COUNT);
  const zs = new Float32Array(RAIN_COUNT);
  const seeds = new Float32Array(RAIN_COUNT);
  const speeds = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i++) {
    let x = 0;
    let z = 0;
    // Indoors the room has no roof the camera can see through, so keep
    // drops outside its footprint.
    do {
      x = (Math.random() - 0.5) * 28;
      z = -12 + Math.random() * 22;
    } while (
      indoor &&
      Math.abs(x) < ROOM_HALF_X + 0.4 &&
      z > ROOM_BACK_Z - 0.4 &&
      z < ROOM_FRONT_Z + 0.4
    );
    xs[i] = x;
    zs[i] = z;
    seeds[i] = Math.random() * RAIN_TOP;
    speeds[i] = 6 + Math.random() * 3;
  }
  const streak = proceduralTexture("raindrop", 32, 32, (ctx) => {
    const gradient = ctx.createLinearGradient(16, 2, 16, 30);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(16, 3);
    ctx.lineTo(16, 29);
    ctx.stroke();
  });
  const geometry = kit.track(new THREE.PlaneGeometry(0.018, 0.3));
  const material = kit.track(
    new THREE.MeshBasicMaterial({
      map: streak,
      color: 0xaebdd4,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  const mesh = new THREE.InstancedMesh(geometry, material, RAIN_COUNT);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  kit.group.add(mesh);

  // Constant slight slant; only the translation changes per frame.
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.07));
  const scale = new THREE.Vector3(1, 1, 1);
  const position = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  return {
    update: (elapsed) => {
      for (let i = 0; i < RAIN_COUNT; i++) {
        position.set(
          xs[i],
          RAIN_TOP - ((seeds[i] + elapsed * speeds[i]) % RAIN_TOP),
          zs[i],
        );
        matrix.compose(position, rotation, scale);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A few puffy clouds drifting over the background row — the sunny
 *  park's signature move. */
function buildClouds(kit: Kit): { update: (elapsed: number) => void } {
  const material = sharedMaterial({ color: 0xf4f7fb, roughness: 1 });
  const puffGeometry = kit.track(new THREE.SphereGeometry(1, 10, 8));
  const clouds: { group: THREE.Group; baseX: number }[] = [];
  const placements: [number, number, number][] = [
    [-7, 8.5, -13],
    [3.5, 9.6, -15],
    [9, 7.8, -12],
  ];
  for (const [x, y, z] of placements) {
    const cloud = new THREE.Group();
    cloud.position.set(x, y, z);
    kit.group.add(cloud);
    const puffs: [number, number, number, number][] = [
      [0, 0, 0, 1.5], // center
      [-1.4, -0.12, 0.2, 1.0],
      [1.3, -0.1, -0.15, 1.1],
    ];
    for (const [px, py, pz, s] of puffs) {
      const puff = new THREE.Mesh(puffGeometry, material);
      puff.position.set(px, py, pz);
      puff.scale.set(s * 1.15, s * 0.5, s * 0.75);
      cloud.add(puff);
    }
    clouds.push({ group: cloud, baseX: x });
  }
  return {
    update: (elapsed) => {
      clouds.forEach((cloud, i) => {
        cloud.group.position.x = cloud.baseX + Math.sin(elapsed * 0.04 + i * 2.1) * 0.7;
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Indoor room
// ---------------------------------------------------------------------------

/** The right wall, split into segments around a framed window so rain and
 *  daylight read from inside — the cafe's signature move. */
function buildWindowWall(kit: Kit, wall: THREE.Material, trim: THREE.Material) {
  const x = ROOM_HALF_X;
  const { zMin, zMax, yMin, yMax } = WINDOW;
  const segment = (y: number, h: number, zCenter: number, d: number) =>
    kit.box(wall, x, y, zCenter, WALL_THICKNESS, h, d);
  // Full-height runs on either side of the opening.
  segment(WALL_HEIGHT / 2, WALL_HEIGHT, (ROOM_BACK_Z + zMin) / 2, zMin - ROOM_BACK_Z);
  segment(WALL_HEIGHT / 2, WALL_HEIGHT, (zMax + ROOM_FRONT_Z) / 2, ROOM_FRONT_Z - zMax);
  // Sill band below and header above the opening.
  const zCenter = (zMin + zMax) / 2;
  const opening = zMax - zMin;
  segment(yMin / 2, yMin, zCenter, opening);
  segment((yMax + WALL_HEIGHT) / 2, WALL_HEIGHT - yMax, zCenter, opening);
  // Frame, mullions, and a single glass pane.
  const inner = x - WALL_THICKNESS / 2 - 0.02;
  const frameD = 0.1;
  for (const y of [yMin, yMax]) {
    kit.box(trim, inner, y, zCenter, frameD, 0.08, opening + 0.12);
  }
  for (const z of [zMin, zMax]) {
    kit.box(trim, inner, (yMin + yMax) / 2, z, frameD, yMax - yMin, 0.08);
  }
  kit.box(trim, inner, (yMin + yMax) / 2, zCenter, 0.06, yMax - yMin, 0.05); // mullion
  kit.box(trim, inner, (yMin + yMax) / 2, zCenter, 0.06, 0.05, opening); // transom
  const glass = finish.glass(0xd2e4ec);
  kit.box(glass, x, (yMin + yMax) / 2, zCenter, 0.04, yMax - yMin, opening);
  // Cool daylight pooling in from the window onto the warm floor.
  const poolMaterial = kit.track(
    new THREE.MeshBasicMaterial({
      map: lightPoolTexture(),
      color: 0xbfd4ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const poolGeometry = kit.track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const pool = new THREE.Mesh(poolGeometry, poolMaterial);
  pool.position.set(x - 1.6, 0.015, zCenter);
  pool.scale.set(2.8, 1, 2.0);
  kit.group.add(pool);
}

function buildRoom(kit: Kit, rainy: boolean) {
  const floor = plankMaterial(0x6b4a2c);
  // Striped wallpaper with a dot motif (same pattern language as the
  // pac-meeting house) so interiors read lived-in rather than bare.
  const wall = surfaceMaterial(
    "wallpaper", 128, 128,
    (ctx) => {
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
    },
    { roughness: 0.95, repeat: [10, 2] },
  );
  const trim = sharedMaterial({ color: 0x4a3a28, roughness: 0.85 });
  const width = ROOM_HALF_X * 2;
  const depth = ROOM_FRONT_Z - ROOM_BACK_Z;
  const centerZ = (ROOM_FRONT_Z + ROOM_BACK_Z) / 2;
  kit.box(floor, 0, -0.06, centerZ, width, 0.12, depth);
  kit.box(wall, 0, WALL_HEIGHT / 2, ROOM_BACK_Z, width, WALL_HEIGHT, WALL_THICKNESS);
  kit.box(wall, -ROOM_HALF_X, WALL_HEIGHT / 2, centerZ, WALL_THICKNESS, WALL_HEIGHT, depth);
  buildWindowWall(kit, wall, trim);
  // Baseboards along every wall.
  kit.box(trim, 0, 0.12, ROOM_BACK_Z + WALL_THICKNESS / 2 + 0.04, width, 0.24, 0.06);
  for (const side of [-1, 1]) {
    kit.box(
      trim,
      side * (ROOM_HALF_X - WALL_THICKNESS / 2 - 0.04),
      0.12,
      centerZ,
      0.06,
      0.24,
      depth - 0.5,
    );
  }
  // Pavement outside the room so rain doesn't fall on the void; rain
  // leaves it dark and glossy, with a few standing puddles.
  const pavement = rainy
    ? sharedMaterial({ color: 0x23262c, roughness: 0.3, metalness: 0.06 })
    : sharedMaterial({ color: 0x33363d, roughness: 1 });
  const outsideGeometry = kit.track(
    new THREE.CircleGeometry(15, 48).rotateX(-Math.PI / 2),
  );
  const outside = new THREE.Mesh(outsideGeometry, pavement);
  outside.position.y = -0.14;
  outside.receiveShadow = true;
  kit.group.add(outside);
  if (rainy) {
    const puddle = sharedMaterial({ color: 0x3a4654, roughness: 0.06, metalness: 0.15 });
    const puddleGeometry = kit.track(
      new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2),
    );
    const spots: [number, number, number, number] [] = [
      [10.6, 4.2, 1.1, 0.7],
      [-10.2, 5.6, 0.9, 0.55],
      [9.9, -9.8, 1.3, 0.8],
      [-9.7, -10.3, 1.0, 0.6],
    ];
    for (const [px, pz, sx, sz] of spots) {
      const mesh = new THREE.Mesh(puddleGeometry, puddle);
      mesh.position.set(px, -0.132, pz);
      mesh.scale.set(sx, 1, sz);
      kit.group.add(mesh);
    }
  }
}

// ---------------------------------------------------------------------------

export function buildEnvironment(setting: SceneSetting): EnvironmentBuild {
  const kit = new Kit();
  const palette = paletteFor(setting);
  const rainy = /rain|storm|drizzle/.test(setting.weather.toLowerCase());
  const sunny = /sun|cloud/.test(setting.weather.toLowerCase());

  if (setting.indoor) {
    buildRoom(kit, rainy);
  } else {
    const ground = groundSurface(palette.groundKind, palette.ground);
    const groundGeometry = kit.track(
      new THREE.CircleGeometry(15, 64).rotateX(-Math.PI / 2),
    );
    const groundMesh = new THREE.Mesh(groundGeometry, ground);
    groundMesh.receiveShadow = true;
    kit.group.add(groundMesh);
  }

  const updates: ((elapsed: number) => void)[] = [];
  if (rainy) updates.push(buildRain(kit, setting.indoor).update);
  // Clouds only for bright outdoor weather that mentions them.
  if (!setting.indoor && !rainy && sunny) {
    updates.push(buildClouds(kit).update);
  }

  const { group, dispose } = kit.build();
  return {
    group,
    palette,
    update: (elapsed) => updates.forEach((fn) => fn(elapsed)),
    dispose,
  };
}
