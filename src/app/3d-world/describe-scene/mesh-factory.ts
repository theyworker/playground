import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Kit } from "../pac-meeting/mansion-kit";
import { hash01 } from "./compile";
import { finish, sharedMaterial } from "./materials";
import {
  fitText,
  foliageMaterial,
  rng,
  surfaceMaterial,
  woodMaterial,
} from "./textures";
import { colorFromText, COLOR_WORDS } from "./palette";
import { buildPerson } from "./person";
import type { Update } from "./person";
import type { PlacedEntity } from "./compile";

// Procedural mesh factory: turns compiled PlacedEntity records into
// primitive-built figures and props, keyed entirely off descriptor/action
// text. No external assets — boxes, spheres, capsules, cylinders, and
// canvas textures only. Any descriptor without a mapping falls back to a
// tinted, labeled box so a scene can never fail to render.
//
// Materials come from the sharedMaterial cache (one instance per tint) and
// are never tracked on the kit — only geometries and canvas textures are
// per-scene disposables.

export interface BuiltScene {
  group: THREE.Group;
  update: (elapsed: number) => void;
  dispose: () => void;
  /** Descriptors that rendered as the placeholder fallback (asset gaps). */
  fallbacks: string[];
}

// A drawn plane backed by the procedural texture cache: the same key
// reuses the same texture/material across rebuilds and scene switches.
function canvasPlane(
  kit: Kit,
  parent: THREE.Object3D,
  key: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
  canvasW: number,
  canvasH: number,
  planeW: number,
  planeH: number,
  x: number,
  y: number,
  z: number,
  rotationY = 0,
  transparent = false,
): THREE.Mesh {
  const material = surfaceMaterial(key, canvasW, canvasH, draw, {
    roughness: 0.9,
    transparent,
  });
  const geometry = kit.track(new THREE.PlaneGeometry(planeW, planeH));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// Anomalies: still pure primitives; scale conveys "giant/tiny" oddities.
// ---------------------------------------------------------------------------

function anomalyScale(descriptor: string): number {
  const text = descriptor.toLowerCase();
  if (/giant|huge|enormous|massive/.test(text)) return 1.8;
  if (/tiny|mini(ature)?/.test(text)) return 0.55;
  return 1;
}

function buildScubaDiver(kit: Kit, parent: THREE.Group, entity: PlacedEntity): Update | undefined {
  const { rig, update } = buildPerson(kit, parent, entity, 0x23282f);
  const gearMaterial = sharedMaterial({ color: 0x8a929c, metalness: 0.5, roughness: 0.4 });
  const rubberMaterial = sharedMaterial({ color: 0x1b1e24, roughness: 0.9 });
  // Gear rides the rig parts so it follows pose, scale, and motion.
  const tankGeometry = kit.track(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 12));
  kit.mesh(tankGeometry, gearMaterial, 0, 0.32, -0.22, rig.torso); // tank on the back
  const maskGeometry = kit.track(new THREE.TorusGeometry(0.09, 0.025, 8, 16));
  kit.mesh(maskGeometry, gearMaterial, 0, 0.13, 0.1, rig.head); // mask across the face
  // Flippers: flat blades pointing forward from each foot.
  for (const leg of [rig.leftLeg, rig.rightLeg]) {
    kit.box(rubberMaterial, 0, -0.45, 0.22, 0.14, 0.035, 0.4, false, leg.joint);
  }
  return update;
}

function buildPenguin(kit: Kit, parent: THREE.Group): Update {
  const black = sharedMaterial({ color: 0x1d2026, roughness: 0.8 });
  const white = sharedMaterial({ color: 0xe9e9e2, roughness: 0.8 });
  const beak = sharedMaterial({ color: 0xd9882b, roughness: 0.7 });
  // Body parts live in their own group so the waddle sway is contained.
  const body = new THREE.Group();
  parent.add(body);
  const bodyGeometry = kit.track(new THREE.CapsuleGeometry(0.26, 0.3, 4, 12));
  kit.mesh(bodyGeometry, black, 0, 0.45, 0, body);
  const frontGeometry = kit.track(new THREE.CapsuleGeometry(0.2, 0.24, 4, 12));
  kit.mesh(frontGeometry, white, 0, 0.42, 0.09, body);
  const headGeometry = kit.track(new THREE.SphereGeometry(0.16, 14, 10));
  kit.mesh(headGeometry, black, 0, 0.92, 0, body);
  const beakGeometry = kit.track(new THREE.ConeGeometry(0.05, 0.14, 8).rotateX(Math.PI / 2));
  kit.mesh(beakGeometry, beak, 0, 0.9, 0.2, body);
  return (t) => {
    body.rotation.z = Math.sin(t * 2) * 0.05;
  };
}

function buildSnowman(kit: Kit, parent: THREE.Group): undefined {
  const snow = sharedMaterial({ color: 0xf2f4f7, roughness: 0.95 });
  const carrot = sharedMaterial({ color: 0xd9882b, roughness: 0.7 });
  const radii = [0.42, 0.3, 0.2];
  let y = 0;
  for (const radius of radii) {
    y += radius * 0.85;
    const geometry = kit.track(new THREE.SphereGeometry(radius, 16, 12));
    kit.mesh(geometry, snow, 0, y, 0, parent);
    y += radius * 0.7;
  }
  const noseGeometry = kit.track(new THREE.ConeGeometry(0.045, 0.2, 8).rotateX(Math.PI / 2));
  kit.mesh(noseGeometry, carrot, 0, y - 0.32, 0.2, parent);
  return undefined;
}

function buildHorse(kit: Kit, parent: THREE.Group): undefined {
  const coat = sharedMaterial({ color: 0x6b4a2c, roughness: 0.9 });
  const mane = sharedMaterial({ color: 0x33261a, roughness: 0.95 });
  kit.box(coat, 0, 1.05, 0, 0.5, 0.5, 1.2, false, parent); // body
  for (const [x, z] of [[-0.17, 0.45], [0.17, 0.45], [-0.17, -0.45], [0.17, -0.45]]) {
    kit.box(coat, x, 0.4, z, 0.13, 0.8, 0.13, false, parent);
  }
  const neck = kit.box(coat, 0, 1.5, 0.62, 0.2, 0.6, 0.2, false, parent);
  neck.rotation.x = -0.5;
  kit.box(coat, 0, 1.78, 0.85, 0.22, 0.24, 0.5, false, parent); // head
  kit.box(mane, 0, 1.62, 0.6, 0.08, 0.5, 0.12, false, parent);
  return undefined;
}

function buildSuitedDog(kit: Kit, parent: THREE.Group): undefined {
  const fur = sharedMaterial({ color: 0xb08d57, roughness: 0.9 });
  // The "suit" is a canvas texture wrapped on the body box.
  const suitBody = canvasPlane(
    kit, parent, "dog-suit",
    (ctx) => {
      ctx.fillStyle = "#2c3e63";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(64, 20); ctx.lineTo(44, 80); ctx.lineTo(84, 80);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#b33a3a";
      ctx.fillRect(58, 28, 12, 44); // tie
    },
    128, 128, 0.42, 0.4, 0, 0.45, 0.231,
  );
  suitBody.castShadow = true;
  const suitMaterial = sharedMaterial({ color: 0x2c3e63, roughness: 0.8 });
  kit.box(suitMaterial, 0, 0.45, 0, 0.4, 0.4, 0.46, false, parent);
  const headGeometry = kit.track(new THREE.SphereGeometry(0.16, 14, 10));
  kit.mesh(headGeometry, fur, 0, 0.82, 0.12, parent);
  const snoutGeometry = kit.track(new THREE.BoxGeometry(0.12, 0.09, 0.14));
  kit.mesh(snoutGeometry, fur, 0, 0.78, 0.3, parent);
  for (const x of [-0.12, 0.12]) {
    kit.box(fur, x, 0.12, 0.1, 0.1, 0.25, 0.1, false, parent);
  }
  const tail = kit.box(fur, 0, 0.5, -0.28, 0.06, 0.06, 0.2, false, parent);
  tail.rotation.x = -0.5;
  return undefined;
}

const ANOMALY_BUILDERS: [RegExp, (kit: Kit, parent: THREE.Group, entity: PlacedEntity) => Update | undefined][] = [
  [/scuba|wetsuit|flipper|diver/, buildScubaDiver],
  [/penguin/, (kit, parent) => buildPenguin(kit, parent)],
  [/snowman/, (kit, parent) => buildSnowman(kit, parent)],
  [/horse|pony/, (kit, parent) => buildHorse(kit, parent)],
  [/dog/, (kit, parent) => buildSuitedDog(kit, parent)],
];

// ---------------------------------------------------------------------------
// Objects: multi-primitive builds keyed off name + detail, designed so each
// prop is recognizable from its silhouette alone. Soft chamfers via
// RoundedBoxGeometry keep furniture from reading as programmer art, and all
// surfaces use the shared finish recipes for one cohesive material language.
// ---------------------------------------------------------------------------

type ObjectBuilder = (kit: Kit, parent: THREE.Group, entity: PlacedEntity) => Update | undefined;

// Rounded boxes are cached per kit by dimensions so repeated parts share.
const roundedCache = new WeakMap<Kit, Map<string, THREE.BufferGeometry>>();

function rbox(
  kit: Kit,
  material: THREE.Material,
  x: number, y: number, z: number,
  w: number, h: number, d: number,
  parent: THREE.Object3D,
  radius?: number,
): THREE.Mesh {
  const r = radius ?? Math.min(0.035, Math.min(w, h, d) * 0.24);
  let perKit = roundedCache.get(kit);
  if (!perKit) {
    perKit = new Map();
    roundedCache.set(kit, perKit);
  }
  const key = `${w}|${h}|${d}|${r}`;
  let geometry = perKit.get(key);
  if (!geometry) {
    geometry = kit.track(new RoundedBoxGeometry(w, h, d, 2, r));
    perKit.set(key, geometry);
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Soft contact blob under props: cheap grounding that the 1024px shadow map
// can miss. One shared texture/geometry/material serves every prop.
let blobMaterial: THREE.MeshBasicMaterial | null = null;
let blobGeometry: THREE.PlaneGeometry | null = null;

function contactShadow(parent: THREE.Object3D, rx: number, rz: number) {
  if (!blobMaterial || !blobGeometry) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,0.4)");
    gradient.addColorStop(0.7, "rgba(0,0,0,0.16)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    blobMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    });
    blobGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  }
  const mesh = new THREE.Mesh(blobGeometry, blobMaterial);
  mesh.scale.set(rx * 2, 1, rz * 2);
  mesh.position.y = 0.012;
  parent.add(mesh);
}

function woodOf(entity: PlacedEntity): THREE.Material {
  return finish.wood(colorFromText(entity.descriptor, entity.id));
}

const buildBench: ObjectBuilder = (kit, parent, entity) => {
  const text = entity.descriptor.toLowerCase();
  if (/metal|steel/.test(text)) {
    // Narrow backless shelter bench: two steel slats on tube legs.
    const steel = finish.metal(0x9aa0a8);
    const frame = finish.iron(0x4a4d52);
    for (const z of [-0.09, 0.09]) {
      rbox(kit, steel, 0, 0.475, z, 1.5, 0.05, 0.15, parent);
    }
    const legGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 10));
    for (const x of [-0.6, 0.6]) {
      kit.mesh(legGeometry, frame, x, 0.225, 0, parent);
    }
    return undefined;
  }
  // Park bench: painted slats over cast-iron sides with armrests.
  const paint = finish.paint(colorFromText(entity.descriptor, entity.id));
  const iron = finish.iron(0x33363b);
  for (const z of [-0.2, -0.02, 0.16]) {
    rbox(kit, paint, 0, 0.47, z, 1.7, 0.055, 0.155, parent); // seat slats
  }
  for (const [y, z] of [[0.68, -0.26], [0.87, -0.29]]) {
    const slat = rbox(kit, paint, 0, y, z, 1.7, 0.14, 0.045, parent);
    slat.rotation.x = -0.15;
  }
  const armGeometry = kit.track(
    new THREE.CylinderGeometry(0.024, 0.024, 0.46, 8).rotateX(Math.PI / 2),
  );
  for (const x of [-0.78, 0.78]) {
    kit.box(iron, x, 0.22, 0.16, 0.06, 0.44, 0.06, false, parent); // front leg
    kit.box(iron, x, 0.22, -0.18, 0.06, 0.44, 0.06, false, parent); // rear leg
    kit.box(iron, x, 0.44, -0.01, 0.06, 0.05, 0.48, false, parent); // side rail
    kit.mesh(armGeometry, iron, x, 0.63, -0.03, parent); // armrest
    kit.box(iron, x, 0.53, 0.15, 0.05, 0.16, 0.05, false, parent); // armrest post
  }
  return undefined;
};

