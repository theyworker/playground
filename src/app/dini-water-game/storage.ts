// Server-backed store for Dini's water game. The pure state model lives in
// ./state (re-exported here). State hydrates from /api/water on mount and is
// persisted with a debounced PUT; if the network fails the game keeps working
// in-memory.

import { DEFAULT_STATE, sanitizeGameState, type GameState } from "./state";

export * from "./state";

const PERSIST_DEBOUNCE_MS = 600;

const SERVER_SNAPSHOT: GameState = { ...DEFAULT_STATE };
let snapshot: GameState | null = null;
const listeners = new Set<() => void>();

let hydrateStarted = false;
let dirty = false; // a local update happened — don't clobber it with a late GET
let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot(): GameState {
  if (snapshot === null) snapshot = { ...DEFAULT_STATE };
  return snapshot;
}

export function getServerSnapshot(): GameState {
  return SERVER_SNAPSHOT;
}

function notify(): void {
  listeners.forEach((l) => l());
}

/** Load persisted state from the server once, after mount. */
export function ensureHydrated(): void {
  if (hydrateStarted || typeof window === "undefined") return;
  hydrateStarted = true;
  void hydrate();
}

async function hydrate(): Promise<void> {
  try {
    const res = await fetch("/api/water", { cache: "no-store" });
    if (!res.ok) return;
    const body = (await res.json()) as { state: GameState };
    if (dirty) return; // user already interacted; keep their in-progress state
    snapshot = sanitizeGameState(body.state);
    notify();
  } catch {
    // offline / error — keep the default in-memory state
  }
}

/** Update game state functionally, persist it (debounced), and notify. */
export function updateState(updater: (prev: GameState) => GameState): void {
  const next = updater(getSnapshot());
  snapshot = next;
  dirty = true;
  notify();
  schedulePersist(next);
}

function schedulePersist(state: GameState): void {
  if (typeof window === "undefined") return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void persist(state);
  }, PERSIST_DEBOUNCE_MS);
}

async function persist(state: GameState): Promise<void> {
  try {
    const res = await fetch("/api/water", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!res.ok) {
      console.warn("[water] save failed:", res.status);
    }
  } catch (err) {
    // offline / network error — optimistic in-memory state remains; next change retries
    console.warn("[water] save failed:", err);
  }
}
