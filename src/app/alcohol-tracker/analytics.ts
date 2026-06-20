// Pure aggregation + pattern detection over DrinkEntry[]. Framework-free and
// fully unit tested. All week/day math is UTC so results are deterministic.
// NOTE: all day/week bucketing here is UTC-based (deterministic). The UI renders
// individual entry timestamps in local time, so a late-night drink near a UTC
// day boundary may bucket into the adjacent UTC day vs. its local calendar day.

import { standardDrinksFor, type DrinkEntry } from "./types";

export interface GroupStat {
  key: string;
  count: number;
  standardDrinks: number;
}

export interface WeekTotal {
  weekStart: string; // Monday of the week, YYYY-MM-DD
  standardDrinks: number;
}

export interface Patterns {
  totalEntries: number;
  totalStandardDrinks: number;
  drinkingDays: number;
  avgPerDrinkingDay: number;
  avgPerWeek: number;
  spanDays: number;
  topCategory: GroupStat | null;
  topType: GroupStat | null;
  topSetting: GroupStat | null;
  busiestDayOfWeek: GroupStat | null;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MS_PER_DAY = 86_400_000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function entryStandardDrinks(entry: DrinkEntry): number {
  return standardDrinksFor(entry.type, entry.quantity);
}

export function totalStandardDrinks(entries: DrinkEntry[]): number {
  return round2(entries.reduce((sum, e) => sum + entryStandardDrinks(e), 0));
}

// Index of the weekday with Monday = 0.
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

function group(entries: DrinkEntry[], keyOf: (e: DrinkEntry) => string): GroupStat[] {
  const map = new Map<string, GroupStat>();
  for (const e of entries) {
    const key = keyOf(e);
    const stat = map.get(key) ?? { key, count: 0, standardDrinks: 0 };
    stat.count += 1;
    stat.standardDrinks += entryStandardDrinks(e);
    map.set(key, stat);
  }
  return [...map.values()]
    .map((s) => ({ ...s, standardDrinks: round2(s.standardDrinks) }))
    .sort((a, b) => b.standardDrinks - a.standardDrinks);
}

export function byCategory(entries: DrinkEntry[]): GroupStat[] {
  return group(entries, (e) => e.category);
}

export function byType(entries: DrinkEntry[]): GroupStat[] {
  return group(entries, (e) => e.type);
}

export function bySetting(entries: DrinkEntry[]): GroupStat[] {
  return group(entries, (e) => e.setting);
}

export function byDayOfWeek(entries: DrinkEntry[]): GroupStat[] {
  return group(entries, (e) => DAY_NAMES[mondayIndex(new Date(e.consumedAt))]);
}

function weekStartOf(iso: string): string {
  const d = new Date(iso);
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - mondayIndex(d)),
  );
  return monday.toISOString().slice(0, 10);
}

export function weeklyTotals(entries: DrinkEntry[]): WeekTotal[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const key = weekStartOf(e.consumedAt);
    map.set(key, (map.get(key) ?? 0) + entryStandardDrinks(e));
  }
  return [...map.entries()]
    .map(([weekStart, total]) => ({ weekStart, standardDrinks: round2(total) }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function computePatterns(entries: DrinkEntry[]): Patterns {
  const total = totalStandardDrinks(entries);
  const days = new Set(entries.map((e) => e.consumedAt.slice(0, 10)));
  const drinkingDays = days.size;

  let spanDays = 0;
  if (entries.length > 0) {
    const dateStrings = entries.map((e) => e.consumedAt.slice(0, 10));
    const minMs = Date.parse(dateStrings.reduce((a, b) => (a < b ? a : b)));
    const maxMs = Date.parse(dateStrings.reduce((a, b) => (a > b ? a : b)));
    spanDays = Math.floor((maxMs - minMs) / MS_PER_DAY) + 1;
  }

  const avgPerDrinkingDay = drinkingDays > 0 ? round2(total / drinkingDays) : 0;
  const avgPerWeek = spanDays > 0 ? round2(total / (spanDays / 7)) : 0;

  return {
    totalEntries: entries.length,
    totalStandardDrinks: total,
    drinkingDays,
    avgPerDrinkingDay,
    avgPerWeek,
    spanDays,
    topCategory: byCategory(entries)[0] ?? null,
    topType: byType(entries)[0] ?? null,
    topSetting: bySetting(entries)[0] ?? null,
    busiestDayOfWeek: byDayOfWeek(entries)[0] ?? null,
  };
}
