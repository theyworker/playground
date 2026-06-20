"use client";

import { useEffect, useState } from "react";
import Dashboard from "./dashboard";
import LogForm from "./log-form";
import { deleteEntry, listEntries } from "./api-client";
import { ALCOHOL_TYPES, CATEGORIES, type DrinkEntry } from "./types";

const TYPE_LABEL = new Map(ALCOHOL_TYPES.map((t) => [t.value, `${t.emoji} ${t.label}`]));
const CATEGORY_LABEL = new Map(CATEGORIES.map((c) => [c.value, c.label]));

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AlcoholTrackerPage() {
  const [entries, setEntries] = useState<DrinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEntries()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load."))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    const prev = entries;
    setEntries((es) => es.filter((e) => e.id !== id));
    try {
      await deleteEntry(id);
    } catch {
      setEntries(prev);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-neutral-950 px-5 py-10 text-white">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">🍷 Alcohol Tracker</h1>
        <p className="mt-1 text-sm text-white/60">
          Log what you drink, where, and who with — and watch your patterns over time.
        </p>
      </header>

      <section className="mb-10">
        <LogForm onAdded={(entry) => setEntries((es) => [entry, ...es])} />
      </section>

      {error && (
        <p role="alert" className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Your patterns</h2>
        {loading ? (
          <p className="text-white/50">Loading…</p>
        ) : (
          <Dashboard entries={entries} />
        )}
      </section>

      {entries.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent ({Math.min(30, entries.length)} of {entries.length})</h2>
          <ul className="space-y-2">
            {entries.slice(0, 30).map((e) => (
              <li key={e.id}
                className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <div className="text-sm">
                  <span className="font-medium">{TYPE_LABEL.get(e.type) ?? e.type} ×{e.quantity}</span>
                  <span className="text-white/50">
                    {" "}· {e.setting} · {CATEGORY_LABEL.get(e.category) ?? e.category}
                  </span>
                  {e.note && <span className="text-white/40"> · {e.note}</span>}
                  <div className="text-xs text-white/40">{formatWhen(e.consumedAt)}</div>
                </div>
                <button onClick={() => remove(e.id)}
                  aria-label={`Delete ${TYPE_LABEL.get(e.type) ?? e.type} on ${formatWhen(e.consumedAt)}`}
                  className="ml-3 shrink-0 rounded-lg px-2 py-1 text-xs text-white/40 transition hover:bg-white/10 hover:text-red-300">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
