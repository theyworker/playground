import * as THREE from "three";
import { Kit } from "../pac-meeting/mansion-kit";
import { sharedMaterial } from "./materials";
import { colorFromText } from "./palette";
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

// Kit.canvasPlane always parents into kit.group; entities need planes
// inside their own group, so this mirrors it with a parent parameter.
function canvasPlane(
  kit: Kit,
  parent: THREE.Object3D,
  draw: (ctx: CanvasRenderingContext2D) => void,
  canvasW: number,
  canvasH: number,
  planeW: number,
  planeH: number,
  x: number,
  y: number,
  z: number,
  rotationY = 0,
): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  draw(canvas.getContext("2d")!);
  const texture = kit.track(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = kit.track(
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
  );
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
    kit, parent,
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
// Objects: primitive combos keyed off name + detail.
// ---------------------------------------------------------------------------

type ObjectBuilder = (kit: Kit, parent: THREE.Group, entity: PlacedEntity) => Update | undefined;

function woodOf(kit: Kit, entity: PlacedEntity): THREE.Material {
  return sharedMaterial({
    color: colorFromText(entity.descriptor, entity.id),
    roughness: 0.85,
  });
}

const buildBench: ObjectBuilder = (kit, parent, entity) => {
  const paint = woodOf(kit, entity);
  const iron = sharedMaterial({ color: 0x3a3d42, metalness: 0.4, roughness: 0.6 });
  kit.box(paint, 0, 0.46, 0, 1.7, 0.08, 0.55, false, parent); // seat
  const back = kit.box(paint, 0, 0.78, -0.24, 1.7, 0.5, 0.07, false, parent);
  back.rotation.x = -0.15;
  for (const x of [-0.7, 0.7]) {
    kit.box(iron, x, 0.21, 0, 0.08, 0.42, 0.5, false, parent);
  }
  return undefined;
};

const buildFountain: ObjectBuilder = (kit, parent) => {
  const stone = sharedMaterial({ color: 0x9b948a, roughness: 0.9 });
  const water = sharedMaterial({ color: 0x5d9bc4, roughness: 0.2, metalness: 0.1 });
  const basinGeometry = kit.track(new THREE.CylinderGeometry(1.05, 1.15, 0.4, 24));
  kit.mesh(basinGeometry, stone, 0, 0.2, 0, parent);
  const poolGeometry = kit.track(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 24));
  kit.mesh(poolGeometry, water, 0, 0.4, 0, parent);
  const columnGeometry = kit.track(new THREE.CylinderGeometry(0.12, 0.18, 0.6, 12));
  kit.mesh(columnGeometry, stone, 0, 0.7, 0, parent);
  const jetGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.09, 0.5, 8));
  const jet = kit.mesh(jetGeometry, water, 0, 1.25, 0, parent);
  return (t) => {
    jet.scale.y = 1 + Math.sin(t * 4) * 0.12;
  };
};

const buildTree: ObjectBuilder = (kit, parent) => {
  const bark = sharedMaterial({ color: 0x5d4023, roughness: 0.95 });
  const leaves = sharedMaterial({ color: 0x3a6b35, roughness: 0.9 });
  const trunkGeometry = kit.track(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 10));
  kit.mesh(trunkGeometry, bark, 0, 0.8, 0, parent);
  const crownGeometry = kit.track(new THREE.SphereGeometry(0.85, 14, 10));
  kit.mesh(crownGeometry, leaves, 0, 2.1, 0, parent);
  const tuftGeometry = kit.track(new THREE.SphereGeometry(0.55, 12, 9));
  kit.mesh(tuftGeometry, leaves, 0.55, 1.75, 0.2, parent);
  kit.mesh(tuftGeometry, leaves, -0.5, 1.85, -0.15, parent);
  return undefined;
};

const buildCounter: ObjectBuilder = (kit, parent) => {
  const wood = sharedMaterial({ color: 0x5d4023, roughness: 0.7 });
  const top = sharedMaterial({ color: 0x3d2a16, roughness: 0.45 });
  const brass = sharedMaterial({ color: 0xb08d3a, metalness: 0.7, roughness: 0.35 });
  kit.box(wood, 0, 0.44, 0, 2.8, 0.88, 0.7, false, parent);
  kit.box(top, 0, 0.92, 0, 3.0, 0.06, 0.8, false, parent);
  kit.box(brass, 1.1, 1.07, -0.1, 0.3, 0.24, 0.3, false, parent); // till
  return undefined;
};

