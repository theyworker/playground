// Pure, environment-agnostic state model for Dini's water game. No window / no
// React here, so it is safe to import from both the client store and the
// server API routes.

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

export const DEFAULT_GOAL = 3000; // 3 L
export const BOTTLE_ML = 1000; // Dini's 1 L bottle
export const DEFAULT_STATE: GameState = { goal: DEFAULT_GOAL, logs: {} };

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeEvent(raw: unknown): DrinkEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const amount = typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : null;
  const at = typeof r.at === "string" ? r.at : null;
  if (amount === null || amount <= 0 || at === null) return null;
  return { amount, at };
}

function sanitizeDay(key: string, raw: unknown): DayLog | null {
  if (!DATE_RE.test(key)) return null;
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const goal =
    typeof r.goal === "number" && Number.isFinite(r.goal) && r.goal >= 0 ? r.goal : DEFAULT_GOAL;
  const events = Array.isArray(r.events)
    ? r.events.map(sanitizeEvent).filter((e): e is DrinkEvent => e !== null)
    : [];
  const intake =
    typeof r.intake === "number" && Number.isFinite(r.intake) && r.intake >= 0
      ? r.intake
      : events.reduce((sum, e) => sum + e.amount, 0);
  const location: DayLocation | null =
    r.location === "home" || r.location === "work" ? r.location : null;
  return { date: key, intake, goal, location, events };
}

/** Coerce arbitrary parsed JSON into a valid GameState, dropping junk. */
export function sanitizeGameState(raw: unknown): GameState {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_STATE };
  const r = raw as Record<string, unknown>;
  const goal =
    typeof r.goal === "number" && Number.isFinite(r.goal) && r.goal > 0 ? r.goal : DEFAULT_GOAL;
  const logs: Record<string, DayLog> = {};
  if (typeof r.logs === "object" && r.logs !== null) {
    for (const [key, value] of Object.entries(r.logs as Record<string, unknown>)) {
      const dayLog = sanitizeDay(key, value);
      if (dayLog) logs[key] = dayLog;
    }
  }
  return { goal, logs };
}