const buildFountain: ObjectBuilder = (kit, parent) => {
  const stone = finish.stone(0x9b948a);
  const water = finish.water(0x5d9bc4);
  // Two-tier stone fountain: basin with a lip, column, upper dish, jet.
  kit.mesh(kit.track(new THREE.CylinderGeometry(1.08, 1.18, 0.34, 24)), stone, 0, 0.17, 0, parent);
  kit.mesh(
    kit.track(new THREE.TorusGeometry(1.08, 0.06, 10, 28).rotateX(Math.PI / 2)),
    stone, 0, 0.35, 0, parent,
  );
  kit.mesh(kit.track(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 24)), water, 0, 0.32, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.1, 0.16, 0.55, 12)), stone, 0, 0.6, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.42, 0.28, 0.12, 18)), stone, 0, 0.93, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 18)), water, 0, 0.97, 0, parent);
  const jet = kit.mesh(
    kit.track(new THREE.CylinderGeometry(0.04, 0.07, 0.45, 8)), water, 0, 1.2, 0, parent,
  );
  return (t) => {
    jet.scale.y = 1 + Math.sin(t * 4) * 0.12;
  };
};

// Oak parts are cached per kit so a single tree and a whole stand share
// one geometry set.
interface OakGeometry {
  trunk: THREE.CylinderGeometry;
  flare: THREE.CylinderGeometry;
  limb: THREE.CylinderGeometry;
  crown: THREE.SphereGeometry;
  tuft: THREE.SphereGeometry;
  cap: THREE.SphereGeometry;
}

const oakCache = new WeakMap<Kit, OakGeometry>();

function oakGeometryFor(kit: Kit): OakGeometry {
  let geometry = oakCache.get(kit);
  if (!geometry) {
    geometry = {
      trunk: kit.track(new THREE.CylinderGeometry(0.17, 0.3, 1.7, 10)),
      flare: kit.track(new THREE.CylinderGeometry(0.3, 0.46, 0.18, 10)),
      limb: kit.track(new THREE.CylinderGeometry(0.06, 0.1, 0.7, 8)),
      crown: kit.track(new THREE.SphereGeometry(0.85, 14, 10)),
      tuft: kit.track(new THREE.SphereGeometry(0.55, 12, 9)),
      cap: kit.track(new THREE.SphereGeometry(0.45, 12, 9)),
    };
    oakCache.set(kit, geometry);
  }
  return geometry;
}

/** One oak, planted at a local offset with its own yaw and size. */
function plantOak(
  kit: Kit,
  parent: THREE.Group,
  x: number,
  z: number,
  scale: number,
  yaw: number,
): void {
  const geometry = oakGeometryFor(kit);
  const bark = woodMaterial(0x5d4023, 0.95);
  const leafDark = foliageMaterial(0x3a6b35);
  const leafLight = foliageMaterial(0x4c7e3e);
  const oak = new THREE.Group();
  oak.position.set(x, 0, z);
  oak.rotation.y = yaw;
  oak.scale.setScalar(scale);
  parent.add(oak);
  kit.mesh(geometry.trunk, bark, 0, 0.85, 0, oak);
  kit.mesh(geometry.flare, bark, 0, 0.09, 0, oak); // root flare
  const limb = kit.mesh(geometry.limb, bark, 0.34, 1.5, 0.1, oak);
  limb.rotation.z = -0.7;
  // Two-tone speckled foliage so the crown reads as a mass of leaves.
  kit.mesh(geometry.crown, leafDark, 0, 2.15, 0, oak);
  kit.mesh(geometry.tuft, leafLight, 0.62, 1.8, 0.22, oak);
  kit.mesh(geometry.tuft, leafDark, -0.55, 1.9, -0.15, oak);
  kit.mesh(geometry.cap, leafLight, 0.12, 2.7, -0.08, oak);
}

const buildTree: ObjectBuilder = (kit, parent) => {
  plantOak(kit, parent, 0, 0, 1, 0);
  return undefined;
};

/** A loose stand of the same oak around the anchor point — back half and
 *  sides only, so whatever it rings (the pond) stays visible from the
 *  camera. Each tree gets its own yaw and a slightly different size. */
const buildTreeCluster: ObjectBuilder = (kit, parent) => {
  const ring: [number, number, number][] = [
    // [azimuth from +z (radians), radius, scale]
    [1.7, 2.5, 0.8],
    [2.6, 2.7, 1.0],
    [3.7, 2.4, 0.7],
    [4.8, 2.6, 0.9],
  ];
  ring.forEach(([azimuth, radius, scale], i) => {
    plantOak(
      kit, parent,
      Math.sin(azimuth) * radius,
      Math.cos(azimuth) * radius,
      scale,
      i * 1.9, // varied facing
    );
  });
  return undefined;
};

const buildCounter: ObjectBuilder = (kit, parent) => {
  const wood = woodMaterial(0x5d4023);
  const facing = woodMaterial(0x6b4a2c);
  const top = woodMaterial(0x3d2a16, 0.4); // polished counter top
  const brass = finish.metal(0xb08d3a);
  const dark = finish.plastic(0x2b2e33);
  rbox(kit, wood, 0, 0.44, 0, 2.8, 0.88, 0.7, parent, 0.03);
  rbox(kit, top, 0, 0.92, 0, 3.0, 0.06, 0.8, parent, 0.025);
  // Raised front panels give the cabinet a joinery silhouette.
  for (const x of [-0.95, 0, 0.95]) {
    rbox(kit, facing, x, 0.46, 0.345, 0.78, 0.6, 0.05, parent, 0.02);
  }
  const railGeometry = kit.track(
    new THREE.CylinderGeometry(0.022, 0.022, 2.7, 8).rotateZ(Math.PI / 2),
  );
  kit.mesh(railGeometry, brass, 0, 0.1, 0.4, parent); // foot rail
  // Brass till with a small keys block.
  rbox(kit, brass, 1.1, 1.06, -0.1, 0.3, 0.22, 0.3, parent, 0.025);
  rbox(kit, dark, 1.1, 1.19, -0.16, 0.26, 0.1, 0.14, parent, 0.02);
  return undefined;
};

const buildMachine: ObjectBuilder = (kit, parent) => {
  const chrome = finish.metal(0xb9bec7);
  const dark = finish.plastic(0x2b2e33);
  const ceramic = finish.ceramic(0xe8e4d8);
  rbox(kit, chrome, 0, 0.27, 0, 0.5, 0.44, 0.36, parent, 0.04); // body
  rbox(kit, dark, 0, 0.51, 0, 0.52, 0.06, 0.38, parent, 0.02); // warming tray
  rbox(kit, dark, 0, 0.05, 0.17, 0.44, 0.05, 0.18, parent, 0.015); // drip tray
  // Group head with a portafilter handle pointing out.
  const headGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.05, 0.09, 10));
  kit.mesh(headGeometry, dark, 0, 0.21, 0.2, parent);
  const handleGeometry = kit.track(
    new THREE.CylinderGeometry(0.018, 0.022, 0.16, 8).rotateX(Math.PI / 2),
  );
  kit.mesh(handleGeometry, dark, 0, 0.17, 0.31, parent);
  // Steam wand angled off the right side.
  const wandGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6));
  const wand = kit.mesh(wandGeometry, chrome, 0.27, 0.3, 0.1, parent);
  wand.rotation.z = -0.5;
  // Cups warming on top.
  const cupGeometry = kit.track(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 10));
  for (const x of [-0.12, 0.02, 0.14]) {
    kit.mesh(cupGeometry, ceramic, x, 0.58, -0.04, parent);
  }
  return undefined;
};

const buildDisplayCase: ObjectBuilder = (kit, parent) => {
  const glass = finish.glass(0xcfe4ec);
  const base = finish.wood(0x4a3a28);
  const croissant = finish.fabric(0xc4924a);
  const muffin = finish.fabric(0x8a5a32);
  const paper = finish.ceramic(0xe8e4d8);
  rbox(kit, base, 0, 0.06, 0, 0.72, 0.12, 0.52, parent, 0.02);
  kit.box(glass, 0, 0.37, 0, 0.7, 0.5, 0.5, false, parent);
  kit.box(base, 0, 0.33, 0, 0.66, 0.025, 0.46, false, parent); // shelf
  // Bottom row: croissants (squashed spheres); top shelf: muffins.
  const croissantGeometry = kit.track(new THREE.SphereGeometry(0.07, 10, 8));
  for (const x of [-0.2, 0, 0.2]) {
    const pastry = kit.mesh(croissantGeometry, croissant, x, 0.17, 0.05, parent);
    pastry.scale.set(1.2, 0.62, 0.85);
  }
  const muffinBase = kit.track(new THREE.CylinderGeometry(0.045, 0.035, 0.05, 10));
  const muffinTop = kit.track(new THREE.SphereGeometry(0.05, 10, 8));
  for (const x of [-0.15, 0.08]) {
    kit.mesh(muffinBase, paper, x, 0.37, 0, parent);
    const dome = kit.mesh(muffinTop, muffin, x, 0.41, 0, parent);
    dome.scale.y = 0.7;
  }
  return undefined;
};