const buildMachine: ObjectBuilder = (kit, parent) => {
  const chrome = sharedMaterial({ color: 0xb9bec7, metalness: 0.85, roughness: 0.25 });
  const dark = sharedMaterial({ color: 0x2b2e33, roughness: 0.5 });
  kit.box(chrome, 0, 0.24, 0, 0.5, 0.46, 0.38, false, parent);
  kit.box(dark, 0, 0.5, 0, 0.52, 0.07, 0.4, false, parent);
  const spoutGeometry = kit.track(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8));
  kit.mesh(spoutGeometry, dark, 0.12, 0.1, 0.22, parent);
  return undefined;
};

const buildDisplayCase: ObjectBuilder = (kit, parent) => {
  const glass = sharedMaterial({
    color: 0xcfe4ec, roughness: 0.1, metalness: 0.1,
    transparent: true, opacity: 0.35,
  });
  const base = sharedMaterial({ color: 0x4a3a28, roughness: 0.8 });
  const pastry = sharedMaterial({ color: 0xc4924a, roughness: 0.8 });
  kit.box(base, 0, 0.06, 0, 0.7, 0.12, 0.5, false, parent);
  kit.box(glass, 0, 0.36, 0, 0.7, 0.48, 0.5, false, parent);
  const bunGeometry = kit.track(new THREE.SphereGeometry(0.07, 10, 8));
  for (const x of [-0.2, 0, 0.2]) {
    kit.mesh(bunGeometry, pastry, x, 0.2, 0, parent);
  }
  return undefined;
};

const buildBoard: ObjectBuilder = (kit, parent, entity) => {
  const frame = sharedMaterial({ color: 0x5d4023, roughness: 0.8 });
  kit.box(frame, 0, 0, 0, 1.5, 0.95, 0.06, false, parent);
  canvasPlane(
    kit, parent,
    (ctx) => {
      ctx.fillStyle = "#22301f";
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = "#e8e4d2";
      ctx.font = "bold 56px serif";
      ctx.textAlign = "center";
      const title = entity.descriptor.split(" — ")[0].toUpperCase();
      ctx.fillText(title.slice(0, 18), 256, 78);
      ctx.strokeStyle = "#cdc8b4";
      ctx.lineWidth = 5;
      for (let y = 130; y <= 270; y += 46) {
        ctx.beginPath();
        ctx.moveTo(70, y);
        ctx.lineTo(330 + (y % 92), y);
        ctx.stroke();
      }
      // The doodle of a coffee cup.
      ctx.strokeRect(404, 180, 60, 70);
      ctx.beginPath();
      ctx.arc(470, 215, 18, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    },
    512, 320, 1.36, 0.82, 0, 0, 0.035,
  );
  return undefined;
};

const buildTable: ObjectBuilder = (kit, parent, entity) => {
  const wood = woodOf(kit, entity);
  if (/round/.test(entity.descriptor.toLowerCase())) {
    const topGeometry = kit.track(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 20));
    kit.mesh(topGeometry, wood, 0, 0.71, 0, parent);
    const stemGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.05, 0.68, 10));
    kit.mesh(stemGeometry, wood, 0, 0.35, 0, parent);
    const footGeometry = kit.track(new THREE.CylinderGeometry(0.26, 0.3, 0.05, 16));
    kit.mesh(footGeometry, wood, 0, 0.03, 0, parent);
  } else {
    kit.box(wood, 0, 0.71, 0, 0.9, 0.06, 0.9, false, parent);
    for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) {
      kit.box(wood, x, 0.34, z, 0.07, 0.68, 0.07, false, parent);
    }
  }
  return undefined;
};

const buildUmbrella = (kit: Kit, parent: THREE.Group, tint: number, scale = 1) => {
  const pole = sharedMaterial({ color: 0x4a4d52, metalness: 0.3, roughness: 0.6 });
  const canopy = sharedMaterial({ color: tint, roughness: 0.8 });
  const poleGeometry = kit.track(new THREE.CylinderGeometry(0.02 * scale, 0.02 * scale, 0.9 * scale, 8));
  kit.mesh(poleGeometry, pole, 0, 0.45 * scale, 0, parent);
  const coneGeometry = kit.track(new THREE.ConeGeometry(0.32 * scale, 0.22 * scale, 12));
  kit.mesh(coneGeometry, canopy, 0, 0.85 * scale, 0, parent);
};

