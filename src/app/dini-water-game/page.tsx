"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BOTTLE_ML,
  computeStreak,
  countGoalsHit,
  DayLocation,
  DayLog,
  ensureHydrated,
  getOrCreateDay,
  getServerSnapshot,
  getSnapshot,
  levelFor,
  subscribe,
  todayKey,
  updateState,
} from "./storage";

const QUICK_ADDS = [
  { label: "Sip", ml: 100, emoji: "🥄" },
  { label: "Glass", ml: 250, emoji: "🥛" },
  { label: "Mug", ml: 500, emoji: "☕" },
  { label: "Bottle", ml: BOTTLE_ML, emoji: "🍶" },
];

const CHEERS = [
  "Glug glug! 💧",
  "Stay splashy! 💦",
  "Your cells say thanks! 🙌",
  "Hydration nation! 🌊",
  "Sip sip hooray! 🎉",
  "Liquid gold! ✨",
];

function formatLitres(ml: number): string {
  return (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 2) + " L";
}

export default function DiniWaterGame() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureHydrated();
  }, []);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("3");
  const [customMl, setCustomMl] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [justHitGoal, setJustHitGoal] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const key = todayKey();
  const today: DayLog = useMemo(
    () => getOrCreateDay(state, key),
    [state, key],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const progress = state.goal > 0 ? Math.min(today.intake / state.goal, 1) : 0;
  const pct = Math.round(progress * 100);
  const reached = today.intake >= state.goal && state.goal > 0;

  const streak = useMemo(() => computeStreak(state.logs), [state.logs]);
  const goalsHit = useMemo(() => countGoalsHit(state.logs), [state.logs]);
  const level = useMemo(() => levelFor(goalsHit), [goalsHit]);

  const addWater = useCallback(
    (ml: number) => {
      if (ml <= 0) return;
      updateState((prev) => {
        const day = { ...getOrCreateDay(prev, key) };
        const wasReached = day.intake >= prev.goal && prev.goal > 0;
        day.intake += ml;
        day.goal = prev.goal;
        day.events = [...day.events, { amount: ml, at: new Date().toISOString() }];
        const nowReached = day.intake >= prev.goal && prev.goal > 0;
        if (!wasReached && nowReached) {
          setJustHitGoal(true);
          setTimeout(() => setJustHitGoal(false), 3500);
          showToast("🎉 Goal smashed! You did it, Dini!");
        } else {
          showToast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
        }
        return { ...prev, logs: { ...prev.logs, [key]: day } };
      });
    },
    [key, showToast],
  );

  const undoLast = useCallback(() => {
    updateState((prev) => {
      const day = { ...getOrCreateDay(prev, key) };
      if (day.events.length === 0) return prev;
      const last = day.events[day.events.length - 1];
      day.events = day.events.slice(0, -1);
      day.intake = Math.max(0, day.intake - last.amount);
      return { ...prev, logs: { ...prev.logs, [key]: day } };
    });
    showToast("Undid last sip ↩️");
  }, [key, showToast]);

  const setLocation = useCallback(
    (loc: DayLocation) => {
      updateState((prev) => {
        const day = { ...getOrCreateDay(prev, key) };
        day.location = day.location === loc ? null : loc;
        day.goal = prev.goal;
        return { ...prev, logs: { ...prev.logs, [key]: day } };
      });
    },
    [key],
  );

  const commitGoal = useCallback(() => {
    const litres = parseFloat(goalDraft);
    if (!isNaN(litres) && litres > 0) {
      const ml = Math.round(litres * 1000);
      updateState((prev) => {
        const day = { ...getOrCreateDay(prev, key) };
        day.goal = ml;
        return { ...prev, goal: ml, logs: { ...prev.logs, [key]: day } };
      });
      showToast(`Goal set to ${formatLitres(Math.round(litres * 1000))} 🎯`);
    }
    setEditingGoal(false);
  }, [goalDraft, key, showToast]);

  const addCustom = useCallback(() => {
    const ml = parseInt(customMl, 10);
    if (!isNaN(ml) && ml > 0) {
      addWater(ml);
      setCustomMl("");
    }
  }, [customMl, addWater]);

  const resetToday = useCallback(() => {
    updateState((prev) => {
      const day = {
        date: key,
        intake: 0,
        goal: prev.goal,
        location: prev.logs[key]?.location ?? null,
        events: [],
      };
      return { ...prev, logs: { ...prev.logs, [key]: day } };
    });
    showToast("Today reset 🧽");
  }, [key, showToast]);

  // Recent history (most recent first, excluding today), max 7 days.
  const history = useMemo(() => {
    return Object.values(state.logs)
      .filter((l) => l.date !== key)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7);
  }, [state.logs, key]);

  const bottlesLeft = Math.max(0, Math.ceil((state.goal - today.intake) / BOTTLE_ML));

  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-blue-100 text-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950 dark:text-slate-100">
      {/* celebratory droplets when the goal is hit */}
      {justHitGoal && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${(i * 37) % 100}%`,
                top: "-40px",
                animation: `dini-fall ${1.6 + (i % 5) * 0.3}s linear ${
                  (i % 7) * 0.12
                }s forwards`,
              }}
            >
              {["💧", "💦", "🎉", "⭐"][i % 4]}
            </span>
          ))}
        </div>
      )}

      <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">
            💧 Dini&apos;s Water Quest
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {reached
              ? "Goal complete — you're a legend today! 🌟"
              : `${bottlesLeft} more ${bottlesLeft === 1 ? "bottle" : "bottles"} of your 1 L bottle to go`}
          </p>
        </header>

        {/* Level + streak */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl bg-white/70 p-3 text-center shadow-sm backdrop-blur dark:bg-white/10">
            <div className="text-2xl">{level.emoji}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Level {level.level}
            </div>
            <div className="text-sm font-bold">{level.title}</div>
          </div>
          <div className="flex-1 rounded-2xl bg-white/70 p-3 text-center shadow-sm backdrop-blur dark:bg-white/10">
            <div className="text-2xl">🔥</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Streak
            </div>
            <div className="text-sm font-bold">
              {streak} {streak === 1 ? "day" : "days"}
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-white/70 p-3 text-center shadow-sm backdrop-blur dark:bg-white/10">
            <div className="text-2xl">🏆</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Goals hit
            </div>
            <div className="text-sm font-bold">{goalsHit}</div>
          </div>
        </div>

        {/* The bottle */}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/60 p-6 shadow-md backdrop-blur dark:bg-white/5">
          <Bottle progress={progress} />
          <div className="text-center">
            <div className="text-3xl font-black tabular-nums">
              {formatLitres(today.intake)}
            </div>
            <button
              type="button"
              onClick={() => {
                setGoalDraft(String(state.goal / 1000));
                setEditingGoal(true);
              }}
              className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            >
              of {formatLitres(state.goal)} goal · {pct}% ✏️
            </button>
          </div>

          {editingGoal && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-50 p-3 dark:bg-slate-800">
              <label className="text-sm font-medium">Daily goal</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitGoal()}
                autoFocus
                className="w-20 rounded-lg border border-sky-300 bg-white px-2 py-1 text-center text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <span className="text-sm">L</span>
              <button
                type="button"
                onClick={commitGoal}
                className="rounded-lg bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Quick add buttons */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ADDS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => addWater(q.ml)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white/80 py-3 shadow-sm transition hover:scale-105 hover:bg-white active:scale-95 dark:bg-white/10 dark:hover:bg-white/20"
            >
              <span className="text-2xl">{q.emoji}</span>
              <span className="text-xs font-semibold">{q.label}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {q.ml} ml
              </span>
            </button>
          ))}
        </div>

        {/* Custom + undo */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Custom ml"
            value={customMl}
            min="1"
            onChange={(e) => setCustomMl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm dark:border-slate-600 dark:bg-white/10"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={undoLast}
            disabled={today.events.length === 0}
            className="rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-white disabled:opacity-40 dark:bg-white/10 dark:text-slate-300"
            title="Undo last"
          >
            ↩️
          </button>
        </div>

        {/* Where are you today? */}
        <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur dark:bg-white/5">
          <p className="mb-2 text-center text-sm font-semibold">
            Where are you spending today?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLocation("home")}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                today.location === "home"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-white/80 text-slate-600 hover:bg-white dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              🏠 Home all day
            </button>
            <button
              type="button"
              onClick={() => setLocation("work")}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                today.location === "work"
                  ? "bg-indigo-500 text-white shadow"
                  : "bg-white/80 text-slate-600 hover:bg-white dark:bg-white/10 dark:text-slate-300"
              }`}
            >
              🏢 Went to work
            </button>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur dark:bg-white/5">
            <h2 className="mb-2 text-sm font-bold">Recent days</h2>
            <ul className="flex flex-col gap-1.5">
              {history.map((d) => {
                const met = d.goal > 0 && d.intake >= d.goal;
                return (
                  <li
                    key={d.date}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {met ? "✅" : "○"}{" "}
                      {new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-2">
                      {d.location === "home" && <span title="Home">🏠</span>}
                      {d.location === "work" && <span title="Work">🏢</span>}
                      <span className="tabular-nums text-slate-500 dark:text-slate-400">
                        {formatLitres(d.intake)} / {formatLitres(d.goal)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={resetToday}
          className="mx-auto text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline dark:hover:text-slate-200"
        >
          Reset today
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Your logs sync to the cloud ☁️
        </p>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg dark:bg-white/90 dark:text-slate-900">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes dini-fall {
          to { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes dini-wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/** Animated water bottle whose fill level reflects progress. */
function Bottle({ progress }: { progress: number }) {
  const fillPct = Math.max(0, Math.min(progress, 1)) * 100;
  return (
    <div className="relative">
      {/* cap */}
      <div className="mx-auto h-3 w-10 rounded-t-md bg-sky-400" />
      <div className="mx-auto h-2 w-12 rounded-sm bg-sky-300" />
      {/* body */}
      <div className="relative mt-0.5 h-56 w-28 overflow-hidden rounded-b-3xl rounded-t-xl border-4 border-sky-300/70 bg-white/40 dark:bg-white/5">
        {/* water */}
        <div
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-500 to-cyan-400 transition-[height] duration-700 ease-out"
          style={{ height: `${fillPct}%` }}
        >
          {/* moving wave on top of the water */}
          <div
            className="absolute -top-2 left-0 h-3 w-[200%] opacity-80"
            style={{
              background:
                "radial-gradient(circle at 10px 6px, transparent 6px, #22d3ee 6px) repeat-x",
              backgroundSize: "20px 12px",
              animation: "dini-wave 1.8s linear infinite",
            }}
          />
        </div>
        {/* level marks for the 1 L bottle */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            className="absolute left-0 h-px w-3 bg-sky-300/70"
            style={{ bottom: `${m}%` }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-white drop-shadow">
            {Math.round(fillPct)}%
          </span>
        </div>
      </div>
    </div>
  );
}
