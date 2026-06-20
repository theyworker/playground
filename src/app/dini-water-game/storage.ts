// Local-storage backed store for Dini's water game. The pure state model and
// helpers now live in ./state; this module re-exports them so existing
// importers keep working, and owns the browser store + persistence.

import { DEFAULT_STATE, sanitizeGameState, type GameState } from "./state";

export * from "./state";

const STORAGE_KEY = "dini-water-game-v1";

function loadState(): GameState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return sanitizeGameState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATE };
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

// ── External store, so React can read via useSyncExternalStore ──

const SERVER_SNAPSHOT: GameState = { ...DEFAULT_STATE };
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
