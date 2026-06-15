// Local-storage backed data layer for Dini's water game.
// Everything lives in the browser — no server, no accounts.

export type DayLocation = "home" | "work";

export interface DrinkEvent {
  /** millilitres added in this sip */
  amount: number;
  /** ISO timestamp of when it was logged */
  at: string;
}

export interface DayLog {
  /** YYYY-MM-DD */
  date: string;
  /** total millilitres drunk that day */
  intake: number;
  /** the goal that was active that day, in ml */
  goal: number;
  /** where Dini spent the day, if she said */
  location: DayLocation | null;
  events: DrinkEvent[];
}

export interface GameState {
  /** daily goal in millilitres */
  goal: number;
  logs: Record<string, DayLog>;
}

const STORAGE_KEY = "dini-water-game-v1";
export const DEFAULT_GOAL = 3000; // 3 L
export const BOTTLE_ML = 1000; // Dini's 1 L bottle

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadState(): GameState {
  if (typeof window === "undefined") {
    return { goal: DEFAULT_GOAL, logs: {} };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { goal: DEFAULT_GOAL, logs: {} };
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return {
      goal: typeof parsed.goal === "number" ? parsed.goal : DEFAULT_GOAL,
      logs: parsed.logs ?? {},
    };
  } catch {
    return { goal: DEFAULT_GOAL, logs: {} };
  }
}

function saveState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full / disabled — fail quietly, the UI still works in-memory
  }
}

// ── External store, so React can read localStorage via useSyncExternalStore ──
// This avoids reading/writing localStorage inside effects and the hydration
// mismatch that comes with it.

const SERVER_SNAPSHOT: GameState = { goal: DEFAULT_GOAL, logs: {} };
let snapshot: GameState | null = null;
const listeners = new Set<() => void>();

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot(): GameState {
  if (snapshot === null) snapshot = loadState();
  return snapshot;
}

export function getServerSnapshot(): GameState {
  return SERVER_SNAPSHOT;
}

/** Update game state functionally, persist it, and notify subscribers. */
export function updateState(updater: (prev: GameState) => GameState): void {
  const next = updater(getSnapshot());
  snapshot = next;
  saveState(next);
  listeners.forEach((l) => l());
}

export function getOrCreateDay(state: GameState, key: string): DayLog {
  const existing = state.logs[key];
  if (existing) {
    // keep the day's goal in sync if the goal was changed today
    return existing;
  }
  return {
    date: key,
    intake: 0,
    goal: state.goal,
    location: null,
    events: [],
  };
}

/**
 * Returns the current consecutive-day streak of days where the goal was met,
 * counting backwards from today (today counts if already met).
 */
export function computeStreak(logs: Record<string, DayLog>): number {
  let streak = 0;
  const cursor = new Date();
  // walk backwards day by day
  for (;;) {
    const key = todayKey(cursor);
    const log = logs[key];
    const met = log && log.intake >= log.goal && log.goal > 0;
    if (met) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && key === todayKey()) {
      // today not yet met — don't break the streak that ended yesterday;
      // just skip today and keep checking earlier days.
      cursor.setDate(cursor.getDate() - 1);
      const prevKey = todayKey(cursor);
      const prevLog = logs[prevKey];
      if (prevLog && prevLog.intake >= prevLog.goal && prevLog.goal > 0) {
        // there is an ongoing streak ending yesterday; continue counting it
        continue;
      }
      return 0;
    } else {
      break;
    }
  }
  return streak;
}

/** A friendly level based on how many goals have been hit all-time. */
export function levelFor(goalsHit: number): { level: number; title: string; emoji: string } {
  const tiers = [
    { min: 0, title: "Thirsty Sprout", emoji: "🌱" },
    { min: 3, title: "Dewdrop", emoji: "💧" },
    { min: 7, title: "Splash Star", emoji: "💦" },
    { min: 14, title: "Wave Rider", emoji: "🌊" },
    { min: 30, title: "Hydro Hero", emoji: "🦸‍♀️" },
    { min: 60, title: "Aqua Legend", emoji: "👑" },
  ];
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (goalsHit >= tiers[i].min) idx = i;
  }
  return { level: idx + 1, title: tiers[idx].title, emoji: tiers[idx].emoji };
}

export function countGoalsHit(logs: Record<string, DayLog>): number {
  return Object.values(logs).filter((l) => l.goal > 0 && l.intake >= l.goal).length;
}
