"use client";

import { useState } from "react";
import { createEntry } from "./api-client";
import {
  ALCOHOL_TYPES,
  CATEGORIES,
  SETTINGS,
  type AlcoholType,
  type DrinkCategory,
  type DrinkEntry,
} from "./types";

// Value for a datetime-local input representing "now" in local time.
function nowLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export default function LogForm({
  onAdded,
}: {
  onAdded: (entry: DrinkEntry) => void;
}) {
  const [type, setType] = useState<AlcoholType>("beer");
  const [quantity, setQuantity] = useState("1");
  const [setting, setSetting] = useState(SETTINGS[0] ?? "");
  const [category, setCategory] = useState<DrinkCategory>("friends");
  const [when, setWhen] = useState(nowLocal);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0.5) {
      setError("Enter at least 0.5 of a drink.");
      return;
    }
    setBusy(true);
    try {
      const entry = await createEntry({
        consumedAt: new Date(when).toISOString(),
        type,
        quantity: qty,
        setting,
        category,
        note: note.trim() || undefined,
      });
      onAdded(entry);
      setQuantity("1");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40";
  const labelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-white/60";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="type">Drink</label>
          <select id="type" className={fieldClass} value={type}
            onChange={(e) => setType(e.target.value as AlcoholType)}>
            {ALCOHOL_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="text-black">
                {t.emoji} {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="qty">How many</label>
          <input id="qty" className={fieldClass} type="number" min="0.5" step="0.5"
            value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="category">Who with</label>
          <select id="category" className={fieldClass} value={category}
            onChange={(e) => setCategory(e.target.value as DrinkCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="text-black">
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="setting">Setting</label>
          <select id="setting" className={fieldClass} value={setting}
            onChange={(e) => setSetting(e.target.value)}>
            {SETTINGS.map((s) => (
              <option key={s} value={s} className="text-black">{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="when">When</label>
        <input id="when" className={fieldClass} type="datetime-local"
          value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="note">Note (optional)</label>
        <input id="note" className={fieldClass} type="text" value={note}
          placeholder="e.g. birthday dinner" onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50">
        {busy ? "Saving…" : "Log drink"}
      </button>
    </form>
  );
}
