import * as THREE from "three";
import { Kit } from "../pac-meeting/mansion-kit";
import { hash01 } from "./compile";
import { sharedMaterial } from "./materials";
import { colorFromText, pick, SKIN_TONES, TROUSER_PALETTE } from "./palette";
import { faceMaterial, stripedMaterial } from "./textures";
import type { Mood } from "./textures";
import type { PlacedEntity } from "./compile";

// Procedural human rig. A figure is a hierarchy of named pivot groups —
// torso (waist), head (neck), and two-segment limbs (shoulder/elbow,
// hip/knee) — so every pose is expressed by rotating joints on one shared
// skeleton rather than swapping shapes. Proportions follow a stylized
// ~7-head figure; per-person height/build/skin/clothing variation is
// seeded from the entity id so the cast is deterministic but not clones.
//
// All figures share one geometry set per scene build, and materials come
// from the shared cache, so a crowd stays cheap on mobile.

export type Update = (elapsed: number) => void;

// Honors the OS-level reduced-motion preference: poses still apply, but
// the idle/action micro-motion is dropped entirely.
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Base skeleton dimensions (heightScale 1 is a ~1.8-unit figure).
const HIP_Y = 0.88;
const KNEE_DROP = 0.4; // hip pivot to knee pivot
const SHOULDER = { x: 0.21, y: 0.54 } as const; // torso-local
const ELBOW_DROP = 0.28; // shoulder pivot to elbow pivot
const HAND_DROP = 0.26; // elbow pivot to hand center
const NECK_Y = 0.66; // torso-local head pivot
const SHOE = 0x2b2e33;

export interface PersonLimb {
  /** Shoulder or hip pivot. rotation.x < 0 swings the limb forward. */
  root: THREE.Group;
  /** Elbow or knee pivot (elbows bend negative, knees positive). */
  joint: THREE.Group;
}

export interface PersonRig {
  pose: THREE.Group; // origin at the feet
  torso: THREE.Group; // pivot at the waist — lean here
  head: THREE.Group; // pivot at the neck base
  leftArm: PersonLimb;
  rightArm: PersonLimb;
  leftLeg: PersonLimb;
  rightLeg: PersonLimb;
  heightScale: number;
  phase: number;
}

interface PersonGeometry {
  head: THREE.SphereGeometry;
  neck: THREE.CylinderGeometry;
  chest: THREE.CylinderGeometry;
  upperArm: THREE.CapsuleGeometry;
  forearm: THREE.CapsuleGeometry;
  hand: THREE.SphereGeometry;
  thigh: THREE.CapsuleGeometry;
  shin: THREE.CapsuleGeometry;
}

// One geometry set per Kit (i.e. per scene build); every figure reuses it.
const geometryCache = new WeakMap<Kit, PersonGeometry>();

function geometryFor(kit: Kit): PersonGeometry {
  let geometry = geometryCache.get(kit);
  if (!geometry) {
    geometry = {
      head: kit.track(new THREE.SphereGeometry(0.12, 18, 14)),
      neck: kit.track(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 10)),
      // Tapered torso: broader shoulders, narrower waist.
      chest: kit.track(new THREE.CylinderGeometry(0.165, 0.125, 0.46, 14)),
      upperArm: kit.track(new THREE.CapsuleGeometry(0.05, 0.2, 4, 10)),
      forearm: kit.track(new THREE.CapsuleGeometry(0.043, 0.18, 4, 10)),
      hand: kit.track(new THREE.SphereGeometry(0.05, 10, 8)),
      thigh: kit.track(new THREE.CapsuleGeometry(0.07, 0.28, 4, 10)),
      shin: kit.track(new THREE.CapsuleGeometry(0.055, 0.26, 4, 10)),
    };
    geometryCache.set(kit, geometry);
  }
  return geometry;
}

interface Outfit {
  top: THREE.Material;
  trousers: THREE.Material;
  skin: THREE.Material;
  shoes: THREE.Material;
}

function buildLeg(
  kit: Kit,
  geometry: PersonGeometry,
  outfit: Outfit,
  pose: THREE.Group,
  side: number,
  name: string,
): PersonLimb {
  const root = new THREE.Group();
  root.name = `${name}Hip`;
  root.position.set(side * 0.1, HIP_Y, 0);
  pose.add(root);
  kit.mesh(geometry.thigh, outfit.trousers, 0, -0.2, 0, root);

  const joint = new THREE.Group();
  joint.name = `${name}Knee`;
  joint.position.y = -KNEE_DROP;
  root.add(joint);
  kit.mesh(geometry.shin, outfit.trousers, 0, -0.19, 0, joint);
  kit.box(outfit.shoes, 0, -0.435, 0.06, 0.11, 0.07, 0.24, false, joint);
  return { root, joint };
}

