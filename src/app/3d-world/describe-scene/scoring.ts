import type { SceneSpec } from "./types";

// Shared scoring manifest. Both the /api/score route (to build the prompt and
// the strict json_schema enum) and the client (to turn the model's matched
// booleans into a weighted 0-100) derive their item list from here, so the
// ids always line up. Pure logic — no Three.js, no server-only APIs.

export type ScorableKind = "setting" | "person" | "action" | "object" | "spatial";

export interface Scorable {
  /** Stable id, unique within a scene. The model keys its matches by this. */
  id: string;
  kind: ScorableKind;
  /** Contribution to the weighted score. */
  weight: number;
  /** What the learner must have expressed for this item to count as matched. */
  text: string;
}

// Actions and spatial relationships are worth more than plain noun mentions;
// the anomaly is the headline of a Task-8 scene and carries the most weight,
// split evenly across noticing it and explaining why it is unusual.
export const WEIGHTS = {
  setting: 1,
  person: 1,
  action: 1.5,
  object: 1,
  spatial: 1.5,
  anomaly: 3,
} as const;

/** Suffix that turns a person id into their separately-scored action id. */
export const ACTION_SUFFIX = "__action";

function entityLabel(scene: SceneSpec, id: string): string {
  const person = scene.people.find((p) => p.id === id);
  if (person) return person.description;
  const object = scene.objects.find((o) => o.id === id);
  if (object) return object.name;
  return id;
}

/** The full list of weighted, individually-scored items for a scene, EXCEPT
 *  the anomaly, which is scored through its own noticed/explained channel. */
export function buildScorables(scene: SceneSpec): Scorable[] {
  const items: Scorable[] = [];
  const { setting } = scene;

  items.push({
    id: "setting_location",
    kind: "setting",
    weight: WEIGHTS.setting,
    text: `The setting is ${setting.location} (${setting.indoor ? "indoors" : "outdoors"}).`,
  });
  items.push({
    id: "setting_time",
    kind: "setting",
    weight: WEIGHTS.setting,
    text: `The time of day is ${setting.time_of_day}.`,
  });
  items.push({
    id: "setting_weather",
    kind: "setting",
    weight: WEIGHTS.setting,
    text: `The weather is ${setting.weather}.`,
  });

  for (const person of scene.people) {
    items.push({
      id: person.id,
      kind: "person",
      weight: WEIGHTS.person,
      text: `A person is present: ${person.description}, located ${person.position}.`,
    });
    items.push({
      id: `${person.id}${ACTION_SUFFIX}`,
      kind: "action",
      weight: WEIGHTS.action,
      text: `${person.description} is ${person.action}.`,
    });
  }

  for (const object of scene.objects) {
    items.push({
      id: object.id,
      kind: "object",
      weight: WEIGHTS.object,
      text: `An object is present: ${object.name} (${object.detail}), located ${object.position}.`,
    });
  }

  scene.spatial_relationships.forEach((rel, i) => {
    items.push({
      id: `rel_${i}`,
      kind: "spatial",
      weight: WEIGHTS.spatial,
      text: `Spatial relationship: the ${entityLabel(scene, rel.subject)} ${rel.relation} the ${entityLabel(scene, rel.target)}.`,
    });
  });

  return items;
}

export interface ScoreMatch {
  id: string;
  matched: boolean;
  evidence: string;
}

export interface AnomalyResult {
  noticed: boolean;
  explained: boolean;
  evidence: string;
}

export interface ScoreResult {
  matches: ScoreMatch[];
  anomaly: AnomalyResult | null;
  notes: string;
}

export interface WeightedScore {
  /** 0-100, rounded. */
  score: number;
  earned: number;
  possible: number;
}

/** Turns the model's matched booleans into a weighted 0-100. The anomaly (when
 *  the scene has one) adds its 3x weight, split into noticed + explained
 *  halves, so a Task-8 answer that misses the anomaly forfeits both. */
export function computeWeightedScore(
  scene: SceneSpec,
  result: ScoreResult,
): WeightedScore {
  const scorables = buildScorables(scene);
  const matchedById = new Map(result.matches.map((m) => [m.id, m.matched]));

  let earned = 0;
  let possible = 0;
  for (const item of scorables) {
    possible += item.weight;
    if (matchedById.get(item.id)) earned += item.weight;
  }

  if (scene.anomaly) {
    const half = WEIGHTS.anomaly / 2;
    possible += WEIGHTS.anomaly;
    if (result.anomaly?.noticed) earned += half;
    if (result.anomaly?.explained) earned += half;
  }

  const score = possible === 0 ? 0 : Math.round((earned / possible) * 100);
  return { score, earned, possible };
}
