import scenesData from "./scenes.json";

// Schema for a "Describe the Scene" drill. Task 3 is "Describing a Scene",
// Task 8 is "Describing an Unusual Situation" — Task 8 scenes carry an
// anomaly, Task 3 scenes must not.
export type TaskNumber = 3 | 8;
export type Difficulty = "easy" | "medium" | "hard";

export interface SceneSetting {
  location: string;
  time_of_day: string;
  weather: string;
  indoor: boolean;
}

export interface ScenePerson {
  id: string;
  description: string;
  action: string;
  /** Semantic position, e.g. "foreground left", "behind the counter". */
  position: string;
}

export interface SceneObject {
  id: string;
  name: string;
  position: string;
  detail: string;
}

export interface SpatialRelationship {
  /** Entity id of a person or object in the same scene. */
  subject: string;
  relation: string;
  /** Entity id of a person or object in the same scene. */
  target: string;
}

export interface SceneAnomaly {
  /** Entity id of the person or object that is out of place. */
  id: string;
  description: string;
  why_unusual: string;
  position: string;
}

export interface SceneElements {
  counts: Record<string, number>;
}

export interface SceneSpec {
  id: string;
  task: TaskNumber;
  title: string;
  difficulty: Difficulty;
  setting: SceneSetting;
  people: ScenePerson[];
  objects: SceneObject[];
  spatial_relationships: SpatialRelationship[];
  anomaly: SceneAnomaly | null;
  elements: SceneElements;
  model_answer: string;
}

