"use client";

import { useMemo } from "react";
import {
  byCategory,
  byDayOfWeek,
  byType,
  computePatterns,
  weeklyTotals,
  type GroupStat,
} from "./analytics";
import { ALCOHOL_TYPES, CATEGORIES, type DrinkEntry } from "./types";

const CATEGORY_LABEL = new Map(CATEGORIES.map((c) => [c.value, `${c.emoji} ${c.label}`]));
const TYPE_LABEL = new Map(ALCOHOL_TYPES.map((t) => [t.value, `${t.emoji} ${t.label}`]));

function Bars({
  title,
  rows,
  label,
}: {
  title: string;
  rows: { key: string; value: number; count?: number }[];
  label?: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <h3 className="mb-3 text-sm font-semibold text-white/80">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-white/40">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>{label ? label(r.key) : r.key}</span>
                <span>{r.value} std{r.count ? ` · ${r.count}×` : ""}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-2xl font-bold text-amber-400">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}

function statRow(s: GroupStat | null, label?: (k: string) => string): string {
  if (!s) return "—";
  return `${label ? label(s.key) : s.key} (${s.standardDrinks})`;
}

export default function Dashboard({ entries }: { entries: DrinkEntry[] }) {
  const p = useMemo(() => computePatterns(entries), [entries]);
  const cats = useMemo(() => byCategory(entries), [entries]);
  const types = useMemo(() => byType(entries), [entries]);
  const days = useMemo(() => byDayOfWeek(entries), [entries]);
  const weeks = useMemo(() => weeklyTotals(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl bg-white/5 p-8 text-center ring-1 ring-white/10">
        <p className="text-white/60">No drinks logged yet. Add your first above to start seeing patterns. 📊</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total std drinks" value={String(p.totalStandardDrinks)} />
        <Stat label="Avg / week" value={String(p.avgPerWeek)} />
        <Stat label="Drinking days" value={String(p.drinkingDays)} />
        <Stat label="Avg / drinking day" value={String(p.avgPerDrinkingDay)} />
      </div>

      <div className="rounded-2xl bg-white/5 p-5 text-sm text-white/70 ring-1 ring-white/10">
        <p className="mb-1">Most with: <span className="text-white">{statRow(p.topCategory, (k) => CATEGORY_LABEL.get(k as never) ?? k)}</span></p>
        <p className="mb-1">Favourite drink: <span className="text-white">{statRow(p.topType, (k) => TYPE_LABEL.get(k as never) ?? k)}</span></p>
        <p className="mb-1">Top setting: <span className="text-white">{statRow(p.topSetting)}</span></p>
        <p>Busiest day: <span className="text-white">{statRow(p.busiestDayOfWeek)}</span></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Bars title="By who you're with" rows={cats.map((c) => ({ key: c.key, value: c.standardDrinks, count: c.count }))}
          label={(k) => CATEGORY_LABEL.get(k as never) ?? k} />
        <Bars title="By drink type" rows={types.map((t) => ({ key: t.key, value: t.standardDrinks, count: t.count }))}
          label={(k) => TYPE_LABEL.get(k as never) ?? k} />
        <Bars title="By day of week" rows={days.map((d) => ({ key: d.key, value: d.standardDrinks, count: d.count }))} />
        <Bars title="Weekly trend" rows={weeks.map((w) => ({ key: w.weekStart, value: w.standardDrinks }))} />
      </div>
    </div>
  );
}