const buildBoard: ObjectBuilder = (kit, parent, entity) => {
  const frame = finish.wood(0x5d4023);
  kit.box(frame, 0, 0, 0, 1.5, 0.95, 0.05, false, parent); // backing
  // Mitred frame strips and a chalk ledge.
  for (const y of [-0.475, 0.475]) {
    rbox(kit, frame, 0, y, 0.01, 1.56, 0.07, 0.07, parent, 0.018);
  }
  for (const x of [-0.745, 0.745]) {
    rbox(kit, frame, x, 0, 0.01, 0.07, 0.95, 0.07, parent, 0.018);
  }
  rbox(kit, frame, 0, -0.54, 0.06, 1.0, 0.04, 0.12, parent, 0.012); // chalk ledge
  const title = entity.descriptor.split(" — ")[0].toUpperCase();
  const isMenu = /menu|caf|coffee/.test(entity.descriptor.toLowerCase());
  canvasPlane(
    kit, parent, `board:${title}:${isMenu}`,
    (ctx) => {
      ctx.fillStyle = "#22301f";
      ctx.fillRect(0, 0, 1024, 640);
      ctx.fillStyle = "#e8e4d2";
      ctx.textAlign = "center";
      fitText(ctx, title, 860, "bold {size}px Georgia, 'Times New Roman', serif", 96);
      ctx.fillText(title, 512, 122);
      ctx.strokeStyle = "#cdc8b4";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(120, 158);
      ctx.lineTo(904, 158);
      ctx.stroke();
      if (isMenu) {
        // Readable chalk menu: items left, prices right.
        const items: [string, string][] = [
          ["Espresso", "2.50"],
          ["Flat White", "3.80"],
          ["Croissant", "3.20"],
          ["Muffin", "2.80"],
        ];
        ctx.font = "52px Georgia, 'Times New Roman', serif";
        items.forEach(([item, price], i) => {
          const y = 250 + i * 92;
          ctx.textAlign = "left";
          ctx.fillText(item, 120, y);
          ctx.textAlign = "right";
          ctx.fillText(price, 800, y);
        });
      } else {
        ctx.lineWidth = 8;
        for (let y = 250; y <= 540; y += 92) {
          ctx.beginPath();
          ctx.moveTo(120, y);
          ctx.lineTo(620 + (y % 184), y);
          ctx.stroke();
        }
      }
      // The doodle of a coffee cup.
      ctx.strokeStyle = "#e8e4d2";
      ctx.lineWidth = 7;
      ctx.strokeRect(852, 380, 96, 120);
      ctx.beginPath();
      ctx.arc(958, 440, 30, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath(); // steam
      ctx.moveTo(880, 350);
      ctx.bezierCurveTo(870, 320, 900, 310, 892, 282);
      ctx.stroke();
    },
    1024, 640, 1.36, 0.82, 0, 0, 0.035,
  );
  return undefined;
};

const buildTable: ObjectBuilder = (kit, parent, entity) => {
  const wood = woodMaterial(colorFromText(entity.descriptor, entity.id));
  if (/round/.test(entity.descriptor.toLowerCase())) {
    // Café pedestal table: top with a rim, stem, weighted foot.
    kit.mesh(kit.track(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24)), wood, 0, 0.715, 0, parent);
    kit.mesh(
      kit.track(new THREE.TorusGeometry(0.47, 0.022, 8, 28).rotateX(Math.PI / 2)),
      wood, 0, 0.7, 0, parent,
    );
    kit.mesh(kit.track(new THREE.CylinderGeometry(0.045, 0.05, 0.66, 10)), wood, 0, 0.36, 0, parent);
    kit.mesh(kit.track(new THREE.CylinderGeometry(0.24, 0.3, 0.06, 18)), wood, 0, 0.03, 0, parent);
  } else {
    rbox(kit, wood, 0, 0.71, 0, 0.9, 0.06, 0.9, parent, 0.02);
    const legGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.035, 0.68, 8));
    for (const [x, z] of [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]]) {
      kit.mesh(legGeometry, wood, x, 0.34, z, parent);
    }
  }
  return undefined;
};

const buildChair: ObjectBuilder = (kit, parent, entity) => {
  const wood = woodOf(entity);
  const legGeometry = kit.track(new THREE.CylinderGeometry(0.022, 0.028, 0.46, 8));
  for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
    kit.mesh(legGeometry, wood, x, 0.23, z, parent);
  }
  rbox(kit, wood, 0, 0.48, 0, 0.44, 0.05, 0.44, parent, 0.02); // seat
  for (const x of [-0.19, 0.19]) {
    kit.box(wood, x, 0.76, -0.2, 0.045, 0.56, 0.045, false, parent); // back posts
  }
  rbox(kit, wood, 0, 0.95, -0.2, 0.44, 0.16, 0.04, parent, 0.015); // back rest
  return undefined;
};

const buildLamp: ObjectBuilder = (kit, parent) => {
  const metal = finish.iron(0x4a4d52);
  const shade = finish.fabric(0xe8dcc0);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.14, 0.17, 0.04, 14)), metal, 0, 0.02, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.018, 0.022, 1.15, 8)), metal, 0, 0.6, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.12, 0.22, 0.26, 14, 1, true)), shade, 0, 1.28, 0, parent);
  return undefined;
};

// ---------------------------------------------------------------------------
// City street furniture (bus-stop set).
// ---------------------------------------------------------------------------

// Picks the first color word in the descriptor, else a default tint.
function tintOr(entity: PlacedEntity, fallback: number): number {
  const text = entity.descriptor.toLowerCase();
  let earliest = Infinity;
  let tint = fallback;
  for (const [pattern, color] of COLOR_WORDS) {
    const match = pattern.exec(text);
    if (match && match.index < earliest) {
      earliest = match.index;
      tint = color;
    }
  }
  return tint;
}

const buildLitterBin: ObjectBuilder = (kit, parent, entity) => {
  const shell = finish.metal(tintOr(entity, 0x55595f));
  const dark = finish.plastic(0x26282c);
  // Tapered drum with a domed hood and a slot opening at the front.
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.23, 0.2, 0.6, 18)), shell, 0, 0.31, 0, parent);
  kit.mesh(
    kit.track(new THREE.TorusGeometry(0.23, 0.022, 8, 22).rotateX(Math.PI / 2)),
    shell, 0, 0.6, 0, parent,
  );
  kit.mesh(kit.track(new THREE.SphereGeometry(0.22, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)), shell, 0, 0.61, 0, parent);
  // Dark recessed opening on the camera-facing side.
  const slot = kit.box(dark, 0, 0.6, 0.18, 0.26, 0.12, 0.12, false, parent);
  slot.rotation.x = 0.3;
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 18)), dark, 0, 0.03, 0, parent);
  return undefined;
};

const buildStreetLamp: ObjectBuilder = (kit, parent) => {
  const metal = finish.iron(0x3c3f45);
  const glass = finish.glass(0xf3ead0);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.16, 0.2, 0.14, 14)), metal, 0, 0.07, 0, parent); // base
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 10)), metal, 0, 1.74, 0, parent); // pole
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.11, 0.07, 0.12, 12)), metal, 0, 3.4, 0, parent); // collar
  // Tapered lantern housing with glass panels and a little finial.
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.14, 0.18, 0.32, 6)), glass, 0, 3.62, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.18, 0.06, 0.16, 6)), metal, 0, 3.85, 0, parent); // cap
  kit.mesh(kit.track(new THREE.SphereGeometry(0.035, 8, 6)), metal, 0, 3.96, 0, parent); // finial
  return undefined;
};

const buildHydrant: ObjectBuilder = (kit, parent, entity) => {
  const paint = finish.paint(tintOr(entity, 0xb33a3a));
  const cap = finish.metal(0x9aa0a8);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.13, 0.16, 0.34, 14)), paint, 0, 0.17, 0, parent); // body
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 14)), paint, 0, 0.05, 0, parent); // foot flange
  kit.mesh(kit.track(new THREE.SphereGeometry(0.135, 14, 10)), paint, 0, 0.36, 0, parent); // dome
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.045, 0.05, 0.06, 8)), cap, 0, 0.45, 0, parent); // top bolt
  // Side and front nozzles with cap plates.
  const nozzle = kit.track(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10).rotateZ(Math.PI / 2));
  for (const side of [-1, 1]) {
    kit.mesh(nozzle, cap, side * 0.17, 0.26, 0, parent);
  }
  const front = kit.track(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 10).rotateX(Math.PI / 2));
  kit.mesh(front, cap, 0, 0.18, 0.16, parent);
  return undefined;
};

const buildBollards: ObjectBuilder = (kit, parent, entity) => {
  const post = finish.iron(tintOr(entity, 0x2f3237));
  const band = finish.paint(0xd9b832);
  const capGeometry = kit.track(new THREE.SphereGeometry(0.07, 10, 8));
  const postGeometry = kit.track(new THREE.CylinderGeometry(0.06, 0.07, 0.6, 12));
  const bandGeometry = kit.track(new THREE.CylinderGeometry(0.072, 0.072, 0.06, 12));
  // A short row of three kerbside posts with a reflective band.
  for (const x of [-0.62, 0, 0.62]) {
    kit.mesh(postGeometry, post, x, 0.3, 0, parent);
    kit.mesh(bandGeometry, band, x, 0.5, 0, parent);
    kit.mesh(capGeometry, post, x, 0.6, 0, parent);
  }
  return undefined;
};

const buildCone: ObjectBuilder = (kit, parent) => {
  const orange = finish.plastic(0xe2691c);
  const white = finish.plastic(0xece8e0);
  kit.mesh(kit.track(new THREE.BoxGeometry(0.26, 0.03, 0.26)), orange, 0, 0.015, 0, parent); // base
  kit.mesh(kit.track(new THREE.ConeGeometry(0.115, 0.42, 16)), orange, 0, 0.24, 0, parent);
  // Reflective collar: a short cone slice in white.
  kit.mesh(kit.track(new THREE.ConeGeometry(0.082, 0.08, 16)), white, 0, 0.29, 0, parent);
  kit.mesh(kit.track(new THREE.SphereGeometry(0.03, 8, 6)), orange, 0, 0.45, 0, parent); // tip
  return undefined;
};

const buildPostbox: ObjectBuilder = (kit, parent, entity) => {
  const paint = finish.paint(tintOr(entity, 0xb33a3a));
  const dark = finish.plastic(0x26282c);
  const plate = finish.metal(0xc9ccd1);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 18)), dark, 0, 0.04, 0, parent); // base
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 18)), paint, 0, 0.58, 0, parent); // pillar
  kit.mesh(kit.track(new THREE.SphereGeometry(0.28, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2)), paint, 0, 1.08, 0, parent); // domed cap
  const slot = kit.box(dark, 0, 0.92, 0.27, 0.26, 0.04, 0.05, false, parent); // posting slot
  slot.rotation.x = 0.05;
  kit.box(plate, 0, 0.66, 0.275, 0.22, 0.14, 0.02, false, parent); // collection plate
  return undefined;
};

