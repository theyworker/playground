"use client";

import type { SceneSpec } from "./types";
import {
  buildBreakdown,
  celpipBand,
  coachingLine,
  computeWeightedScore,
  type ScoreResult,
} from "./scoring";

// Post-score feedback shown below the canvas: the weighted score and band, one
// specific line of coaching, a captured-vs-missed breakdown by category (each
// miss showing the phrasing the learner could have used), the model's coaching
// note, the sample strong answer, and the authoritative transcript that was
// actually scored.

interface BreakdownPanelProps {
  scene: SceneSpec;
  result: ScoreResult;
  transcript: string;
}

export default function BreakdownPanel({
  scene,
  result,
  transcript,
}: BreakdownPanelProps) {
  const weighted = computeWeightedScore(scene, result);
  const band = celpipBand(weighted.score);
  const groups = buildBreakdown(scene, result);
  const coaching = coachingLine(scene, groups, result);

  return (
    <section
      aria-label="Feedback"
      className="mx-auto w-full max-w-3xl px-6 py-10 text-slate-100"
    >
      {/* Score + band */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/60 pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Your score</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-5xl font-semibold text-amber-300">{weighted.score}</span>
            <span className="text-sm text-slate-400">/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Estimated CELPIP band
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-100">{band.band}</p>
          <p className="text-xs text-slate-400">{band.descriptor} · estimate only</p>
        </div>
      </div>

      {/* Coaching: our specific line + the model's note */}
      <div className="mt-6 space-y-2">
        <p className="text-base font-medium text-amber-100">{coaching}</p>
        {result.notes?.trim() && (
          <p className="text-sm text-slate-300">
            <span className="text-slate-500">Examiner note: </span>
            {result.notes.trim()}
          </p>
        )}
      </div>

      {/* Anomaly verdict (Task 8) */}
      {scene.anomaly && (
        <div className="mt-6 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            The unusual element
          </h3>
          <p className="mt-2 text-sm text-slate-300">{scene.anomaly.description}.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Verdict label="Noticed it" ok={result.anomaly?.noticed === true} />
            <Verdict label="Explained why" ok={result.anomaly?.explained === true} />
          </div>
          {result.anomaly?.explained !== true && (
            <p className="mt-3 text-sm text-slate-400">
              <span className="text-slate-500">Why it&apos;s odd: </span>
              {scene.anomaly.why_unusual}.
            </p>
          )}
        </div>
      )}

      {/* Captured vs missed, by category */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {groups.map((group) => {
          const captured = group.items.filter((item) => item.matched).length;
          const missed = group.items.filter((item) => !item.matched);
          return (
            <div
              key={group.key}
              className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-slate-200">{group.label}</h3>
                <span className="text-xs text-slate-400">
                  {captured}/{group.items.length} captured
                </span>
              </div>
              {missed.length === 0 ? (
                <p className="mt-2 text-xs text-emerald-300">
                  All captured — nicely done.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {missed.map((item) => (
                    <li key={item.id} className="text-xs leading-relaxed text-slate-400">
                      <span className="mr-1 text-red-300" aria-hidden="true">
                        ✗
                      </span>
                      <span className="text-slate-500">You could have said: </span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Sample strong answer */}
      <div className="mt-8 rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
          Sample strong answer
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{scene.model_answer}</p>
      </div>

      {/* The transcript that was actually scored */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          What we scored (your transcript)
        </h3>
        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 text-sm leading-relaxed text-slate-300">
          {transcript.trim() || "(no speech was detected)"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Scored on this transcript. If a word was misheard, re-record for a fairer read.
        </p>
      </div>
    </section>
  );
}

function Verdict({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={ok ? "text-emerald-300" : "text-red-300"}>
      <span aria-hidden="true">{ok ? "✓ " : "✗ "}</span>
      {label}: <strong>{ok ? "yes" : "no"}</strong>
    </span>
  );
}