function fail(sceneId: string, message: string): never {
  throw new Error(`[describe-scene] scene "${sceneId}": ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(sceneId: string, value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(sceneId, `${label} must be a non-empty string`);
  }
  return value;
}

function parseSetting(sceneId: string, value: unknown): SceneSetting {
  if (!isRecord(value)) fail(sceneId, "setting must be an object");
  if (typeof value.indoor !== "boolean") {
    fail(sceneId, "setting.indoor must be a boolean");
  }
  return {
    location: asString(sceneId, value.location, "setting.location"),
    time_of_day: asString(sceneId, value.time_of_day, "setting.time_of_day"),
    weather: asString(sceneId, value.weather, "setting.weather"),
    indoor: value.indoor,
  };
}

function parsePeople(sceneId: string, value: unknown): ScenePerson[] {
  if (!Array.isArray(value)) fail(sceneId, "people must be an array");
  return value.map((entry, i) => {
    if (!isRecord(entry)) fail(sceneId, `people[${i}] must be an object`);
    return {
      id: asString(sceneId, entry.id, `people[${i}].id`),
      description: asString(sceneId, entry.description, `people[${i}].description`),
      action: asString(sceneId, entry.action, `people[${i}].action`),
      position: asString(sceneId, entry.position, `people[${i}].position`),
    };
  });
}

function parseObjects(sceneId: string, value: unknown): SceneObject[] {
  if (!Array.isArray(value)) fail(sceneId, "objects must be an array");
  return value.map((entry, i) => {
    if (!isRecord(entry)) fail(sceneId, `objects[${i}] must be an object`);
    return {
      id: asString(sceneId, entry.id, `objects[${i}].id`),
      name: asString(sceneId, entry.name, `objects[${i}].name`),
      position: asString(sceneId, entry.position, `objects[${i}].position`),
      detail: asString(sceneId, entry.detail, `objects[${i}].detail`),
    };
  });
}

function parseRelationships(
  sceneId: string,
  value: unknown,
): SpatialRelationship[] {
  if (!Array.isArray(value)) {
    fail(sceneId, "spatial_relationships must be an array");
  }
  return value.map((entry, i) => {
    if (!isRecord(entry)) {
      fail(sceneId, `spatial_relationships[${i}] must be an object`);
    }
    return {
      subject: asString(sceneId, entry.subject, `spatial_relationships[${i}].subject`),
      relation: asString(sceneId, entry.relation, `spatial_relationships[${i}].relation`),
      target: asString(sceneId, entry.target, `spatial_relationships[${i}].target`),
    };
  });
}

function parseAnomaly(sceneId: string, value: unknown): SceneAnomaly | null {
  if (value === null) return null;
  if (!isRecord(value)) fail(sceneId, "anomaly must be an object or null");
  return {
    id: asString(sceneId, value.id, "anomaly.id"),
    description: asString(sceneId, value.description, "anomaly.description"),
    why_unusual: asString(sceneId, value.why_unusual, "anomaly.why_unusual"),
    position: asString(sceneId, value.position, "anomaly.position"),
  };
}

function parseElements(sceneId: string, value: unknown): SceneElements {
  if (!isRecord(value) || !isRecord(value.counts)) {
    fail(sceneId, "elements.counts must be an object");
  }
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(value.counts)) {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      fail(sceneId, `elements.counts.${key} must be a non-negative integer`);
    }
    counts[key] = count;
  }
  return { counts };
}

function parseScene(value: unknown, index: number): SceneSpec {
  if (!isRecord(value)) {
    throw new Error(`[describe-scene] scenes[${index}] must be an object`);
  }
  const id = asString(`scenes[${index}]`, value.id, "id");

  if (value.task !== 3 && value.task !== 8) {
    fail(id, "task must be 3 or 8");
  }
  const difficulty = asString(id, value.difficulty, "difficulty");
  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") {
    fail(id, `difficulty "${difficulty}" must be easy, medium, or hard`);
  }

  const scene: SceneSpec = {
    id,
    task: value.task,
    title: asString(id, value.title, "title"),
    difficulty,
    setting: parseSetting(id, value.setting),
    people: parsePeople(id, value.people),
    objects: parseObjects(id, value.objects),
    spatial_relationships: parseRelationships(id, value.spatial_relationships),
    anomaly: parseAnomaly(id, "anomaly" in value ? value.anomaly : undefined),
    elements: parseElements(id, value.elements),
    model_answer: asString(id, value.model_answer, "model_answer"),
  };

  // Referential integrity: every entity id is unique, and every reference
  // (relationship subject/target, anomaly id) resolves to a real entity.
  const entityIds = new Set<string>();
  for (const entity of [...scene.people, ...scene.objects]) {
    if (entityIds.has(entity.id)) fail(id, `duplicate entity id "${entity.id}"`);
    entityIds.add(entity.id);
  }
  for (const rel of scene.spatial_relationships) {
    if (!entityIds.has(rel.subject)) {
      fail(id, `spatial_relationship subject "${rel.subject}" does not resolve to an entity`);
    }
    if (!entityIds.has(rel.target)) {
      fail(id, `spatial_relationship target "${rel.target}" does not resolve to an entity`);
    }
  }
  if (scene.anomaly && !entityIds.has(scene.anomaly.id)) {
    fail(id, `anomaly id "${scene.anomaly.id}" does not resolve to an entity`);
  }
  if (scene.task === 8 && !scene.anomaly) {
    fail(id, "Task-8 scenes must have an anomaly");
  }
  if (scene.task === 3 && scene.anomaly) {
    fail(id, "Task-3 scenes must not have an anomaly");
  }

  const { counts } = scene.elements;
  if (counts.people !== scene.people.length) {
    fail(id, `elements.counts.people is ${counts.people} but people has ${scene.people.length} entries`);
  }
  if (counts.objects !== scene.objects.length) {
    fail(id, `elements.counts.objects is ${counts.objects} but objects has ${scene.objects.length} entries`);
  }

  return scene;
}

export function loadScenes(): SceneSpec[] {
  const data: unknown = scenesData;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("[describe-scene] scenes.json must be a non-empty array");
  }
  const scenes = data.map(parseScene);
  const sceneIds = new Set<string>();
  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) {
      fail(scene.id, "duplicate scene id");
    }
    sceneIds.add(scene.id);
  }
  return scenes;
}
