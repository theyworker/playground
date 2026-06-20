import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeStreak,
  countGoalsHit,
  DEFAULT_GOAL,
  DEFAULT_STATE,
  getOrCreateDay,
  levelFor,
  sanitizeGameState,
  type DayLog,
  type GameState,
} from "./state";

function day(date: string, intake: number, goal: number): DayLog {
  return { date, intake, goal, location: null, events: [] };
}

describe("sanitizeGameState", () => {
  it("passes a well-formed state through", () => {
    const state: GameState = {
      goal: 2500,
      logs: {
        "2026-06-01": {
          date: "2026-06-01",
          intake: 1500,
          goal: 2500,
          location: "work",
          events: [{ amount: 500, at: "2026-06-01T09:00:00.000Z" }],
        },
      },
    };
    expect(sanitizeGameState(state)).toEqual(state);
  });

  it("falls back to default state for a non-object", () => {
    expect(sanitizeGameState(null)).toEqual(DEFAULT_STATE);
    expect(sanitizeGameState("nope")).toEqual(DEFAULT_STATE);
  });

  it("replaces an invalid goal with the default", () => {
    expect(sanitizeGameState({ goal: 0, logs: {} }).goal).toBe(DEFAULT_GOAL);
    expect(sanitizeGameState({ goal: -5, logs: {} }).goal).toBe(DEFAULT_GOAL);
    expect(sanitizeGameState({ goal: "lots", logs: {} }).goal).toBe(DEFAULT_GOAL);
  });

  it("drops log entries with malformed date keys or non-object days", () => {
    const result = sanitizeGameState({
      goal: 3000,
      logs: {
        "not-a-date": { date: "x", intake: 1, goal: 1, location: null, events: [] },
        "2026-06-02": "broken",
        "2026-06-03": day("2026-06-03", 1000, 3000),
      },
    });
    expect(Object.keys(result.logs)).toEqual(["2026-06-03"]);
  });

  it("drops malformed events and derives intake from events when intake is invalid", () => {
    const result = sanitizeGameState({
      goal: 3000,
      logs: {
        "2026-06-04": {
          date: "2026-06-04",
          intake: "bad",
          goal: 3000,
          location: "couch",
          events: [
            { amount: 200, at: "2026-06-04T08:00:00.000Z" },
            { amount: -50, at: "2026-06-04T09:00:00.000Z" },
            { amount: 300, at: 12345 },
            { amount: 100, at: "2026-06-04T10:00:00.000Z" },
          ],
        },
      },
    });
    const d = result.logs["2026-06-04"];
    expect(d.events).toHaveLength(2);
    expect(d.intake).toBe(300); // 200 + 100, the two valid events
    expect(d.location).toBeNull(); // "couch" is not a valid location
  });
});

describe("levelFor", () => {
  it("maps goals-hit counts to tiers", () => {
    expect(levelFor(0)).toEqual({ level: 1, title: "Thirsty Sprout", emoji: "🌱" });
    expect(levelFor(3).title).toBe("Dewdrop");
    expect(levelFor(7).title).toBe("Splash Star");
    expect(levelFor(14).title).toBe("Wave Rider");
    expect(levelFor(30).title).toBe("Hydro Hero");
    expect(levelFor(60)).toEqual({ level: 6, title: "Aqua Legend", emoji: "👑" });
  });
});

describe("countGoalsHit", () => {
  it("counts days where intake met a positive goal", () => {
    const logs = {
      a: day("2026-06-01", 3000, 3000),
      b: day("2026-06-02", 1000, 3000),
      c: day("2026-06-03", 50, 0),
    };
    expect(countGoalsHit(logs)).toBe(1);
  });
});

describe("getOrCreateDay", () => {
  it("returns the existing day when present", () => {
    const existing = day("2026-06-01", 500, 3000);
    const state: GameState = { goal: 3000, logs: { "2026-06-01": existing } };
    expect(getOrCreateDay(state, "2026-06-01")).toBe(existing);
  });
  it("creates a fresh day using the state goal when missing", () => {
    const state: GameState = { goal: 2000, logs: {} };
    expect(getOrCreateDay(state, "2026-06-05")).toEqual({
      date: "2026-06-05",
      intake: 0,
      goal: 2000,
      location: null,
      events: [],
    });
  });
});

describe("computeStreak", () => {
  afterEach(() => vi.useRealTimers());
  it("counts consecutive met days back from today, tolerating an unmet today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00"));
    const k = (d: string) => d;
    const logs = {
      [k("2026-06-10")]: day("2026-06-10", 0, 3000), // today, not yet met
      [k("2026-06-09")]: day("2026-06-09", 3000, 3000),
      [k("2026-06-08")]: day("2026-06-08", 3100, 3000),
      [k("2026-06-07")]: day("2026-06-07", 100, 3000), // breaks here
    };
    expect(computeStreak(logs)).toBe(2);
  });
});