const buildBikeRack: ObjectBuilder = (kit, parent) => {
  const metal = finish.metal(0x868c93);
  // Three inverted-U hoops set in a row.
  const hoopGeometry = kit.track(new THREE.TorusGeometry(0.28, 0.025, 8, 18, Math.PI));
  const footGeometry = kit.track(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8));
  for (const x of [-0.55, 0, 0.55]) {
    const hoop = kit.mesh(hoopGeometry, metal, x, 0.5, 0, parent);
    hoop.rotation.z = 0; // arch opens downward
    for (const side of [-1, 1]) {
      kit.mesh(footGeometry, metal, x + side * 0.28, 0.05, 0, parent);
    }
  }
  return undefined;
};

const buildPigeons: ObjectBuilder = (kit, parent) => {
  const bodyMat = finish.fabric(0x8a8f96);
  const headMat = finish.fabric(0x5d6168);
  const beakMat = finish.plastic(0xd98c43);
  const footMat = finish.plastic(0xc06a4a);
  const bodyGeometry = kit.track(new THREE.CapsuleGeometry(0.05, 0.08, 4, 8).rotateZ(Math.PI / 2));
  const headGeometry = kit.track(new THREE.SphereGeometry(0.035, 10, 8));
  const beakGeometry = kit.track(new THREE.ConeGeometry(0.012, 0.04, 6).rotateX(Math.PI / 2));
  const tailGeometry = kit.track(new THREE.BoxGeometry(0.05, 0.012, 0.07));
  const footGeometry = kit.track(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 5));
  const birds: { head: THREE.Group; phase: number }[] = [];
  const spots: [number, number, number][] = [
    [0, 0, 0.2],
    [0.34, 0.2, 1.1],
    [-0.26, -0.18, -0.6],
  ];
  spots.forEach(([x, z, yaw], i) => {
    const bird = new THREE.Group();
    bird.position.set(x, 0, z);
    bird.rotation.y = yaw;
    parent.add(bird);
    kit.mesh(bodyGeometry, bodyMat, 0, 0.09, 0, bird);
    kit.mesh(tailGeometry, bodyMat, 0, 0.1, -0.09, bird);
    for (const side of [-1, 1]) {
      kit.mesh(footGeometry, footMat, side * 0.02, 0.025, 0, bird);
    }
    // Head on a short neck pivot so it can peck.
    const head = new THREE.Group();
    head.position.set(0, 0.13, 0.07);
    bird.add(head);
    kit.mesh(headGeometry, headMat, 0, 0, 0, head);
    kit.mesh(beakGeometry, beakMat, 0, -0.005, 0.04, head);
    birds.push({ head, phase: i * 2.1 });
  });
  return (t) => {
    for (const { head, phase } of birds) {
      // Quick downward peck on a loose cycle.
      const peck = Math.max(0, Math.sin(t * 3 + phase));
      head.rotation.x = peck * 0.9;
      head.position.y = 0.13 - peck * 0.04;
    }
  };
};

// A closed umbrella for the stand: folded canopy, ferrule down, hook up.
const buildClosedUmbrella = (kit: Kit, parent: THREE.Group, tint: number) => {
  const metal = finish.iron(0x4a4d52);
  const canopy = finish.fabric(tint);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6)), metal, 0, 0.12, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.065, 0.018, 0.6, 10)), canopy, 0, 0.54, 0, parent);
  const hookGeometry = kit.track(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI));
  kit.mesh(hookGeometry, metal, 0.05, 0.86, 0, parent);
};

// An open umbrella: canopy cone with rib tips over a straight pole.
const buildUmbrella = (kit: Kit, parent: THREE.Group, tint: number, scale = 1) => {
  const metal = finish.iron(0x4a4d52);
  const canopy = finish.fabric(tint);
  kit.mesh(
    kit.track(new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.95 * scale, 8)),
    metal, 0, 0.47 * scale, 0, parent,
  );
  kit.mesh(
    kit.track(new THREE.ConeGeometry(0.34 * scale, 0.2 * scale, 10)),
    canopy, 0, 0.88 * scale, 0, parent,
  );
  kit.mesh(
    kit.track(new THREE.CylinderGeometry(0.006, 0.012, 0.08, 6)),
    metal, 0, 1.02 * scale, 0, parent,
  );
};

const buildUmbrellaStand: ObjectBuilder = (kit, parent, entity) => {
  const metal = finish.metal(0x6a6f76);
  const inner = finish.plastic(0x2b2e33);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.24, 0.19, 0.5, 16)), metal, 0, 0.25, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 16)), inner, 0, 0.5, 0, parent);
  // A crowd of dripping umbrellas leaning at different angles.
  const tints = [0x2c3e63, colorFromText("", entity.id), 0x3f7a44];
  tints.forEach((tint, i) => {
    const lean = new THREE.Group();
    lean.position.set(-0.08 + i * 0.08, 0.16, (i % 2) * 0.08 - 0.04);
    lean.rotation.z = -0.16 + i * 0.16;
    lean.rotation.x = (i % 2) * 0.12 - 0.06;
    parent.add(lean);
    buildClosedUmbrella(kit, lean, tint);
  });
  return undefined;
};

const buildShelter: ObjectBuilder = (kit, parent) => {
  const glass = finish.glass(0xd2e4ec);
  const steel = finish.iron(0x4a4d52);
  kit.box(glass, 0, 1.1, -0.55, 2.6, 1.9, 0.05, false, parent); // back panel
  for (const x of [-1.3, 1.3]) {
    kit.box(glass, x, 1.1, 0, 0.05, 1.9, 1.1, false, parent); // side panels
    for (const z of [-0.55, 0.5]) {
      kit.box(steel, x, 1.1, z, 0.08, 2.2, 0.08, false, parent); // posts
    }
  }
  rbox(kit, steel, 0, 2.24, 0, 2.9, 0.08, 1.4, parent, 0.025); // roof
  rbox(kit, steel, 0, 2.18, 0.71, 2.9, 0.14, 0.04, parent, 0.015); // fascia
  canvasPlane(
    kit, parent, "route-map",
    (ctx) => {
      ctx.fillStyle = "#e8e4d8";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#2c3e63";
      ctx.fillRect(0, 0, 512, 96); // header band
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 56px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ROUTE MAP", 256, 66);
      ctx.strokeStyle = "#2c3e63";
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 492);
      // The line and its stops.
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(70, 420);
      ctx.lineTo(210, 250);
      ctx.lineTo(430, 310);
      ctx.stroke();
      ctx.font = "500 30px system-ui, sans-serif";
      const stops: [number, number, string][] = [
        [70, 420, "Depot"],
        [210, 250, "Centre"],
        [430, 310, "Harbour"],
      ];
      for (const [x, y, label] of stops) {
        ctx.fillStyle = "#2c3e63";
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2c3e63";
        ctx.fillText(label, x, y - 28);
      }
    },
    512, 512, 0.7, 0.7, 0.6, 1.3, -0.51,
  );
  return undefined;
};

const buildSign: ObjectBuilder = (kit, parent, entity) => {
  const steel = finish.iron(0x4a4d52);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.14, 0.17, 0.05, 14)), steel, 0, 0.025, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 10)), steel, 0, 1.2, 0, parent);
  const routeNumber = /\d+/.exec(entity.descriptor)?.[0] ?? "BUS";
  kit.box(steel, 0, 2.15, 0.02, 0.6, 0.46, 0.03, false, parent); // panel backing
  canvasPlane(
    kit, parent, `sign:${routeNumber}`,
    (ctx) => {
      ctx.fillStyle = "#2c3e63";
      ctx.fillRect(0, 0, 512, 384);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 12;
      ctx.strokeRect(16, 16, 480, 352);
      ctx.fillStyle = "#f1f5f9";
      ctx.textAlign = "center";
      ctx.font = "bold 76px system-ui, sans-serif";
      ctx.fillText("BUS STOP", 256, 130);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(96, 168);
      ctx.lineTo(416, 168);
      ctx.stroke();
      fitText(ctx, routeNumber, 400, "bold {size}px system-ui, sans-serif", 150);
      ctx.fillText(routeNumber, 256, 312);
    },
    512, 384, 0.56, 0.42, 0, 2.15, 0.04,
  );
  return undefined;
};

// A hanging pendant (cord + open shade + glowing bulb) for "pendant lamp
// hanging above the table" entities; the freestanding buildLamp above
// covers floor/table lamps. The shade needs DoubleSide and the bulb an
// emissive tint, which the shared-material cache deliberately never
// carries, so those two stay kit-tracked one-offs.
const buildPendantLamp: ObjectBuilder = (kit, parent) => {
  const brass = finish.metal(0xb08d3a);
  const cordGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6));
  kit.mesh(cordGeometry, brass, 0, 0.7, 0, parent);
  const shadeMaterial = kit.material({
    color: 0xb08d3a, metalness: 0.7, roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const shadeGeometry = kit.track(new THREE.ConeGeometry(0.24, 0.2, 16, 1, true));
  kit.mesh(shadeGeometry, shadeMaterial, 0, 0.12, 0, parent);
  const bulbMaterial = kit.material({
    color: 0xffe9b8, emissive: 0xffd98a, emissiveIntensity: 1.2,
  });
  const bulbGeometry = kit.track(new THREE.SphereGeometry(0.05, 10, 8));
  const bulb = kit.mesh(bulbGeometry, bulbMaterial, 0, 0.04, 0, parent);
  bulb.castShadow = false;
  const glow = kit.track(new THREE.PointLight(0xffd9a0, 0.7, 6, 2));
  parent.add(glow);
  return undefined;
};

const buildClock: ObjectBuilder = (kit, parent) => {
  const brass = finish.metal(0xb08d3a);
  const bodyGeometry = kit.track(
    new THREE.CylinderGeometry(0.26, 0.26, 0.06, 24).rotateX(Math.PI / 2),
  );
  kit.mesh(bodyGeometry, brass, 0, 0, 0, parent);
  const face = new THREE.Mesh(
    kit.track(new THREE.CircleGeometry(0.23, 24)),
    surfaceMaterial("clock-face", 128, 128, (ctx) => {
      ctx.fillStyle = "#f1ecdf";
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = "#2b2e33";
      ctx.lineWidth = 4;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(angle) * 48, 64 + Math.sin(angle) * 48);
        ctx.lineTo(64 + Math.cos(angle) * 56, 64 + Math.sin(angle) * 56);
        ctx.stroke();
      }
      // Hands frozen at ten past ten, the classic shop-clock pose.
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(64, 64);
      ctx.lineTo(64 + Math.cos(-Math.PI * 0.83) * 30, 64 + Math.sin(-Math.PI * 0.83) * 30);
      ctx.moveTo(64, 64);
      ctx.lineTo(64 + Math.cos(-Math.PI * 0.17) * 42, 64 + Math.sin(-Math.PI * 0.17) * 42);
      ctx.stroke();
    }),
  );
  face.position.z = 0.035;
  parent.add(face);
  return undefined;
};

// --- Coffee-shop dressing: mug rack, brew shelf, grinder, bean sacks ---

const MUG_TINTS = [0xb04a4a, 0x4a6fb0, 0x4ab06f, 0xd9b832, 0xd97a2b, 0x7a5ba6];

