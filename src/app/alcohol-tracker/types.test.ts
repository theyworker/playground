import { describe, expect, it } from "vitest";
import {
  ALCOHOL_TYPES,
  CATEGORIES,
  STANDARD_DRINK_FACTORS,
  standardDrinksFor,
  type AlcoholType,
} from "./types";

describe("standardDrinksFor", () => {
  it("multiplies the per-type factor by the quantity", () => {
    expect(standardDrinksFor("beer", 2)).toBe(2.8);
    expect(standardDrinksFor("spirits", 3)).toBe(3);
    expect(standardDrinksFor("wine", 1)).toBe(1.5);
    expect(standardDrinksFor("cocktail", 2)).toBe(3.4);
  });

  it("returns 0 for a zero quantity", () => {
    expect(standardDrinksFor("beer", 0)).toBe(0);
  });
});

describe("constants", () => {
  it("defines a standard-drink factor for every alcohol type", () => {
    for (const { value } of ALCOHOL_TYPES) {
      expect(STANDARD_DRINK_FACTORS[value as AlcoholType]).toBeGreaterThan(0);
    }
  });

  it("includes the four required categories plus an other catch-all", () => {
    const values = CATEGORIES.map((c) => c.value);
    expect(values).toEqual([
      "work",
      "friends",
      "school_friends",
      "family",
      "other",
    ]);
  });
});