function buildArm(
  kit: Kit,
  geometry: PersonGeometry,
  outfit: Outfit,
  torso: THREE.Group,
  side: number,
  name: string,
): PersonLimb {
  const root = new THREE.Group();
  root.name = `${name}Shoulder`;
  root.position.set(side * SHOULDER.x, SHOULDER.y, 0);
  torso.add(root);
  kit.mesh(geometry.upperArm, outfit.top, 0, -0.14, 0, root);

  const joint = new THREE.Group();
  joint.name = `${name}Elbow`;
  joint.position.y = -ELBOW_DROP;
  root.add(joint);
  kit.mesh(geometry.forearm, outfit.top, 0, -0.12, 0, joint);
  kit.mesh(geometry.hand, outfit.skin, 0, -HAND_DROP, 0, joint);
  return { root, joint };
}

function buildRig(
  kit: Kit,
  parent: THREE.Group,
  entity: PlacedEntity,
  tintOverride?: number,
): PersonRig {
  const geometry = geometryFor(kit);
  const topTint = tintOverride ?? colorFromText(entity.descriptor, entity.id);
  const skinTint = pick(SKIN_TONES, `${entity.id}:skin`);
  // A seeded minority of the cast wears a striped top for variety.
  const striped =
    tintOverride === undefined && hash01(`${entity.id}:pattern`) < 0.35;
  const outfit: Outfit = {
    top: striped
      ? stripedMaterial(topTint)
      : sharedMaterial({ color: topTint, roughness: 0.85 }),
    trousers: sharedMaterial({
      color: tintOverride ?? pick(TROUSER_PALETTE, `${entity.id}:trousers`),
      roughness: 0.85,
    }),
    skin: sharedMaterial({ color: skinTint, roughness: 0.65 }),
    shoes: sharedMaterial({ color: SHOE, roughness: 0.6 }),
  };
  const moods: Mood[] = ["calm", "smile", "open"];
  const mood = moods[Math.floor(hash01(`${entity.id}:mood`) * 3) % 3];

  const pose = new THREE.Group();
  pose.name = "person";
  // Seeded build variation: scale height and girth independently so no
  // two figures share a silhouette.
  const heightScale = 0.92 + hash01(`${entity.id}:height`) * 0.16;
  const build = 0.9 + hash01(`${entity.id}:build`) * 0.2;
  pose.scale.set(build, heightScale, build);
  parent.add(pose);

  const torso = new THREE.Group();
  torso.name = "torso";
  torso.position.y = HIP_Y;
  pose.add(torso);
  kit.box(outfit.trousers, 0, 0.07, 0, 0.3, 0.18, 0.19, false, torso); // hips
  const chest = kit.mesh(geometry.chest, outfit.top, 0, 0.36, 0, torso);
  chest.scale.z = 0.78; // flatten front-to-back
  kit.mesh(geometry.neck, outfit.skin, 0, 0.62, 0, torso);

  const head = new THREE.Group();
  head.name = "head";
  head.position.y = NECK_Y;
  torso.add(head);
  // The face texture's background matches the skin tint, so the head
  // blends seamlessly with the plain-skin neck and hands.
  const skull = kit.mesh(geometry.head, faceMaterial(skinTint, mood), 0, 0.11, 0, head);
  skull.scale.y = 1.15;

  return {
    pose,
    torso,
    head,
    leftArm: buildArm(kit, geometry, outfit, torso, -1, "left"),
    rightArm: buildArm(kit, geometry, outfit, torso, 1, "right"),
    leftLeg: buildLeg(kit, geometry, outfit, pose, -1, "left"),
    rightLeg: buildLeg(kit, geometry, outfit, pose, 1, "right"),
    heightScale,
    phase: hash01(`${entity.id}:phase`) * Math.PI * 2,
  };
}

// ---------------------------------------------------------------------------
// Poses
// ---------------------------------------------------------------------------

type PoseName =
  | "idle" | "run" | "sit" | "read" | "drink"
  | "type" | "reach" | "wave" | "check" | "photo";

// Ordered: first match wins, so "typing while sipping" types rather than
// drinks.
const ACTION_POSES: [RegExp, PoseName][] = [
  [/photo|photograph|filming/, "photo"],
  [/wav(e|ing)/, "wave"],
  [/typing|laptop|working on/, "type"],
  [/read/, "read"],
  [/drink|sipping|\bsip\b/, "drink"],
  [/jog|runn?ing|sprint/, "run"],
  [/checking|glanc/, "check"],
  [/wip(e|ing)|steam|operat|clean|serv|pour/, "reach"],
  [/sitting|seated|kneel/, "sit"],
];

