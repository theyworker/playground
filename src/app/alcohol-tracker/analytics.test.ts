import { describe, expect, it } from "vitest";
import {
  byCategory,
  byDayOfWeek,
  bySetting,
  byType,
  computePatterns,
  totalStandardDrinks,
  weeklyTotals,
} from "./analytics";
import type { DrinkEntry } from "./types";

// 2026-06-01 is a Monday, 2026-06-06 and 2026-06-13 are Saturdays (UTC).
const entries: DrinkEntry[] = [
  { id: "1", consumedAt: "2026-06-01T20:00:00.000Z", type: "beer", quantity: 2, setting: "Bar / Pub", category: "friends", createdAt: "2026-06-01T20:00:00.000Z" },
  { id: "2", consumedAt: "2026-06-01T22:00:00.000Z", type: "spirits", quantity: 1, setting: "Bar / Pub", category: "friends", createdAt: "2026-06-01T22:00:00.000Z" },
  { id: "3", consumedAt: "2026-06-06T19:00:00.000Z", type: "wine", quantity: 2, setting: "Home", category: "family", createdAt: "2026-06-06T19:00:00.000Z" },
  { id: "4", consumedAt: "2026-06-13T18:00:00.000Z", type: "wine", quantity: 1, setting: "Restaurant", category: "work", createdAt: "2026-06-13T18:00:00.000Z" },
];

describe("totalStandardDrinks", () => {
  it("sums estimated standard drinks across entries", () => {
    expect(totalStandardDrinks(entries)).toBe(8.3);
  });
  it("is 0 for no entries", () => {
    expect(totalStandardDrinks([])).toBe(0);
  });
});

describe("grouping", () => {
  it("groups by category sorted by standard drinks desc", () => {
    expect(byCategory(entries)).toEqual([
      { key: "friends", count: 2, standardDrinks: 3.8 },
      { key: "family", count: 1, standardDrinks: 3 },
      { key: "work", count: 1, standardDrinks: 1.5 },
    ]);
  });
  it("groups by type sorted by standard drinks desc", () => {
    expect(byType(entries)).toEqual([
      { key: "wine", count: 2, standardDrinks: 4.5 },
      { key: "beer", count: 1, standardDrinks: 2.8 },
      { key: "spirits", count: 1, standardDrinks: 1 },
    ]);
  });
  it("groups by setting", () => {
    expect(bySetting(entries)[0]).toEqual({ key: "Bar / Pub", count: 2, standardDrinks: 3.8 });
  });
  it("groups by day of week", () => {
    expect(byDayOfWeek(entries)).toEqual([
      { key: "Sat", count: 2, standardDrinks: 4.5 },
      { key: "Mon", count: 2, standardDrinks: 3.8 },
    ]);
  });
});

describe("weeklyTotals", () => {
  it("buckets by Monday week start, chronological", () => {
    expect(weeklyTotals(entries)).toEqual([
      { weekStart: "2026-06-01", standardDrinks: 6.8 },
      { weekStart: "2026-06-08", standardDrinks: 1.5 },
    ]);
  });
});

describe("computePatterns", () => {
  it("summarises totals and tops", () => {
    const p = computePatterns(entries);
    expect(p.totalEntries).toBe(4);
    expect(p.totalStandardDrinks).toBe(8.3);
    expect(p.drinkingDays).toBe(3);
    expect(p.spanDays).toBe(13);
    expect(p.avgPerDrinkingDay).toBe(2.77);
    expect(p.avgPerWeek).toBe(4.47);
    expect(p.topCategory?.key).toBe("friends");
    expect(p.topType?.key).toBe("wine");
    expect(p.topSetting?.key).toBe("Bar / Pub");
    expect(p.busiestDayOfWeek?.key).toBe("Sat");
  });
  it("is safe for an empty list", () => {
    const p = computePatterns([]);
    expect(p.totalEntries).toBe(0);
    expect(p.totalStandardDrinks).toBe(0);
    expect(p.avgPerWeek).toBe(0);
    expect(p.topCategory).toBeNull();
  });
});