// Free-standing display rack: posts, a back board, and rows of hung mugs.
const buildMugRack: ObjectBuilder = (kit, parent) => {
  const wood = finish.wood(0x5d4023);
  for (const x of [-0.55, 0.55]) {
    kit.box(wood, x, 0.85, 0, 0.06, 1.7, 0.1, false, parent);
  }
  rbox(kit, wood, 0, 1.1, -0.03, 1.16, 1.0, 0.04, parent, 0.012);
  const mugGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.045, 0.09, 12));
  const handleGeometry = kit.track(new THREE.TorusGeometry(0.028, 0.008, 6, 10, Math.PI));
  let m = 0;
  for (const y of [1.42, 1.12, 0.82]) {
    for (const x of [-0.38, -0.13, 0.13, 0.38]) {
      const ceramic = finish.ceramic(MUG_TINTS[m % MUG_TINTS.length]);
      kit.mesh(mugGeometry, ceramic, x, y, 0.06, parent);
      const handle = kit.mesh(handleGeometry, ceramic, x + 0.055, y, 0.06, parent);
      handle.rotation.z = -Math.PI / 2;
      m++;
    }
  }
  return undefined;
};

// Shelf of copper coffee pots and a French press; the antique grinder is
// its own entity placed "on the brewing shelf".
const buildBrewShelf: ObjectBuilder = (kit, parent) => {
  const wood = finish.wood(0x4a3a28);
  for (const x of [-0.55, 0.55]) {
    rbox(kit, wood, x, 0.8, 0, 0.06, 1.6, 0.32, parent, 0.015);
  }
  for (const y of [0.3, 0.8, 1.3]) {
    rbox(kit, wood, 0, y, 0, 1.16, 0.05, 0.32, parent, 0.012);
  }
  const copper = finish.metal(0xb87333);
  const bellyGeometry = kit.track(new THREE.CylinderGeometry(0.07, 0.085, 0.16, 12));
  const spoutGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 8));
  const knobGeometry = kit.track(new THREE.SphereGeometry(0.018, 8, 6));
  const pot = (x: number, y: number, scale: number) => {
    const group = new THREE.Group();
    group.position.set(x, y, 0);
    group.scale.setScalar(scale);
    parent.add(group);
    kit.mesh(bellyGeometry, copper, 0, 0.08, 0, group);
    kit.mesh(knobGeometry, copper, 0, 0.18, 0, group);
    const spout = kit.mesh(spoutGeometry, copper, 0.09, 0.12, 0, group);
    spout.rotation.z = -0.7;
  };
  pot(-0.3, 1.325, 1);
  pot(0.05, 1.325, 0.85);
  pot(0.33, 0.325, 0.9);
  // French press: glass body, dark lid, plunger rod and knob.
  const glass = finish.glass(0xd8e6ea);
  const dark = finish.plastic(0x2b2e33);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 12)), glass, -0.32, 0.405, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 12)), dark, -0.32, 0.49, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6)), dark, -0.32, 0.52, 0, parent);
  kit.mesh(knobGeometry, dark, -0.32, 0.55, 0, parent);
  return undefined;
};

const buildGrinder: ObjectBuilder = (kit, parent) => {
  const wood = finish.wood(0x5d4023);
  const iron = finish.iron(0x3a3d42);
  rbox(kit, wood, 0, 0.07, 0, 0.16, 0.14, 0.16, parent, 0.015); // body
  kit.box(iron, 0, 0.045, 0.082, 0.05, 0.03, 0.01, false, parent); // drawer pull
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.05, 0.065, 0.06, 10)), iron, 0, 0.17, 0, parent); // hopper
  const arm = kit.box(iron, 0.05, 0.225, 0, 0.12, 0.012, 0.012, false, parent); // crank
  arm.rotation.z = 0.15;
  kit.mesh(kit.track(new THREE.SphereGeometry(0.016, 8, 6)), wood, 0.11, 0.245, 0, parent);
  return undefined;
};

const buildBeanSacks: ObjectBuilder = (kit, parent) => {
  const burlap = finish.fabric(0x9a7e57);
  const beans = finish.wood(0x3a2618);
  const beanGeometry = kit.track(new THREE.SphereGeometry(0.022, 6, 5));
  const sack = (x: number, z: number, lean: number, open: boolean) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = lean;
    parent.add(group);
    rbox(kit, burlap, 0, 0.26, 0, 0.46, 0.52, 0.4, group, 0.12);
    if (open) {
      // Beans visible at the open mouth, a few spilled on the floor.
      kit.mesh(kit.track(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12)), beans, 0, 0.5, 0, group);
      for (const [bx, bz] of [[0.3, 0.12], [0.38, -0.06], [0.27, -0.18], [0.45, 0.02]]) {
        kit.mesh(beanGeometry, beans, bx, 0.022, bz, group);
      }
    } else {
      kit.mesh(kit.track(new THREE.CylinderGeometry(0.07, 0.1, 0.1, 8)), burlap, 0, 0.56, 0, group); // cinched neck
    }
  };
  sack(-0.18, 0.05, 0.3, true);
  sack(0.22, -0.12, -0.2, false);
  return undefined;
};

const buildBriefcase: ObjectBuilder = (kit, parent) => {
  const leather = finish.wood(0x5d3a1e); // matte leather
  const brass = finish.metal(0xb08d3a);
  const body = rbox(kit, leather, 0, 0.16, 0, 0.42, 0.3, 0.13, parent, 0.03);
  body.rotation.x = -0.06;
  const handleGeometry = kit.track(new THREE.TorusGeometry(0.06, 0.014, 8, 14, Math.PI));
  kit.mesh(handleGeometry, leather, 0, 0.32, 0, parent);
  for (const x of [-0.11, 0.11]) {
    rbox(kit, brass, x, 0.255, 0.065, 0.045, 0.03, 0.02, parent, 0.008); // clasps
  }
  // The folded jacket left beside it.
  const cloth = finish.fabric(0x6a7076);
  const jacket = rbox(kit, cloth, 0.42, 0.05, 0, 0.34, 0.09, 0.26, parent, 0.025);
  jacket.rotation.y = 0.4;
  const fold = rbox(kit, cloth, 0.4, 0.11, 0.01, 0.24, 0.05, 0.18, parent, 0.02);
  fold.rotation.y = 0.55;
  return undefined;
};

const buildCup: ObjectBuilder = (kit, parent) => {
  const ceramic = finish.ceramic(0xe8e4d8);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.055, 0.042, 0.115, 14)), ceramic, 0, 0.058, 0, parent);
  const handleGeometry = kit.track(new THREE.TorusGeometry(0.035, 0.01, 6, 12, Math.PI));
  const handle = kit.mesh(handleGeometry, ceramic, 0.062, 0.06, 0, parent);
  handle.rotation.z = -Math.PI / 2;
  return undefined;
};

const buildPlant: ObjectBuilder = (kit, parent) => {
  const clay = finish.stone(0xa05a37);
  const leafDark = foliageMaterial(0x3a6b35);
  const leafLight = foliageMaterial(0x4c7e3e);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.16, 0.115, 0.24, 14)), clay, 0, 0.12, 0, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.17, 0.17, 0.045, 14)), clay, 0, 0.245, 0, parent); // rim
  const bushGeometry = kit.track(new THREE.SphereGeometry(0.16, 10, 8));
  for (const [x, y, z, leaf] of [
    [0, 0.43, 0, leafDark],
    [0.1, 0.52, 0.05, leafLight],
    [-0.1, 0.5, -0.04, leafDark],
  ] as const) {
    kit.mesh(bushGeometry, leaf as THREE.Material, x as number, y as number, z as number, parent);
  }
  return undefined;
};

const buildBushes: ObjectBuilder = (kit, parent) => {
  const leafDark = foliageMaterial(0x35602f);
  const leafLight = foliageMaterial(0x4c7e3e);
  const blossom = finish.paint(0xd98ca6);
  const puffGeometry = kit.track(new THREE.SphereGeometry(1, 12, 9));
  const blossomGeometry = kit.track(new THREE.SphereGeometry(0.035, 8, 6));
  // Three low mounds of two-tone foliage in a loose row.
  const mounds: [number, number, number][] = [
    [-0.85, 0.15, 0.5],
    [0.05, -0.2, 0.66],
    [0.9, 0.1, 0.45],
  ];
  mounds.forEach(([x, z, s], i) => {
    const main = kit.mesh(puffGeometry, i % 2 ? leafLight : leafDark, x, s * 0.62, z, parent);
    main.scale.set(s * 1.2, s * 0.78, s * 1.05);
    const side = kit.mesh(
      puffGeometry, i % 2 ? leafDark : leafLight, x + s * 0.7, s * 0.42, z + 0.12, parent,
    );
    side.scale.setScalar(s * 0.55);
  });
  // A scatter of small pink blossoms resting on the foliage.
  const spots: [number, number, number][] = [
    [-1.05, 0.5, 0.75], [-0.6, 0.46, 0.78], [0.0, 0.66, 0.22],
    [0.3, 0.5, 0.18], [0.85, 0.42, 0.42], [1.15, 0.3, 0.3],
  ];
  for (const [x, y, z] of spots) {
    kit.mesh(blossomGeometry, blossom, x, y, z, parent);
  }
  return undefined;
};

const buildPond: ObjectBuilder = (kit, parent) => {
  const water = sharedMaterial({ color: 0x6fa6c8, roughness: 0.08, metalness: 0.05 });
  const bank = finish.stone(0x5a4a36);
  const stone = finish.stone(0x8d8779);
  const pad = finish.fabric(0x3f7a44);
  // Muddy bank ring with the still water sunk just inside it.
  const bankGeometry = kit.track(
    new THREE.TorusGeometry(1.28, 0.13, 8, 36).rotateX(Math.PI / 2),
  );
  const bankMesh = kit.mesh(bankGeometry, bank, 0, 0.05, 0, parent);
  bankMesh.scale.set(1.15, 0.45, 1);
  const waterGeometry = kit.track(
    new THREE.CircleGeometry(1.27, 36).rotateX(-Math.PI / 2),
  );
  const waterMesh = new THREE.Mesh(waterGeometry, water);
  waterMesh.position.y = 0.045;
  waterMesh.scale.x = 1.15;
  waterMesh.receiveShadow = true;
  parent.add(waterMesh);
  // A few stones settled along the edge.
  const stoneGeometry = kit.track(new THREE.SphereGeometry(0.09, 8, 6));
  const stoneSpots: [number, number, number][] = [
    [1.32, -0.5, 1.1], [0.6, 1.22, 0.8], [-1.25, 0.62, 1.25], [-0.4, -1.28, 0.9],
  ];
  for (const [x, z, s] of stoneSpots) {
    const rock = kit.mesh(stoneGeometry, stone, x, 0.05, z, parent);
    rock.scale.set(s, s * 0.6, s * 0.85);
  }
  // Lily pads drifting on the surface, one with a white blossom.
  const padGeometry = kit.track(
    new THREE.CircleGeometry(1, 14, 0.5, Math.PI * 1.8).rotateX(-Math.PI / 2),
  );
  const pads: THREE.Mesh[] = [];
  const padSpots: [number, number, number][] = [
    [-0.45, 0.35, 0.15], [0.2, -0.3, 0.11], [0.55, 0.42, 0.13],
  ];
  for (const [x, z, s] of padSpots) {
    const lily = new THREE.Mesh(padGeometry, pad);
    lily.position.set(x, 0.055, z);
    lily.scale.setScalar(s);
    parent.add(lily);
    pads.push(lily);
  }
  const blossomGeometry = kit.track(new THREE.SphereGeometry(0.05, 8, 6));
  const blossom = kit.mesh(blossomGeometry, finish.paint(0xeeeae0), -0.45, 0.08, 0.35, parent);
  blossom.scale.y = 0.7;
  // Reeds with cattail heads swaying at the back edge.
  const reeds = new THREE.Group();
  reeds.position.set(-0.85, 0, -1.0);
  parent.add(reeds);
  const stemGeometry = kit.track(new THREE.CylinderGeometry(0.012, 0.016, 1, 6));
  const tailGeometry = kit.track(new THREE.CapsuleGeometry(0.03, 0.1, 4, 8));
  const tail = finish.fabric(0x5d4023);
  const stems: [number, number, number][] = [
    [0, 0, 0.62], [0.16, 0.08, 0.5], [-0.14, -0.06, 0.55],
  ];
  for (const [x, z, h] of stems) {
    const stem = kit.mesh(stemGeometry, pad, x, h / 2, z, reeds);
    stem.scale.y = h;
    kit.mesh(tailGeometry, tail, x, h + 0.05, z, reeds);
  }
  return (t) => {
    reeds.rotation.z = Math.sin(t * 1.1) * 0.05;
    pads.forEach((lily, i) => {
      lily.position.y = 0.055 + Math.sin(t * 0.6 + i * 2) * 0.004;
    });
  };
};