function poseFor(action: string | undefined): PoseName {
  const text = (action ?? "").toLowerCase();
  for (const [pattern, pose] of ACTION_POSES) {
    if (pattern.test(text)) return pose;
  }
  return "idle";
}

/** Bends hips and knees onto a seat. Anchored figures sit on whatever the
 *  compiler placed them on; unanchored ones get a procedural box seat. */
function foldSeated(
  kit: Kit,
  rig: PersonRig,
  parent: THREE.Group,
  anchored: boolean,
) {
  let seatTop = 0;
  if (!anchored) {
    // A simple café chair: legs + seat + back, facing the way they face.
    seatTop = 0.5;
    const wood = sharedMaterial({ color: 0x4a3a28, roughness: 0.8 });
    const legGeometry = kit.track(new THREE.CylinderGeometry(0.022, 0.028, 0.47, 8));
    for (const [x, z] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.18], [0.18, 0.18]]) {
      kit.mesh(legGeometry, wood, x, 0.235, z, parent);
    }
    kit.box(wood, 0, 0.49, 0, 0.46, 0.05, 0.46, false, parent); // seat
    for (const x of [-0.19, 0.19]) {
      kit.box(wood, x, 0.78, -0.21, 0.045, 0.62, 0.045, false, parent); // back posts
    }
    kit.box(wood, 0, 0.99, -0.21, 0.44, 0.16, 0.04, false, parent); // back rest
  }
  rig.pose.position.y = seatTop + 0.03 - HIP_Y * rig.heightScale;
  for (const [leg, splay] of [
    [rig.leftLeg, -0.06],
    [rig.rightLeg, 0.06],
  ] as const) {
    leg.root.rotation.x = -1.35; // thighs forward onto the seat
    leg.root.rotation.z = splay;
    leg.joint.rotation.x = 1.25; // shins back down toward the floor
  }
}

/** Relaxed arms: a person never stands with arms welded straight down. */
function relaxArms(rig: PersonRig) {
  rig.leftArm.root.rotation.z = -0.07;
  rig.rightArm.root.rotation.z = 0.07;
  rig.leftArm.joint.rotation.x = -0.15;
  rig.rightArm.joint.rotation.x = -0.15;
}

// Soft default life: breathing bob at the waist plus a slow weight shift.
function breathing(rig: PersonRig): Update {
  return (t) => {
    rig.torso.position.y = HIP_Y + Math.sin(t * 1.6 + rig.phase) * 0.012;
    rig.pose.rotation.z = Math.sin(t * 0.5 + rig.phase) * 0.018;
  };
}

