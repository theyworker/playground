import type { SceneSpec } from "./types";

// Compiles a scene manifest into world-space transforms. Pure logic — no
// Three.js — and fully deterministic: jitter is seeded from entity ids, so
// the same manifest always compiles to identical transforms.
//
// NOTE: spatial_relationships in the manifest are SCORING data (what the
// learner should mention), not placement data. Placement comes solely from
// each entity's own semantic position string.

export type PlacedKind = "person" | "object" | "anomaly";

export interface PlacedTransform {
  position: [number, number, number];
  rotationY: number;
}

export interface PlacedEntity {
  id: string;
  kind: PlacedKind;
  descriptor: string;
  action?: string;
  transform: PlacedTransform;
}

// Stage coordinate grid. The camera sits on +z looking toward -z, so
// foreground is +z and rotationY 0 faces the camera. farBackground sits
// inside the fog band so distant scenery visibly recedes.
export const DEPTH = {
  foreground: 4,
  midground: 0,
  background: -5,
  farBackground: -9,
} as const;
export const LATERAL = { left: -3.2, center: 0, right: 3.2 } as const;

const ABSOLUTE_JITTER = 0.4;
const RELATIONAL_JITTER = 0.15;
const PERSON_YAW_JITTER = 0.4;
const DEPTH_OFFSET = 1.2;
const BESIDE_OFFSET = 1.5;
const ON_LATERAL_NUDGE = 0.8;
// "above" floats clear of the anchor's top (wall-mounted boards etc.).
const ABOVE_CLEARANCE = 0.7;

/** Approximate top-surface height an entity offers for "on" stacking.
 *  The mesh factory builds its primitives to match these. */
export function surfaceHeightFor(descriptor: string): number {
  const text = descriptor.toLowerCase();
  if (/blanket|mat\b|rug|towel/.test(text)) return 0.03;
  if (/counter|machine|case|fridge/.test(text)) return 0.95;
  if (/bench|chair|seat|stool/.test(text)) return 0.5;
  if (/table|desk/.test(text)) return 0.74;
  if (/shelter|tree|roof/.test(text)) return 2.2;
  return 0.8;
}

type RelationKind = "behind" | "in_front_of" | "beside" | "on" | "above" | "under";

// Priority order: multi-word phrases first so "in front of" never matches
// as a bare "on". "inside" shares "under"'s placement (at the anchor's
// footprint, on the ground).
const RELATIONS: { keyword: string; kind: RelationKind }[] = [
  { keyword: "in front of", kind: "in_front_of" },
  { keyword: "behind", kind: "behind" },
  { keyword: "next to", kind: "beside" },
  { keyword: "beside", kind: "beside" },
  { keyword: "near", kind: "beside" },
  { keyword: "above", kind: "above" },
  { keyword: "on", kind: "on" },
  { keyword: "under", kind: "under" },
  { keyword: "inside", kind: "under" },
];

// Words that never identify an anchor entity ("on the counter, left end").
const TARGET_STOP_WORDS = new Set([
  "the", "a", "an", "his", "her", "their", "its", "my", "our",
  "of", "and", "at", "in", "to", "end", "side", "edge",
  "left", "right", "centre", "center", "middle", "top", "bottom",
  "high", "low",
]);