const buildPicnicMat: ObjectBuilder = (kit, parent, entity) => {
  const tint = colorFromText(entity.descriptor, entity.id);
  const base = new THREE.Color(tint);
  const r = Math.round(base.r * 255);
  const g = Math.round(base.g * 255);
  const b = Math.round(base.b * 255);
  // Gingham check drawn over a cream ground.
  const plaid = surfaceMaterial(
    `plaid:${tint}`, 256, 256,
    (ctx, w, h) => {
      ctx.fillStyle = "#f5efe0";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
      for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 28, h);
      for (let y = 0; y < h; y += 64) ctx.fillRect(0, y, w, 28);
      ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
      for (let x = 46; x < w; x += 64) ctx.fillRect(x, 0, 5, h);
      for (let y = 46; y < h; y += 64) ctx.fillRect(0, y, w, 5);
    },
    { roughness: 0.95 },
  );
  const blanket = rbox(kit, plaid, 0, 0.013, 0, 1.6, 0.026, 1.25, parent, 0.01);
  blanket.rotation.y = 0.16; // thrown down casually, not squared to the stage
  return undefined;
};

const buildBasket: ObjectBuilder = (kit, parent) => {
  // Woven wicker: staggered horizontal strands over vertical ribs.
  const wicker = surfaceMaterial(
    "wicker", 128, 128,
    (ctx, w, h) => {
      ctx.fillStyle = "#ad8a52";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 14) {
        const offset = ((y / 14) % 2) * 11;
        ctx.fillStyle = "rgba(255,235,200,0.35)";
        for (let x = -11; x < w; x += 22) {
          ctx.fillRect(x + offset, y + 2, 16, 9);
        }
        ctx.fillStyle = "rgba(60,40,20,0.3)";
        ctx.fillRect(0, y, w, 2);
      }
      ctx.fillStyle = "rgba(60,40,20,0.25)";
      for (let x = 0; x < w; x += 22) ctx.fillRect(x, 0, 3, h);
    },
    { roughness: 0.85 },
  );
  const wood = finish.wood(0x8a6a3e);
  rbox(kit, wicker, 0, 0.13, 0, 0.42, 0.26, 0.3, parent, 0.025);
  rbox(kit, wood, 0, 0.27, 0, 0.46, 0.035, 0.34, parent, 0.012); // rim
  const handleGeometry = kit.track(new THREE.TorusGeometry(0.15, 0.016, 8, 18, Math.PI));
  kit.mesh(handleGeometry, wood, 0, 0.28, 0, parent);
  // Lid flap resting half-open over the back, baguette out the front.
  const flap = rbox(kit, wood, 0, 0.3, -0.09, 0.4, 0.014, 0.16, parent, 0.006);
  flap.rotation.x = -0.18;
  const baguetteGeometry = kit.track(new THREE.CapsuleGeometry(0.045, 0.18, 4, 8));
  const baguette = kit.mesh(baguetteGeometry, finish.fabric(0xcf9f5a), 0.09, 0.34, 0.07, parent);
  baguette.rotation.set(-0.35, 0, 0.4);
  // An apple set out on the blanket beside the basket.
  const appleGeometry = kit.track(new THREE.SphereGeometry(0.05, 10, 8));
  kit.mesh(appleGeometry, finish.paint(0x9a3a32), 0.32, 0.05, 0.14, parent);
  return undefined;
};

const buildDog: ObjectBuilder = (kit, parent, entity) => {
  // The earliest color word in the descriptor recoats the dog ("tan dog
  // with a red collar" stays tan); default is tan.
  let coatTint = 0xb08d57;
  let earliest = Infinity;
  const text = entity.descriptor.toLowerCase();
  for (const [pattern, color] of COLOR_WORDS) {
    const match = pattern.exec(text);
    if (match && match.index < earliest) {
      earliest = match.index;
      coatTint = color;
    }
  }
  if (coatTint === 0xcbb594) coatTint = 0xb08d57; // clothing tan washes out as fur
  const coat = finish.fabric(coatTint);
  const coatLight = finish.fabric(
    new THREE.Color(coatTint).lerp(new THREE.Color(0xfff2dd), 0.4).getHex(),
  );
  const dark = finish.plastic(0x2b2e33);
  const collar = finish.paint(0xb33a3a);
  // Angled off-axis (seeded) so each dog wanders its own way.
  const dog = new THREE.Group();
  dog.rotation.y = -0.55 + (hash01(`${entity.id}:yaw`) - 0.5) * 1.2;
  parent.add(dog);
  const phase = hash01(`${entity.id}:wag`) * Math.PI * 2;
  const bodyGeometry = kit.track(
    new THREE.CapsuleGeometry(0.155, 0.3, 4, 12).rotateX(Math.PI / 2),
  );
  kit.mesh(bodyGeometry, coat, 0, 0.4, 0, dog);
  const chestGeometry = kit.track(new THREE.SphereGeometry(0.13, 10, 8));
  kit.mesh(chestGeometry, coatLight, 0, 0.36, 0.2, dog);
  // Head dipped toward the grass, mid-sniff.
  const head = new THREE.Group();
  head.position.set(0, 0.52, 0.32);
  head.rotation.x = 0.5;
  dog.add(head);
  const skullGeometry = kit.track(new THREE.SphereGeometry(0.115, 12, 9));
  kit.mesh(skullGeometry, coat, 0, 0, 0.02, head);
  const snoutGeometry = kit.track(
    new THREE.CapsuleGeometry(0.045, 0.07, 4, 8).rotateX(Math.PI / 2),
  );
  kit.mesh(snoutGeometry, coatLight, 0, -0.035, 0.13, head);
  const noseGeometry = kit.track(new THREE.SphereGeometry(0.022, 8, 6));
  kit.mesh(noseGeometry, dark, 0, -0.035, 0.19, head);
  for (const side of [-1, 1]) {
    const ear = kit.box(coat, side * 0.1, 0.04, -0.02, 0.045, 0.13, 0.08, false, head);
    ear.rotation.z = side * 0.3; // floppy
  }
  const collarGeometry = kit.track(
    new THREE.TorusGeometry(0.095, 0.018, 6, 16).rotateX(Math.PI / 2),
  );
  const band = kit.mesh(collarGeometry, collar, 0, 0.47, 0.25, dog);
  band.rotation.x = 0.4;
  const legGeometry = kit.track(new THREE.CylinderGeometry(0.032, 0.028, 0.28, 8));
  for (const [x, z] of [[-0.08, 0.16], [0.08, 0.16], [-0.08, -0.16], [0.08, -0.16]]) {
    kit.mesh(legGeometry, coat, x, 0.14, z, dog);
  }
  // Tail up and wagging.
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.48, -0.27);
  tailPivot.rotation.x = -0.8;
  dog.add(tailPivot);
  const tailGeometry = kit.track(new THREE.CapsuleGeometry(0.024, 0.14, 4, 8));
  kit.mesh(tailGeometry, coat, 0, 0.09, 0, tailPivot);
  return (t) => {
    tailPivot.rotation.z = Math.sin(t * 7 + phase) * 0.35;
    head.rotation.x = 0.5 + Math.sin(t * 0.9 + phase) * 0.15; // sniffing bob
  };
};

/** A gravel path as a spline ribbon hugging the ground. The curve passes
 *  through the entity anchor (local 0,0), which is exactly where an
 *  "on the path" placement lands, so the jogger stands on its center
 *  line as it sweeps past the fountain toward the back of the park. */
const buildPath: ObjectBuilder = (kit, parent) => {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.8, 0, 10.5),
    new THREE.Vector3(1.3, 0, 7.5),
    new THREE.Vector3(-0.2, 0, 4),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-2.2, 0, -3.5),
  ]);
  const gravel = surfaceMaterial(
    "path-gravel", 128, 128,
    (ctx, w, h) => {
      ctx.fillStyle = "#9a8a6e";
      ctx.fillRect(0, 0, w, h);
      const random = rng("path-gravel");
      const tones = ["#8a7a5e", "#ab9b7e", "#7e7058", "#b5a787"];
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = tones[Math.floor(random() * tones.length)];
        ctx.globalAlpha = 0.5;
        ctx.fillRect(random() * w, random() * h, 1.5 + random() * 2.5, 1 + random() * 2);
      }
      ctx.globalAlpha = 1;
    },
    { roughness: 0.95, repeat: [1, 1] },
  );
  const segments = 56;
  const width = 1.1;
  const length = curve.getLength();
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const normals = new Float32Array((segments + 1) * 2 * 3);
  const uvs = new Float32Array((segments + 1) * 2 * 2);
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    // Perpendicular in the ground plane.
    const nx = -tangent.z;
    const nz = tangent.x;
    for (const [edge, side] of [[0, -1], [1, 1]] as const) {
      const v = (i * 2 + edge) * 3;
      positions[v] = point.x + nx * side * (width / 2);
      positions[v + 1] = 0.012;
      positions[v + 2] = point.z + nz * side * (width / 2);
      normals[v + 1] = 1;
      uvs[(i * 2 + edge) * 2] = (t * length) / 1.3;
      uvs[(i * 2 + edge) * 2 + 1] = edge;
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = kit.track(new THREE.BufferGeometry());
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const ribbon = new THREE.Mesh(geometry, gravel);
  ribbon.receiveShadow = true;
  parent.add(ribbon);
  return undefined;
};