function applyPose(
  kit: Kit,
  rig: PersonRig,
  pose: PoseName,
  seated: boolean,
): Update | undefined {
  const propMaterial = sharedMaterial({ color: 0xd9d2c0, roughness: 0.85 });
  const darkProp = sharedMaterial({ color: 0x33363d, roughness: 0.6 });

  switch (pose) {
    case "run": {
      if (seated) return breathing(rig); // can't jog folded onto a seat
      rig.torso.rotation.x = 0.32;
      rig.leftArm.joint.rotation.x = -1.45;
      rig.rightArm.joint.rotation.x = -1.45;
      return (t) => {
        const s = Math.sin(t * 8 + rig.phase);
        rig.leftLeg.root.rotation.x = -0.85 * s;
        rig.rightLeg.root.rotation.x = 0.85 * s;
        // Trailing leg folds at the knee on the recovery swing.
        rig.leftLeg.joint.rotation.x = 0.25 + Math.max(0, -s) * 1.15;
        rig.rightLeg.joint.rotation.x = 0.25 + Math.max(0, s) * 1.15;
        rig.leftArm.root.rotation.x = 0.75 * s;
        rig.rightArm.root.rotation.x = -0.75 * s;
        rig.pose.position.y = Math.abs(s) * 0.05;
      };
    }
    case "sit":
      rig.leftArm.root.rotation.x = -0.45;
      rig.rightArm.root.rotation.x = -0.45;
      rig.leftArm.joint.rotation.x = -0.55;
      rig.rightArm.joint.rotation.x = -0.55;
      return breathing(rig);
    case "read": {
      rig.leftArm.root.rotation.x = -0.85;
      rig.rightArm.root.rotation.x = -0.85;
      rig.leftArm.joint.rotation.x = -1.0;
      rig.rightArm.joint.rotation.x = -1.0;
      rig.head.rotation.x = 0.4;
      // The "book": two thin angled pages held where the hands meet.
      for (const side of [-1, 1]) {
        const page = kit.box(
          propMaterial, side * 0.09, 0.42, 0.3, 0.18, 0.24, 0.02, false, rig.torso,
        );
        page.rotation.y = -side * 0.4;
        page.rotation.x = -0.25;
      }
      const breathe = breathing(rig);
      return (t) => {
        breathe(t);
        rig.head.rotation.y = Math.sin(t * 0.5 + rig.phase) * 0.07; // page glance
      };
    }
    case "drink": {
      rig.rightArm.root.rotation.x = -0.5;
      rig.rightArm.joint.rotation.x = -2.0; // hand to the mouth
      rig.leftArm.joint.rotation.x = -0.15;
      const cupGeometry = kit.track(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 10));
      kit.mesh(cupGeometry, propMaterial, 0, -HAND_DROP, 0.07, rig.rightArm.joint);
      const breathe = breathing(rig);
      return (t) => {
        breathe(t);
        rig.head.rotation.x = -0.08 + Math.sin(t * 0.8 + rig.phase) * 0.05;
      };
    }
    case "type": {
      rig.leftArm.root.rotation.x = -0.5;
      rig.rightArm.root.rotation.x = -0.5;
      rig.head.rotation.x = 0.38;
      // Laptop resting on the lap (pose-local so it scales with the figure).
      const lapY = HIP_Y + 0.09;
      kit.box(darkProp, 0, lapY, 0.3, 0.34, 0.02, 0.24, false, rig.pose);
      const screen = kit.box(darkProp, 0, lapY + 0.13, 0.41, 0.34, 0.26, 0.015, false, rig.pose);
      screen.rotation.x = -0.28;
      return (t) => {
        const tap = Math.sin(t * 9 + rig.phase) * 0.05;
        rig.leftArm.joint.rotation.x = -1.05 + tap;
        rig.rightArm.joint.rotation.x = -1.05 - tap;
      };
    }
    case "reach": {
      if (!seated) rig.torso.rotation.x = 0.28;
      rig.rightArm.root.rotation.x = -1.35; // working arm extended
      rig.rightArm.joint.rotation.x = -0.25;
      rig.leftArm.root.rotation.x = -0.55;
      rig.leftArm.joint.rotation.x = -0.4;
      const breathe = breathing(rig);
      return (t) => {
        breathe(t);
        rig.rightArm.root.rotation.z = Math.sin(t * 3 + rig.phase) * 0.18;
      };
    }
    case "wave": {
      relaxArms(rig);
      rig.rightArm.root.rotation.z = 2.65; // whole arm overhead
      rig.rightArm.root.rotation.x = -0.2;
      return (t) => {
        rig.rightArm.joint.rotation.z = -0.2 + Math.sin(t * 6 + rig.phase) * 0.35;
      };
    }
    case "check": {
      rig.rightArm.root.rotation.x = -1.05;
      rig.rightArm.joint.rotation.x = -1.25; // phone before the face
      rig.leftArm.joint.rotation.x = -0.15;
      rig.head.rotation.x = 0.42;
      const phone = kit.box(darkProp, 0, -HAND_DROP, 0.05, 0.08, 0.14, 0.015, false, rig.rightArm.joint);
      phone.rotation.x = -0.5;
      return breathing(rig);
    }
    case "photo": {
      rig.leftArm.root.rotation.x = -1.2;
      rig.rightArm.root.rotation.x = -1.2;
      rig.leftArm.joint.rotation.x = -1.15;
      rig.rightArm.joint.rotation.x = -1.15;
      // Camera held up at the face.
      kit.box(darkProp, 0, 0.62, 0.27, 0.16, 0.1, 0.05, false, rig.torso);
      return (t) => {
        rig.torso.rotation.y = Math.sin(t * 0.4 + rig.phase) * 0.08; // framing pan
      };
    }
    case "idle":
      relaxArms(rig);
      return breathing(rig);
  }
}

export interface BuiltPerson {
  rig: PersonRig;
  update?: Update;
}

export function buildPerson(
  kit: Kit,
  parent: THREE.Group,
  entity: PlacedEntity,
  tintOverride?: number,
): BuiltPerson {
  const rig = buildRig(kit, parent, entity, tintOverride);
  const pose = poseFor(entity.action);
  // Anyone placed "on" a surface (bench, chair) sits regardless of what
  // their hands are doing; sit/type imply sitting even on open ground.
  const anchored = entity.transform.position[1] > 0.1;
  const seated = anchored || pose === "sit" || pose === "type";
  if (seated) foldSeated(kit, rig, parent, anchored);
  const update = applyPose(kit, rig, pose, seated);
  return { rig, ...(update && !REDUCED_MOTION && { update }) };
}