const buildUmbrellaStand: ObjectBuilder = (kit, parent, entity) => {
  const metal = sharedMaterial({ color: 0x6a6f76, metalness: 0.6, roughness: 0.4 });
  const bucketGeometry = kit.track(new THREE.CylinderGeometry(0.24, 0.2, 0.5, 14));
  kit.mesh(bucketGeometry, metal, 0, 0.25, 0, parent);
  const lean = new THREE.Group();
  lean.position.y = 0.1;
  parent.add(lean);
  buildUmbrella(kit, lean, 0x2c3e63, 0.85);
  const second = new THREE.Group();
  second.position.set(0.1, 0.1, 0.05);
  second.rotation.z = 0.18;
  parent.add(second);
  buildUmbrella(kit, second, colorFromText("", entity.id), 0.8);
  return undefined;
};

const buildShelter: ObjectBuilder = (kit, parent) => {
  const glass = sharedMaterial({
    color: 0xd2e4ec, roughness: 0.08, metalness: 0.1,
    transparent: true, opacity: 0.28,
  });
  const steel = sharedMaterial({ color: 0x4a4d52, metalness: 0.5, roughness: 0.5 });
  kit.box(glass, 0, 1.1, -0.55, 2.6, 1.9, 0.05, false, parent); // back panel
  for (const x of [-1.3, 1.3]) {
    kit.box(glass, x, 1.1, 0, 0.05, 1.9, 1.1, false, parent);
    kit.box(steel, x, 1.1, -0.55, 0.08, 2.2, 0.08, false, parent);
  }
  kit.box(steel, 0, 2.24, 0, 2.9, 0.08, 1.4, false, parent); // roof
  canvasPlane(
    kit, parent,
    (ctx) => {
      ctx.fillStyle = "#e8e4d8";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#2c3e63";
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 240, 240);
      ctx.fillStyle = "#2c3e63";
      ctx.font = "bold 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ROUTE MAP", 128, 52);
      ctx.beginPath();
      ctx.moveTo(36, 200); ctx.lineTo(110, 120); ctx.lineTo(220, 150);
      ctx.stroke();
      for (const [x, y] of [[36, 200], [110, 120], [220, 150]]) {
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    256, 256, 0.7, 0.7, 0.6, 1.3, -0.51,
  );
  return undefined;
};

const buildSign: ObjectBuilder = (kit, parent, entity) => {
  const steel = sharedMaterial({ color: 0x4a4d52, metalness: 0.5, roughness: 0.5 });
  const poleGeometry = kit.track(new THREE.CylinderGeometry(0.035, 0.035, 2.4, 10));
  kit.mesh(poleGeometry, steel, 0, 1.2, 0, parent);
  const routeNumber = /\d+/.exec(entity.descriptor)?.[0] ?? "BUS";
  canvasPlane(
    kit, parent,
    (ctx) => {
      ctx.fillStyle = "#2c3e63";
      ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, 240, 176);
      ctx.fillStyle = "#f1f5f9";
      ctx.textAlign = "center";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText("BUS STOP", 128, 70);
      ctx.font = "bold 72px sans-serif";
      ctx.fillText(routeNumber, 128, 155);
    },
    256, 192, 0.56, 0.42, 0, 2.15, 0.04,
  );
  return undefined;
};

const buildBriefcase: ObjectBuilder = (kit, parent) => {
  const leather = sharedMaterial({ color: 0x5d3a1e, roughness: 0.6 });
  const body = kit.box(leather, 0, 0.16, 0, 0.42, 0.3, 0.12, false, parent);
  body.rotation.x = -0.06;
  kit.box(leather, 0, 0.345, 0, 0.14, 0.05, 0.04, false, parent); // handle
  const cloth = sharedMaterial({ color: 0x6a7076, roughness: 0.95 });
  const jacket = kit.box(cloth, 0.42, 0.06, 0, 0.34, 0.1, 0.26, false, parent);
  jacket.rotation.y = 0.4;
  return undefined;
};

