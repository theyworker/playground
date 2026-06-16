import * as THREE from "three";
import type { SceneSpec } from "./types";
import type { ScoreResult } from "./scoring";

// The payoff: after scoring, each entity mesh is recoloured by verdict. Matched
// elements light up green in a left-to-right sequence; missed elements
// desaturate to grey; the Task-8 anomaly gets a hero amber glow if it was
// noticed, or — if it was missed — is revealed LAST in pulsing red so the miss
// lands. Entity meshes are found by userData.id (the same ids the scorer keys
// its matches by), so this never depends on the model vendor.
//
// Shared materials are never mutated: every affected mesh gets a private clone,
// restored (and the clone disposed) when the highlight is cleared.

const GREEN = new THREE.Color(0x3ddc84);
const AMBER = new THREE.Color(0xffc24b);
const RED = new THREE.Color(0xff5252);
const GREY = new THREE.Color(0x6b7280);

const STAGGER = 0.16; // gap between consecutive matched elements lighting up
const RAMP = 0.5; // seconds for one element to reach full glow
const FADE = 0.45; // seconds for a missed element to desaturate
const MATCH_GLOW = 0.8;
const ANOMALY_GLOW = 1.5;

type EntityState = "matched" | "missed" | "anomaly-hit" | "anomaly-miss";

interface Slot {
  material: THREE.MeshStandardMaterial; // private clone we animate
  baseColor: THREE.Color; // the element's real colour, for the grey lerp
}

interface Entity {
  group: THREE.Object3D;
  slots: Slot[];
  state: EntityState;
  startAt: number; // seconds from the first frame of the animation
  baseScale: number;
}

export interface HighlightHandle {
  update(elapsed: number): void;
  dispose(): void;
}

function isStandard(m: THREE.Material): m is THREE.MeshStandardMaterial {
  return (m as THREE.MeshStandardMaterial).isMeshStandardMaterial === true;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOut = (p: number) => 1 - (1 - p) * (1 - p);

export function buildHighlight(
  root: THREE.Object3D,
  scene: SceneSpec,
  result: ScoreResult,
  reducedMotion: boolean,
): HighlightHandle {
  const matchedById = new Map(result.matches.map((m) => [m.id, m.matched]));
  const anomalyId = scene.anomaly?.id ?? null;
  const anomalyNoticed = result.anomaly?.noticed === true;

  const restore: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] = [];
  const entities: Entity[] = [];

  // Entity groups are direct children of the content group, each tagged with
  // its manifest id; loose label planes have no id and are left untouched.
  for (const child of root.children) {
    const id = child.userData.id as string | undefined;
    if (!id) continue;

    const slots: Slot[] = [];
    child.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const material = mesh.material;
      if (Array.isArray(material)) {
        restore.push({ mesh, material });
        mesh.material = material.map((m) => (isStandard(m) ? m.clone() : m));
        for (const clone of mesh.material) {
          if (isStandard(clone)) slots.push({ material: clone, baseColor: clone.color.clone() });
        }
      } else if (isStandard(material)) {
        const clone = material.clone();
        restore.push({ mesh, material });
        mesh.material = clone;
        slots.push({ material: clone, baseColor: clone.color.clone() });
      }
    });
    if (slots.length === 0) continue;

    const isAnomaly = id === anomalyId;
    const hit = matchedById.get(id) === true;
    const state: EntityState = isAnomaly
      ? anomalyNoticed
        ? "anomaly-hit"
        : "anomaly-miss"
      : hit
        ? "matched"
        : "missed";

    entities.push({
      group: child,
      slots,
      state,
      startAt: 0,
      baseScale: child.scale.x,
    });
  }

  // Sequence the matched elements left-to-right; the anomaly comes after.
  const matched = entities
    .filter((e) => e.state === "matched")
    .sort((a, b) => a.group.position.x - b.group.position.x);
  matched.forEach((e, i) => {
    e.startAt = reducedMotion ? 0 : i * STAGGER;
  });
  const afterMatched = matched.length
    ? matched[matched.length - 1].startAt + RAMP
    : 0;
  for (const entity of entities) {
    if (entity.state === "anomaly-hit") {
      entity.startAt = reducedMotion ? 0 : afterMatched + 0.25;
    } else if (entity.state === "anomaly-miss") {
      // Revealed last, after a beat, so the omission is unmistakable.
      entity.startAt = reducedMotion ? 0 : afterMatched + 0.9;
    }
  }

  const setGlow = (entity: Entity, color: THREE.Color, intensity: number) => {
    for (const slot of entity.slots) {
      slot.material.color.copy(slot.baseColor);
      slot.material.emissive.copy(color);
      slot.material.emissiveIntensity = intensity;
    }
  };

  const applyEntity = (entity: Entity, local: number) => {
    switch (entity.state) {
      case "missed": {
        const p = reducedMotion ? 1 : clamp01(local / FADE);
        for (const slot of entity.slots) {
          slot.material.color.copy(slot.baseColor).lerp(GREY, 0.8 * p);
          slot.material.emissive.setRGB(0, 0, 0);
          slot.material.emissiveIntensity = 0;
        }
        break;
      }
      case "matched": {
        if (!reducedMotion && local <= 0) {
          setGlow(entity, GREEN, 0);
          break;
        }
        const p = reducedMotion ? 1 : clamp01(local / RAMP);
        const breathe = reducedMotion ? 1 : 1 + 0.1 * Math.sin(local * 3);
        const pop = reducedMotion ? 0 : Math.max(0, Math.sin(p * Math.PI)) * 0.45;
        setGlow(entity, GREEN, MATCH_GLOW * easeOut(p) * breathe + pop);
        break;
      }
      case "anomaly-hit": {
        if (!reducedMotion && local <= 0) {
          setGlow(entity, AMBER, 0);
          entity.group.scale.setScalar(entity.baseScale);
          break;
        }
        const p = reducedMotion ? 1 : clamp01(local / RAMP);
        const breathe = reducedMotion ? 1 : 1 + 0.25 * Math.sin(local * 4);
        setGlow(entity, AMBER, ANOMALY_GLOW * easeOut(p) * breathe);
        entity.group.scale.setScalar(entity.baseScale * (1 + 0.07 * easeOut(p)));
        break;
      }
      case "anomaly-miss": {
        if (!reducedMotion && local <= 0) {
          // Stay neutral until its late, deliberate reveal.
          setGlow(entity, RED, 0);
          break;
        }
        const p = reducedMotion ? 1 : clamp01(local / RAMP);
        const flash = reducedMotion ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(local * 5));
        setGlow(entity, RED, ANOMALY_GLOW * easeOut(p) * flash);
        break;
      }
    }
  };

  let t0 = -1;
  return {
    update(elapsed: number) {
      if (t0 < 0) t0 = elapsed;
      const t = elapsed - t0;
      for (const entity of entities) applyEntity(entity, t - entity.startAt);
    },
    dispose() {
      // Only the anomaly hero ever has its scale animated; restore just that.
      for (const entity of entities) {
        if (entity.state === "anomaly-hit") entity.group.scale.setScalar(entity.baseScale);
      }
      for (const { mesh, material } of restore) {
        const current = mesh.material;
        if (Array.isArray(current)) current.forEach((m) => m.dispose());
        else current.dispose();
        mesh.material = material;
      }
    },
  };
}