const buildScreen: ObjectBuilder = (kit, parent) => {
  const dark = finish.plastic(0x1b1e24);
  const panel = finish.ceramic(0x2e3440);
  rbox(kit, dark, 0, 0.85, 0, 1.2, 0.7, 0.05, parent, 0.02); // bezel
  kit.box(panel, 0, 0.85, 0.028, 1.1, 0.6, 0.01, false, parent); // panel face
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.04, 0.05, 0.46, 8)), dark, 0, 0.27, 0, parent);
  rbox(kit, dark, 0, 0.025, 0, 0.5, 0.05, 0.3, parent, 0.015); // base
  return undefined;
};

const buildShelf: ObjectBuilder = (kit, parent, entity) => {
  const wood = woodOf(entity);
  for (const x of [-0.55, 0.55]) {
    rbox(kit, wood, x, 0.8, 0, 0.06, 1.6, 0.32, parent, 0.015);
  }
  for (const y of [0.3, 0.8, 1.3]) {
    rbox(kit, wood, 0, y, 0, 1.16, 0.05, 0.32, parent, 0.012);
  }
  if (/book|paperback/.test(entity.descriptor.toLowerCase())) {
    const palette = [0xb04a4a, 0x4a6fb0, 0x4ab06f, 0xb0974a].map((color) =>
      finish.fabric(color),
    );
    // Deterministic ragged row of spines on the lower two boards.
    for (const boardY of [0.3, 0.8]) {
      let x = -0.5;
      let i = 0;
      while (x < 0.42) {
        const width = 0.07 + ((i * 7) % 4) * 0.015;
        const height = 0.26 + ((i * 3) % 3) * 0.03;
        kit.box(
          palette[i % palette.length],
          x + width / 2, boardY + 0.025 + height / 2, 0,
          width, height, 0.24,
          false, parent,
        );
        x += width + 0.015;
        i++;
      }
    }
  }
  return undefined;
};

// ---------------------------------------------------------------------------
// Beach dressing: parasol, palm, sandcastle, bucket, ball, cart, tower,
// surfboard, sailboat. All seaside props for the beach scene.
// ---------------------------------------------------------------------------

// A big tilted parasol on a pole driven into the sand, with alternating
// canopy panels for the classic seaside stripe.
const buildBeachUmbrella: ObjectBuilder = (kit, parent, entity) => {
  const pole = finish.wood(0xb08d57);
  const a = finish.fabric(colorFromText(entity.descriptor, entity.id) || 0xb33a3a);
  const b = finish.fabric(0xf2efe6);
  const canopy = new THREE.Group();
  canopy.position.y = 2.0;
  canopy.rotation.z = 0.28; // leaning over the chairs
  parent.add(canopy);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.028, 0.028, 4.0, 8)), pole, 0, 0, 0, canopy);
  // Eight alternating wedges form the dome.
  const wedge = kit.track(
    new THREE.CylinderGeometry(0.9, 0.9, 0.34, 8, 1, true, 0, Math.PI / 4),
  );
  for (let i = 0; i < 8; i++) {
    const panel = kit.mesh(wedge, i % 2 ? a : b, 0, 0.78, 0, canopy);
    panel.rotation.y = (i / 8) * Math.PI * 2;
    panel.scale.y = 0.9;
  }
  kit.mesh(kit.track(new THREE.SphereGeometry(0.06, 8, 6)), pole, 0, 1.02, 0, canopy); // finial
  return undefined;
};

// Palm parts cached per kit so a clump of palms shares one set.
const palmCache = new WeakMap<Kit, { frond: THREE.BufferGeometry; coconut: THREE.SphereGeometry }>();
function palmGeometryFor(kit: Kit) {
  let g = palmCache.get(kit);
  if (!g) {
    g = {
      frond: kit.track(new THREE.CapsuleGeometry(0.07, 1.1, 4, 8)),
      coconut: kit.track(new THREE.SphereGeometry(0.09, 8, 6)),
    };
    palmCache.set(kit, g);
  }
  return g;
}

const buildPalm: ObjectBuilder = (kit, parent, entity) => {
  const bark = woodMaterial(0x7a5a36, 0.95);
  const frondMat = foliageMaterial(0x3f7d44);
  const { frond, coconut } = palmGeometryFor(kit);
  const lean = /lean/.test(entity.descriptor.toLowerCase()) ? 0.18 : 0.06;
  const trunk = new THREE.Group();
  trunk.rotation.z = lean;
  parent.add(trunk);
  // Curved trunk from stacked, narrowing segments.
  const segGeometry = kit.track(new THREE.CylinderGeometry(0.13, 0.17, 0.6, 8));
  for (let i = 0; i < 5; i++) {
    const seg = kit.mesh(segGeometry, bark, i * 0.06, 0.3 + i * 0.58, 0, trunk);
    seg.rotation.z = -i * 0.03;
    seg.scale.setScalar(1 - i * 0.08);
  }
  const crown = new THREE.Group();
  crown.position.set(0.3, 3.1, 0);
  trunk.add(crown);
  // A ring of drooping fronds.
  for (let i = 0; i < 7; i++) {
    const f = kit.mesh(frond, frondMat, 0, 0, 0, crown);
    f.rotation.y = (i / 7) * Math.PI * 2;
    f.rotation.z = 1.15; // splay outward and down
    f.position.set(Math.sin((i / 7) * Math.PI * 2) * 0.5, 0, Math.cos((i / 7) * Math.PI * 2) * 0.5);
  }
  for (const [cx, cz] of [[0.1, 0.08], [-0.08, 0.06], [0.04, -0.1]]) {
    kit.mesh(coconut, bark, cx, -0.05, cz, crown);
  }
  return undefined;
};

const buildSandcastle: ObjectBuilder = (kit, parent) => {
  const sand = finish.stone(0xd9bf8f);
  const turret = (x: number, z: number, h: number, r: number) => {
    kit.mesh(kit.track(new THREE.CylinderGeometry(r, r * 1.25, h, 12)), sand, x, h / 2, z, parent);
    kit.mesh(kit.track(new THREE.ConeGeometry(r * 1.1, r * 1.3, 12)), sand, x, h + r * 0.6, z, parent);
  };
  turret(-0.22, 0.05, 0.32, 0.14);
  turret(0.22, -0.02, 0.34, 0.15);
  turret(0, 0.18, 0.46, 0.17); // tallest, back centre
  rbox(kit, sand, 0, 0.07, -0.06, 0.7, 0.14, 0.5, parent, 0.04); // base wall
  // A little paper flag on the tall turret.
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 5)), finish.wood(0x8a6a3e), 0, 0.78, 0.18, parent);
  const flag = kit.box(finish.fabric(0xb33a3a), 0.05, 0.82, 0.18, 0.1, 0.06, 0.004, false, parent);
  flag.castShadow = false;
  return undefined;
};

const buildBucket: ObjectBuilder = (kit, parent) => {
  const red = finish.plastic(0xc23a32);
  const blue = finish.plastic(0x3b6ea5);
  // Bucket tipped on its side with a spilled lump of sand.
  const bucket = new THREE.Group();
  bucket.position.set(0, 0.13, 0);
  bucket.rotation.z = 1.4;
  parent.add(bucket);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 14)), red, 0, 0, 0, bucket);
  const handleGeometry = kit.track(new THREE.TorusGeometry(0.12, 0.012, 6, 14, Math.PI));
  kit.mesh(handleGeometry, finish.metal(0x9aa0a8), 0, 0.02, 0, bucket);
  // Spade: handle plus blade lying in the sand.
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 6)), blue, 0.26, 0.04, 0.06, parent);
  const blade = rbox(kit, blue, 0.42, 0.02, 0.06, 0.1, 0.02, 0.14, parent, 0.02);
  blade.rotation.y = 0.3;
  kit.mesh(kit.track(new THREE.SphereGeometry(0.08, 8, 6)), finish.stone(0xd9bf8f), -0.16, 0.04, 0.02, parent);
  return undefined;
};

const buildBeachBall: ObjectBuilder = (kit, parent) => {
  // Striped panels via a canvas texture wrapped on a sphere.
  const skin = surfaceMaterial(
    "beachball", 256, 128,
    (ctx, w, h) => {
      const cols = ["#e23b3b", "#f2efe6", "#f2c037", "#3b8fd4", "#f2efe6", "#3fae5a"];
      const seg = w / cols.length;
      cols.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(i * seg, 0, seg + 1, h);
      });
    },
    { roughness: 0.4 },
  );
  const ball = kit.mesh(kit.track(new THREE.SphereGeometry(0.28, 20, 16)), skin, 0, 0.28, 0, parent);
  return (t) => {
    ball.position.y = 0.28 + Math.abs(Math.sin(t * 2.2)) * 0.5; // gentle bounce
    ball.rotation.y = t * 0.6;
  };
};

const buildIceCreamCart: ObjectBuilder = (kit, parent) => {
  const body = finish.paint(0xf2efe6);
  const trim = finish.paint(0x3b8fd4);
  const dark = finish.plastic(0x2b2e33);
  rbox(kit, body, 0, 0.62, 0, 1.0, 0.7, 0.62, parent, 0.04); // chest box
  rbox(kit, trim, 0, 0.3, 0, 1.02, 0.12, 0.64, parent, 0.03); // skirt band
  rbox(kit, dark, 0, 0.99, 0, 1.04, 0.08, 0.66, parent, 0.02); // lid
  // Two wheels and a push handle.
  const wheelGeometry = kit.track(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 14).rotateZ(Math.PI / 2));
  for (const x of [-0.42, 0.42]) {
    kit.mesh(wheelGeometry, dark, x, 0.16, 0.34, parent);
    kit.mesh(wheelGeometry, dark, x, 0.16, -0.34, parent);
  }
  const handleGeometry = kit.track(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8));
  const handle = kit.mesh(handleGeometry, finish.metal(0x9aa0a8), -0.56, 0.8, 0, parent);
  handle.rotation.z = 0.6;
  // Candy-striped awning over the top.
  const awning = surfaceMaterial(
    "cart-awning", 128, 64,
    (ctx, w, h) => {
      const seg = w / 8;
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? "#e23b3b" : "#f2efe6";
        ctx.fillRect(i * seg, 0, seg + 1, h);
      }
    },
    { roughness: 0.85 },
  );
  const canopy = rbox(kit, awning, 0, 1.34, 0.06, 1.16, 0.06, 0.8, parent, 0.02);
  canopy.rotation.x = -0.12;
  for (const x of [-0.5, 0.5]) {
    kit.mesh(kit.track(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6)), finish.metal(0x9aa0a8), x, 1.15, 0.34, parent);
  }
  return undefined;
};