const buildCup: ObjectBuilder = (kit, parent) => {
  const ceramic = sharedMaterial({ color: 0xe8e4d8, roughness: 0.5 });
  const cupGeometry = kit.track(new THREE.CylinderGeometry(0.06, 0.045, 0.12, 12));
  kit.mesh(cupGeometry, ceramic, 0, 0.06, 0, parent);
  return undefined;
};

const buildPlant: ObjectBuilder = (kit, parent) => {
  const clay = sharedMaterial({ color: 0xa05a37, roughness: 0.85 });
  const leaves = sharedMaterial({ color: 0x3a6b35, roughness: 0.9 });
  const potGeometry = kit.track(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 12));
  kit.mesh(potGeometry, clay, 0, 0.12, 0, parent);
  const bushGeometry = kit.track(new THREE.SphereGeometry(0.22, 12, 9));
  kit.mesh(bushGeometry, leaves, 0, 0.42, 0, parent);
  return undefined;
};

const buildScreen: ObjectBuilder = (kit, parent) => {
  const dark = sharedMaterial({ color: 0x1b1e24, roughness: 0.4 });
  kit.box(dark, 0, 0.85, 0, 1.2, 0.7, 0.06, false, parent);
  kit.box(dark, 0, 0.25, 0, 0.1, 0.5, 0.1, false, parent);
  kit.box(dark, 0, 0.02, 0, 0.5, 0.04, 0.3, false, parent);
  return undefined;
};

const buildShelf: ObjectBuilder = (kit, parent, entity) => {
  const wood = woodOf(kit, entity);
  for (const x of [-0.55, 0.55]) {
    kit.box(wood, x, 0.8, 0, 0.06, 1.6, 0.32, false, parent);
  }
  for (const y of [0.3, 0.8, 1.3]) {
    kit.box(wood, 0, y, 0, 1.16, 0.05, 0.32, false, parent);
  }
  return undefined;
};

// Ordered: more specific phrases before generic ones.
const OBJECT_BUILDERS: [RegExp, ObjectBuilder][] = [
  [/umbrella stand/, buildUmbrellaStand],
  [/stop sign|bus sign|street sign/, buildSign],
  // "shelter bench" must hit the bench builder, not the shelter one.
  [/bench/, buildBench],
  [/shelter/, buildShelter],
  [/fountain/, buildFountain],
  [/tree|oak/, buildTree],
  [/counter/, buildCounter],
  [/espresso|machine/, buildMachine],
  [/pastry|display case|glass case/, buildDisplayCase],
  [/menu|chalkboard|board|sign/, buildBoard],
  [/table|desk/, buildTable],
  [/briefcase|suitcase/, buildBriefcase],
  [/cup|mug|latte/, buildCup],
  [/plant|pot\b/, buildPlant],
  [/\btv\b|television|screen|monitor/, buildScreen],
  [/shelf|shelving|bookcase/, buildShelf],
  [/umbrella/, (kit, parent, entity) =>
    void buildUmbrella(kit, parent, colorFromText(entity.descriptor, entity.id))],
];

// ---------------------------------------------------------------------------
// Mandatory fallback: a scene must never fail to render.
// ---------------------------------------------------------------------------

function buildPlaceholder(kit: Kit, parent: THREE.Group, entity: PlacedEntity): undefined {
  const tint = sharedMaterial({
    color: colorFromText(entity.descriptor, entity.id),
    roughness: 0.8,
  });
  kit.box(tint, 0, 0.4, 0, 0.7, 0.8, 0.7, false, parent);
  canvasPlane(
    kit, parent,
    (ctx) => {
      ctx.fillStyle = "#10141f";
      ctx.fillRect(0, 0, 512, 96);
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 5;
      ctx.strokeRect(4, 4, 504, 88);
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(entity.descriptor.slice(0, 38), 256, 58);
    },
    512, 96, 1.8, 0.34, 0, 1.05, 0,
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
    }
    if (update) updates.push(update);

    // Ground contact: builders aim feet/bases at y=0, but poses, scales,
    // and stacked spheres can leave an entity hovering or sunk. Clamp
    // ground-level entities so their lowest point rests on the floor;
    // stacked placements ("on the bench", "above the counter") keep the
    // height the compiler gave them.
    if (y < 0.05) {
      const bounds = new THREE.Box3().setFromObject(group);
      if (!bounds.isEmpty() && Math.abs(bounds.min.y) > 0.02) {
        group.position.y -= bounds.min.y;
      }
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
