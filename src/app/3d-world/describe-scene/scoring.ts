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

// --- Feedback: grouped breakdown, band estimate, and coaching copy ----------

export type BreakdownKey = "people" | "actions" | "objects" | "spatial" | "setting";

export interface BreakdownItem {
  id: string;
  /** Manifest phrasing the learner could have used. */
  text: string;
  matched: boolean;
  /** The judge's short justification, if any. */
  evidence?: string;
}

export interface BreakdownGroup {
  key: BreakdownKey;
  label: string;
  items: BreakdownItem[];
}

const GROUP_ORDER: { key: BreakdownKey; label: string; kinds: ScorableKind[] }[] = [
  { key: "people", label: "People", kinds: ["person"] },
  { key: "actions", label: "Actions", kinds: ["action"] },
  { key: "objects", label: "Objects", kinds: ["object"] },
  { key: "spatial", label: "Spatial relationships", kinds: ["spatial"] },
  { key: "setting", label: "Setting", kinds: ["setting"] },
];

/** Joins the scorable manifest with the judge's verdicts, grouped by category
 *  for the feedback panel. The anomaly is reported separately (it has its own
 *  noticed/explained channel). */
export function buildBreakdown(
  scene: SceneSpec,
  result: ScoreResult,
): BreakdownGroup[] {
  const scorables = buildScorables(scene);
  const byId = new Map(result.matches.map((m) => [m.id, m]));
  return GROUP_ORDER.map((group) => ({
    key: group.key,
    label: group.label,
    items: scorables
      .filter((s) => group.kinds.includes(s.kind))
      .map((s) => {
        const match = byId.get(s.id);
        return {
          id: s.id,
          text: s.text,
          matched: match?.matched ?? false,
          evidence: match?.evidence,
        };
      }),
  })).filter((group) => group.items.length > 0);
}

export interface CelpipBand {
  /** e.g. "9-10". An estimate, not an official score. */
  band: string;
  descriptor: string;
}

/** Rough CELPIP-style band from the 0-100 weighted score. Clearly an estimate. */
export function celpipBand(score: number): CelpipBand {
  if (score >= 90) return { band: "10-12", descriptor: "Advanced" };
  if (score >= 78) return { band: "8-9", descriptor: "Strong" };
  if (score >= 66) return { band: "7", descriptor: "Good" };
  if (score >= 54) return { band: "5-6", descriptor: "Adequate" };
  if (score >= 42) return { band: "4", descriptor: "Developing" };
  return { band: "3 or below", descriptor: "Needs work" };
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];

function word(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function categoryNoun(key: BreakdownKey, count: number): string {
  const plural = count !== 1;
  switch (key) {
    case "people":
      return plural ? "people" : "person";
    case "actions":
      return plural ? "actions" : "action";
    case "objects":
      return plural ? "objects" : "object";
    case "spatial":
      return plural ? "spatial details" : "spatial detail";
    case "setting":
      return plural ? "setting details" : "setting detail";
  }
}

/** One specific, active line of coaching pointed at the biggest weakness. */
export function coachingLine(
  scene: SceneSpec,
  breakdown: BreakdownGroup[],
  result: ScoreResult,
): string {
  const taskLabel = scene.task === 8 ? "Task 8" : "Task 3";

  if (scene.anomaly) {
    if (!result.anomaly?.noticed) {
      return "You didn't flag the unusual element — on Task 8 that's the whole task.";
    }
    if (!result.anomaly?.explained) {
      return "You spotted the odd thing but didn't say why it's out of place — Task 8 wants the explanation.";
    }
  }

  let worst: BreakdownGroup | null = null;
  let worstMissed = 0;
  for (const group of breakdown) {
    const missed = group.items.filter((item) => !item.matched).length;
    if (missed > worstMissed) {
      worst = group;
      worstMissed = missed;
    }
  }

  if (!worst || worstMissed === 0) {
    return "Thorough, well-organised description — you covered the scene fully.";
  }
  return `You missed ${word(worstMissed)} ${categoryNoun(worst.key, worstMissed)} — that's where ${taskLabel} loses marks.`;
}