const buildLifeguardTower: ObjectBuilder = (kit, parent) => {
  const wood = finish.wood(0xc9a25e);
  const white = finish.paint(0xf2efe6);
  const dark = finish.plastic(0x2b2e33);
  // Four splayed stilts.
  for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
    const leg = kit.box(wood, x, 0.7, z, 0.08, 1.4, 0.08, false, parent);
    leg.rotation.z = -Math.sign(x) * 0.07;
    leg.rotation.x = -Math.sign(z) * 0.07;
  }
  rbox(kit, wood, 0, 1.42, 0, 1.2, 0.1, 1.2, parent, 0.03); // deck
  // Cabin: three walls + a slanted roof, open toward the sea.
  rbox(kit, white, 0, 1.95, -0.5, 1.1, 1.0, 0.08, parent, 0.03); // back wall
  for (const x of [-0.5, 0.5]) {
    rbox(kit, white, x, 1.95, 0, 0.08, 1.0, 1.0, parent, 0.03); // side walls
  }
  const roof = rbox(kit, finish.paint(0xc23a32), 0, 2.5, 0, 1.3, 0.08, 1.3, parent, 0.03);
  roof.rotation.x = -0.14;
  // A railing across the open front and a flag pole with a red flag.
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 6).rotateZ(Math.PI / 2)), dark, 0, 1.75, 0.5, parent);
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6)), dark, 0.6, 3.0, -0.5, parent);
  kit.box(finish.fabric(0xc23a32), 0.78, 3.3, -0.5, 0.34, 0.22, 0.01, false, parent);
  return undefined;
};

const buildSurfboard: ObjectBuilder = (kit, parent, entity) => {
  const board = finish.plastic(colorFromText(entity.descriptor, entity.id) || 0xf2c037);
  const stripe = finish.plastic(0xf2efe6);
  // An upright board planted in the sand: a stretched, rounded slab.
  const body = new THREE.Group();
  body.position.set(0, 0.95, 0);
  body.rotation.z = 0.12;
  parent.add(body);
  const slab = rbox(kit, board, 0, 0, 0, 0.42, 1.9, 0.08, body, 0.2);
  slab.scale.y = 1; // already long
  kit.box(stripe, 0, 0, 0.045, 0.04, 1.7, 0.02, false, body); // centre stringer
  return undefined;
};

const buildSailboat: ObjectBuilder = (kit, parent) => {
  const hull = finish.paint(0xf2efe6);
  const sailMat = finish.fabric(0xf2efe6);
  const accent = finish.paint(0xc23a32);
  const boat = new THREE.Group();
  parent.add(boat);
  // Hull: a stretched half-capsule sitting low on the water.
  const hullMesh = kit.mesh(kit.track(new THREE.CapsuleGeometry(0.22, 0.7, 4, 10).rotateZ(Math.PI / 2)), hull, 0, 0.16, 0, boat);
  hullMesh.scale.set(1, 0.55, 0.5);
  kit.box(accent, 0, 0.26, 0, 1.0, 0.04, 0.26, false, boat); // deck stripe
  kit.mesh(kit.track(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6)), finish.wood(0x8a6a3e), 0, 0.9, 0, boat); // mast
  // Triangular mainsail from a thin tapered cone wedge.
  const sail = kit.mesh(kit.track(new THREE.ConeGeometry(0.34, 1.1, 3)), sailMat, 0.12, 0.92, 0, boat);
  sail.scale.set(0.5, 1, 1);
  return (t) => {
    boat.rotation.z = Math.sin(t * 0.5) * 0.04; // gentle rock
    boat.position.y = Math.sin(t * 0.7) * 0.03;
  };
};

// Ordered: more specific phrases before generic ones.
const OBJECT_BUILDERS: [RegExp, ObjectBuilder][] = [
  [/umbrella stand/, buildUmbrellaStand],
  [/beach umbrella|parasol/, buildBeachUmbrella],
  [/sandcastle|sand castle/, buildSandcastle],
  [/bucket|spade|pail/, buildBucket],
  [/beach ?ball/, buildBeachBall],
  [/ice.?cream cart|\bcart\b/, buildIceCreamCart],
  [/lifeguard|watchtower/, buildLifeguardTower],
  [/surfboard|surf board/, buildSurfboard],
  [/sailboat|sail boat|dinghy|\byacht\b/, buildSailboat],
  [/\bpalm\b/, buildPalm],
  [/stop sign|bus sign|street sign/, buildSign],
  // "lamp hanging over the tables" must not hit the table builder; the
  // generic /lamp/ further down covers freestanding lamps.
  [/pendant|hanging lamp|lantern/, buildPendantLamp],
  [/clock/, buildClock],
  // Coffee-shop dressing; "mug rack" must beat the bare cup/mug builder.
  [/mug rack|display rack/, buildMugRack],
  [/brewing shelf|coffee pot|french press/, buildBrewShelf],
  [/grinder/, buildGrinder],
  [/sack|burlap/, buildBeanSacks],
  // "shelter bench" must hit the bench builder, not the shelter one.
  [/bench/, buildBench],
  [/shelter/, buildShelter],
  // Path before fountain/tree: its detail text may mention the scenery
  // it curves past.
  [/path|trail|walkway/, buildPath],
  [/fountain/, buildFountain],
  [/grove|stand of trees|\btrees\b/, buildTreeCluster],
  // Word-bounded so "s-tree-t lamp" doesn't read as a tree.
  [/\btree\b|\boak\b/, buildTree],
  [/counter/, buildCounter],
  [/espresso|machine/, buildMachine],
  [/pastry|display case|glass case/, buildDisplayCase],
  [/menu|chalkboard|board|sign/, buildBoard],
  [/chair|stool/, buildChair],
  // Street furniture: specific names before the generic indoor lamp.
  [/street ?lamp|lamp ?post|lamppost|street ?light/, buildStreetLamp],
  [/lamp/, buildLamp],
  [/litter|\bbin\b|rubbish|trash|waste|recycl/, buildLitterBin],
  [/hydrant/, buildHydrant],
  [/bollard/, buildBollards],
  [/traffic cone|\bcone\b/, buildCone],
  [/post ?box|postbox|mail ?box|pillar box/, buildPostbox],
  [/bike rack|bicycle rack|cycle rack|bike stand/, buildBikeRack],
  [/pigeon|\bbirds?\b|sparrow/, buildPigeons],
  [/table|desk/, buildTable],
  [/pond|lake/, buildPond],
  [/bush|shrub|hedge/, buildBushes],
  [/blanket|towel|picnic mat|\brug\b/, buildPicnicMat],
  [/basket|hamper/, buildBasket],
  [/\bdog\b|puppy/, buildDog],
  [/briefcase|suitcase/, buildBriefcase],
  [/cup|mug|latte/, buildCup],
  [/plant|pot\b/, buildPlant],
  [/\btv\b|television|screen|monitor/, buildScreen],
  [/shelf|shelving|bookcase/, buildShelf],
  [/umbrella/, (kit, parent, entity) =>
    void buildUmbrella(kit, parent, colorFromText(entity.descriptor, entity.id))],
];

// ---------------------------------------------------------------------------
// Mandatory fallback: a scene must never fail to render. Unmapped
// descriptors become a clean rounded block with a labeled plaque.
// ---------------------------------------------------------------------------

function buildPlaceholder(kit: Kit, parent: THREE.Group, entity: PlacedEntity): undefined {
  const tint = sharedMaterial({
    color: colorFromText(entity.descriptor, entity.id),
    roughness: 0.8,
  });
  rbox(kit, tint, 0, 0.4, 0, 0.66, 0.8, 0.66, parent, 0.05);
  const label = entity.descriptor.slice(0, 48);
  canvasPlane(
    kit, parent, `placeholder:${label}`,
    (ctx) => {
      ctx.clearRect(0, 0, 512, 96);
      ctx.fillStyle = "rgba(16, 20, 31, 0.92)";
      ctx.beginPath();
      ctx.roundRect(6, 6, 500, 84, 18);
      ctx.fill();
      ctx.strokeStyle = "#8a93a8";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#f1f5f9";
      ctx.textAlign = "center";
      fitText(ctx, label, 460, "500 {size}px system-ui, sans-serif", 30);
      ctx.fillText(label, 256, 58);
    },
    512, 96, 1.6, 0.3, 0, 1.05, 0, 0, true,
  );
  return undefined;
}

// ---------------------------------------------------------------------------

export function buildSceneMeshes(entities: PlacedEntity[]): BuiltScene {
  const kit = new Kit();
  const updates: Update[] = [];
  const fallbacks: string[] = [];

  for (const entity of entities) {
    const group = new THREE.Group();
    const [x, y, z] = entity.transform.position;
    group.position.set(x, y, z);
    group.rotation.y = entity.transform.rotationY;
    group.userData.id = entity.id;
    kit.group.add(group);

    let update: Update | undefined;
    if (entity.kind === "anomaly") {
      const text = `${entity.descriptor} ${entity.action ?? ""}`.toLowerCase();
      const builder = ANOMALY_BUILDERS.find(([pattern]) => pattern.test(text));
      if (builder) {
        update = builder[1](kit, group, entity);
      } else {
        fallbacks.push(entity.descriptor);
        update = buildPlaceholder(kit, group, entity);
      }
      group.scale.setScalar(anomalyScale(entity.descriptor));
    } else if (entity.kind === "person") {
      update = buildPerson(kit, group, entity).update;
    } else {
      const text = entity.descriptor.toLowerCase();
      const builder = OBJECT_BUILDERS.find(([pattern]) => pattern.test(text));
      if (builder) {
        update = builder[1](kit, group, entity);
      } else {
        fallbacks.push(entity.descriptor);
        update = buildPlaceholder(kit, group, entity);
      }
      // Slight seeded yaw/scale variation so repeated props are never
      // copy-pasted clones.
      group.rotation.y += (hash01(`${entity.id}:vyaw`) * 2 - 1) * 0.07;
      group.scale.multiplyScalar(0.97 + hash01(`${entity.id}:vscale`) * 0.06);
    }
    if (update) updates.push(update);

    // Ground contact: builders aim feet/bases at y=0, but poses, scales,
    // and stacked spheres can leave an entity hovering or sunk. Clamp
    // ground-level entities so their lowest point rests on the floor;
    // stacked placements ("on the blanket", "above the counter") keep
    // the height the compiler gave them.
    if (y < 0.02) {
      const bounds = new THREE.Box3().setFromObject(group);
      if (!bounds.isEmpty() && Math.abs(bounds.min.y) > 0.02) {
        group.position.y -= bounds.min.y;
      }
    }

    // Soft contact blob under props and creatures (people get real shadow
    // detail from their many parts; wall-mounted boards float on purpose,
    // and water features sit in the ground rather than on it).
    if (
      entity.kind !== "person" &&
      entity.transform.position[1] < 1 &&
      !/pond|lake|pool|puddle|path|trail/.test(entity.descriptor.toLowerCase())
    ) {
      const bounds = new THREE.Box3().setFromObject(group);
      const size = bounds.getSize(new THREE.Vector3());
      contactShadow(
        group,
        Math.max(0.22, (size.x / group.scale.x) * 0.6),
        Math.max(0.22, (size.z / group.scale.z) * 0.6),
      );
    }

    // Tag every mesh so raycasts can recover the manifest id later.
    group.traverse((child) => {
      child.userData.id = entity.id;
    });
  }

  const { group, dispose } = kit.build();
  return {
    group,
    update: (elapsed) => updates.forEach((fn) => fn(elapsed)),
    dispose,
    fallbacks,
  };
}
