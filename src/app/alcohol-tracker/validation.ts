// Framework-free validation for the create-entry payload. Returns a tagged
// result so the API route can map failures to a 400 with a clear message.
import {
  ALCOHOL_TYPES,
  CATEGORIES,
  type AlcoholType,
  type DrinkCategory,
  type NewDrinkInput,
} from "./types";

export type ValidationResult =
  | { ok: true; value: NewDrinkInput }
  | { ok: false; error: string };

const TYPE_VALUES = new Set(ALCOHOL_TYPES.map((t) => t.value));
const CATEGORY_VALUES = new Set(CATEGORIES.map((c) => c.value));
const MAX_QUANTITY = 50;

export function validateDrinkInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Expected a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b.type !== "string" || !TYPE_VALUES.has(b.type as AlcoholType)) {
    return { ok: false, error: "Unknown or missing alcohol type." };
  }
  if (
    typeof b.category !== "string" ||
    !CATEGORY_VALUES.has(b.category as DrinkCategory)
  ) {
    return { ok: false, error: "Unknown or missing category." };
  }
  if (
    typeof b.quantity !== "number" ||
    !Number.isFinite(b.quantity) ||
    b.quantity <= 0 ||
    b.quantity > MAX_QUANTITY
  ) {
    return { ok: false, error: `Quantity must be between 1 and ${MAX_QUANTITY}.` };
  }
  if (typeof b.setting !== "string" || b.setting.trim() === "") {
    return { ok: false, error: "Setting is required." };
  }

  let consumedAt: string;
  if (b.consumedAt === undefined || b.consumedAt === null) {
    consumedAt = new Date().toISOString();
  } else if (
    typeof b.consumedAt === "string" &&
    !Number.isNaN(Date.parse(b.consumedAt))
  ) {
    consumedAt = new Date(b.consumedAt).toISOString();
  } else {
    return { ok: false, error: "consumedAt must be a valid date." };
  }

  const note =
    typeof b.note === "string" && b.note.trim() !== "" ? b.note.trim() : undefined;

  return {
    ok: true,
    value: {
      consumedAt,
      type: b.type as AlcoholType,
      quantity: b.quantity,
      setting: b.setting.trim(),
      category: b.category as DrinkCategory,
      note,
    },
  };
}