interface CompileEntry {
  id: string;
  isPerson: boolean;
  descriptor: string;
  action?: string;
  position: string;
  /** Lowercased tokens an anchor reference can match against. */
  tokens: Set<string>;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

// Deterministic FNV-1a string hash mapped to [0, 1). Shared with the mesh
// factory for seeded tints.
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function jitter(id: string, channel: string, amount: number): number {
  return (hash01(`${id}:${channel}`) * 2 - 1) * amount;
}

/** Maps a semantic position string onto the stage grid. Unrecognized
 *  phrases land at midground center. */
export function parsePosition(position: string): {
  depth: number;
  lateral: number;
} {
  const text = position.toLowerCase();
  let depth: number = DEPTH.midground;
  if (text.includes("foreground")) depth = DEPTH.foreground;
  else if (/far background|in the distance|far away|horizon/.test(text)) {
    depth = DEPTH.farBackground;
  } else if (text.includes("background")) depth = DEPTH.background;
  let lateral: number = LATERAL.center;
  if (text.includes("left")) lateral = LATERAL.left;
  else if (text.includes("right")) lateral = LATERAL.right;
  // The frustum widens with distance: spread far-background slots so
  // distant scenery clears the regular background row instead of
  // stacking behind it.
  if (depth === DEPTH.farBackground) lateral *= 1.6;
  return { depth, lateral };
}

// "left"/"right" in the position string picks the side for beside/on
// placements; -1 left, +1 right, 0 when unspecified.
function explicitSide(position: string): number {
  const text = position.toLowerCase();
  if (text.includes("left")) return -1;
  if (text.includes("right")) return 1;
  return 0;
}

// Finds a relation keyword whose anchor phrase resolves to another entity
// in the scene ("behind the counter" -> o_counter). Returns null when no
// keyword matches or no anchor resolves, in which case the position is
// treated as absolute.
function parseRelation(
  entry: CompileEntry,
  entries: CompileEntry[],
): { kind: RelationKind; targetId: string } | null {
  const text = entry.position.toLowerCase();
  for (const relation of RELATIONS) {
    const match = new RegExp(`\\b${relation.keyword}\\b`).exec(text);
    if (!match) continue;
    const targetWords = tokenize(
      text.slice(match.index + match[0].length),
    ).filter((word) => word.length >= 3 && !TARGET_STOP_WORDS.has(word));
    if (targetWords.length === 0) continue;

    let best: CompileEntry | null = null;
    let bestScore = 0;
    for (const candidate of entries) {
      if (candidate.id === entry.id) continue;
      let score = 0;
      for (const word of targetWords) {
        if (candidate.tokens.has(word)) score++;
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    if (best) return { kind: relation.kind, targetId: best.id };
  }
  return null;
}

function rotationFor(entry: CompileEntry): number {
  // People face the camera (+z) with a small seeded yaw so a crowd does
  // not stand at attention; objects stay axis-aligned.
  return entry.isPerson
    ? jitter(entry.id, "yaw", PERSON_YAW_JITTER / 2)
    : 0;
}

function absoluteTransform(entry: CompileEntry): PlacedTransform {
  const { depth, lateral } = parsePosition(entry.position);
  return {
    position: [
      lateral + jitter(entry.id, "x", ABSOLUTE_JITTER),
      0,
      depth + jitter(entry.id, "z", ABSOLUTE_JITTER),
    ],
    rotationY: rotationFor(entry),
  };
}

function relationalTransform(
  entry: CompileEntry,
  kind: RelationKind,
  anchor: PlacedTransform,
  anchorDescriptor: string,
): PlacedTransform {
  const [ax, ay, az] = anchor.position;
  const jx = jitter(entry.id, "x", RELATIONAL_JITTER);
  const jz = jitter(entry.id, "z", RELATIONAL_JITTER);
  const surface = ay + surfaceHeightFor(anchorDescriptor);
  let position: [number, number, number];
  switch (kind) {
    case "behind":
      position = [ax + jx, 0, az - DEPTH_OFFSET + jz];
      break;
    case "in_front_of":
      position = [ax + jx, 0, az + DEPTH_OFFSET + jz];
      break;
    case "beside": {
      const side =
        explicitSide(entry.position) ||
        (hash01(`${entry.id}:side`) < 0.5 ? -1 : 1);
      position = [ax + side * BESIDE_OFFSET + jx, ay, az + jz];
      break;
    }
    case "on":
      position = [
        ax + explicitSide(entry.position) * ON_LATERAL_NUDGE + jx,
        surface,
        az + jz,
      ];
      break;
    case "above":
      position = [
        ax + explicitSide(entry.position) * ON_LATERAL_NUDGE + jx,
        surface + ABOVE_CLEARANCE,
        az + jz,
      ];
      break;
    case "under":
      position = [ax + jx, 0, az + jz];
      break;
  }
  return { position, rotationY: rotationFor(entry) };
}

export function compileScene(scene: SceneSpec): PlacedEntity[] {
  const entries: CompileEntry[] = [
    ...scene.people.map((person) => ({
      id: person.id,
      isPerson: true,
      descriptor: person.description,
      action: person.action,
      position: person.position,
      tokens: new Set(tokenize(`${person.id} ${person.description}`)),
    })),
    ...scene.objects.map((object) => ({
      id: object.id,
      isPerson: false,
      // Detail rides along so the mesh factory can key off colors,
      // numbers, and shape words ("round", "route number 42").
      descriptor: `${object.name} — ${object.detail}`,
      action: undefined,
      position: object.position,
      tokens: new Set(tokenize(`${object.id} ${object.name} ${object.detail}`)),
    })),
  ];

  // Pass 1: absolute positions. Entities whose position resolves to a
  // relation against another entity wait for pass 2.
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const transforms = new Map<string, PlacedTransform>();
  const pending: { entry: CompileEntry; kind: RelationKind; targetId: string }[] = [];
  for (const entry of entries) {
    const relation = parseRelation(entry, entries);
    if (relation) {
      pending.push({ entry, ...relation });
    } else {
      transforms.set(entry.id, absoluteTransform(entry));
    }
  }

  // Pass 2: relational positions as offsets from the anchor's transform.
  // Loops so chains resolve (briefcase ON the bench INSIDE the shelter).
  let progress = true;
  while (pending.length > 0 && progress) {
    progress = false;
    for (let i = pending.length - 1; i >= 0; i--) {
      const { entry, kind, targetId } = pending[i];
      const anchor = transforms.get(targetId);
      if (!anchor) continue;
      transforms.set(
        entry.id,
        relationalTransform(entry, kind, anchor, entryById.get(targetId)!.descriptor),
      );
      pending.splice(i, 1);
      progress = true;
    }
  }
  // Circular references can never resolve; fall back to absolute.
  for (const { entry } of pending) {
    transforms.set(entry.id, absoluteTransform(entry));
  }

  return entries.map((entry) => ({
    id: entry.id,
    kind: scene.anomaly?.id === entry.id
      ? "anomaly"
      : entry.isPerson
        ? "person"
        : "object",
    descriptor: entry.descriptor,
    ...(entry.action !== undefined && { action: entry.action }),
    transform: transforms.get(entry.id)!,
  }));
}
