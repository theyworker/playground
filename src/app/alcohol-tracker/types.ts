// Domain model for the alcohol tracker. Framework-free so it can be unit
// tested and shared between the API routes and the client page.

export type AlcoholType =
  | "beer"
  | "wine"
  | "spirits"
  | "cocktail"
  | "cider"
  | "other";

export type DrinkCategory =
  | "work"
  | "friends"
  | "school_friends"
  | "family"
  | "other";

// A single logged drinking occasion as returned by the API (id is the
// stringified Mongo _id).
export interface DrinkEntry {
  id: string;
  consumedAt: string; // ISO timestamp of when it was consumed
  type: AlcoholType;
  quantity: number; // number of servings of `type` (rough)
  setting: string; // where / the occasion
  category: DrinkCategory;
  note?: string;
  createdAt: string; // ISO timestamp the record was created
}

// The payload accepted when creating an entry (no id/createdAt yet).
export interface NewDrinkInput {
  consumedAt: string;
  type: AlcoholType;
  quantity: number;
  setting: string;
  category: DrinkCategory;
  note?: string;
}

// Estimated standard drinks (~10g pure alcohol) per ONE typical serving of
// each type. Deliberately rough: the user logs "how many" of a type and we
// approximate the alcohol load from that.
export const STANDARD_DRINK_FACTORS: Record<AlcoholType, number> = {
  beer: 1.4, // a pint / large can
  cider: 1.4,
  wine: 1.5, // a restaurant glass (~175ml @ 12%)
  spirits: 1.0, // a single shot (~30ml @ 40%)
  cocktail: 1.7, // typically ~1.5 shots
  other: 1.0,
};

export const ALCOHOL_TYPES: { value: AlcoholType; label: string; emoji: string }[] = [
  { value: "beer", label: "Beer", emoji: "🍺" },
  { value: "wine", label: "Wine", emoji: "🍷" },
  { value: "spirits", label: "Spirits", emoji: "🥃" },
  { value: "cocktail", label: "Cocktail", emoji: "🍸" },
  { value: "cider", label: "Cider", emoji: "🍏" },
  { value: "other", label: "Other", emoji: "🍹" },
];

export const CATEGORIES: { value: DrinkCategory; label: string; emoji: string }[] = [
  { value: "work", label: "Work", emoji: "💼" },
  { value: "friends", label: "Friends", emoji: "🧑‍🤝‍🧑" },
  { value: "school_friends", label: "School friends", emoji: "🎓" },
  { value: "family", label: "Family gatherings", emoji: "👪" },
  { value: "other", label: "Other", emoji: "✨" },
];

export const SETTINGS: string[] = [
  "Home",
  "Bar / Pub",
  "Restaurant",
  "Party",
  "Event",
  "Outdoors",
  "Other",
];

// Rounds to 2 decimal places to keep the rough estimate tidy.
export function standardDrinksFor(type: AlcoholType, quantity: number): number {
  const factor = STANDARD_DRINK_FACTORS[type] ?? STANDARD_DRINK_FACTORS.other;
  return Math.round(factor * quantity * 100) / 100;
}
