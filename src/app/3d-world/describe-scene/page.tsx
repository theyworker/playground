"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadScenes } from "./types";
import type { StageHandle } from "./stage-scene";
import type { ScoreResult } from "./scoring";
import { celpipBand, computeWeightedScore } from "./scoring";
import DescribePanel from "./describe-panel";
import BreakdownPanel from "./breakdown-panel";

// Validated at module load so a bad scenes.json fails the build, not the
// learner mid-drill.
const scenes = loadScenes();

function reportFallbacks(sceneId: string, fallbacks: string[]) {
  if (fallbacks.length === 0) {
    console.info(`[describe-scene] ${sceneId}: all descriptors have meshes`);
  } else {
    console.warn(
      `[describe-scene] ${sceneId}: placeholder fallback used for ${fallbacks.length} descriptor(s):\n` +
        fallbacks.map((d) => `  - ${d}`).join("\n"),
    );
  }
}

export default function DescribeScenePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const breakdownRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageHandle | null>(null);
  const sceneIndexRef = useRef(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [transcript, setTranscript] = useState("");

  const applyScene = useCallback((index: number) => {
    sceneIndexRef.current = index;
    setSceneIndex(index);
    setResult(null);
    setTranscript("");
    const stage = stageRef.current;
    if (!stage) return;
    const report = stage.setScene(scenes[index]);
    reportFallbacks(scenes[index].id, report.fallbacks);
    setFallbacks(report.fallbacks);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let handle: StageHandle | undefined;

    import("./stage-scene").then(({ createStageScene }) => {
      if (cancelled) return;
      handle = createStageScene(container);
      stageRef.current = handle;
      const index = sceneIndexRef.current;
      const report = handle.setScene(scenes[index]);
      reportFallbacks(scenes[index].id, report.fallbacks);
      setFallbacks(report.fallbacks);
    });

    return () => {
      cancelled = true;
      stageRef.current = null;
      handle?.dispose();
    };
  }, []);

  const scene = scenes[sceneIndex];

  const handleRecordingStart = useCallback(() => {
    setResult(null);
    setTranscript("");
    stageRef.current?.clearScore();
  }, []);

  const handleScored = useCallback(
    (scored: ScoreResult, scoredTranscript: string) => {
      setResult(scored);
      setTranscript(scoredTranscript);
      stageRef.current?.applyScore(scenes[sceneIndexRef.current], scored);
    },
    [],
  );

  const goToBreakdown = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    breakdownRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const nextScene = useCallback(() => {
    applyScene((sceneIndexRef.current + 1) % scenes.length);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [applyScene]);

  const weighted = result ? computeWeightedScore(scene, result) : null;
  const band = weighted ? celpipBand(weighted.score) : null;

  return (
    <main className="relative min-h-dvh w-full bg-[#10121f] text-slate-100">
      {/* Canvas hero */}
      <section className="relative h-dvh w-full overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        <h1 className="pointer-events-none absolute left-6 top-6 text-sm font-medium uppercase tracking-[0.3em] text-slate-300/70">
          Describe the Scene
        </h1>

        {/* Scene switcher: pages through the compiled scenes. */}
        <nav className="absolute right-6 top-6 z-10 flex flex-col items-end gap-2">
          {scenes.map((entry, index) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => applyScene(index)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                index === sceneIndex
                  ? "border-amber-300/70 bg-amber-300/10 text-amber-100"
                  : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-100"
              }`}
            >
              Task {entry.task} &middot; {entry.title}
            </button>
          ))}
        </nav>

        {/* Compact result + actions, shown once scored. */}
        {weighted && band && (
          <div className="absolute left-1/2 top-6 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-600/60 bg-black/70 px-4 py-2 text-sm backdrop-blur">
            <span className="font-semibold text-amber-300">{weighted.score}</span>
            <span className="text-xs text-slate-400">/ 100 · Band {band.band}</span>
            <button
              type="button"
              onClick={goToBreakdown}
              className="rounded-full border border-slate-500 px-3 py-1 text-xs text-slate-200 transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              See breakdown ↓
            </button>
            <button
              type="button"
              onClick={nextScene}
              className="rounded-full bg-amber-400 px-3 py-1 text-xs font-medium text-slate-900 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Next scene →
            </button>
          </div>
        )}

        {/* Asset-gap report: descriptors that fell back to the placeholder. */}
        {fallbacks.length > 0 && (
          <aside className="pointer-events-none absolute bottom-16 left-6 max-w-xs rounded border border-amber-400/40 bg-black/50 p-3 text-xs text-amber-200">
            <p className="mb-1 font-semibold uppercase tracking-wider">
              Placeholder fallbacks
            </p>
            <ul className="list-inside list-disc text-amber-100/80">
              {fallbacks.map((descriptor) => (
                <li key={descriptor}>{descriptor}</li>
              ))}
            </ul>
          </aside>
        )}

        <DescribePanel
          key={scene.id}
          scene={scene}
          onRecordingStart={handleRecordingStart}
          onScored={handleScored}
        />

        <p className="pointer-events-none absolute bottom-6 right-6 text-xs text-slate-400">
          {scene.title} &middot; Task {scene.task} &middot; {scene.difficulty}{" "}
          &middot; {scene.setting.location} &middot; {scene.setting.time_of_day},{" "}
          {scene.setting.weather}
        </p>

        <Link
          href="/3d-world"
          className="absolute bottom-6 left-6 z-10 text-xs uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          &larr; Back to 3D World
        </Link>
      </section>

      {/* Feedback below the canvas. */}
      {result && (
        <div ref={breakdownRef} className="border-t border-slate-800 bg-[#0b0d18]">
          <BreakdownPanel scene={scene} result={result} transcript={transcript} />
          <div className="mx-auto flex max-w-3xl justify-end px-6 pb-12">
            <button
              type="button"
              onClick={nextScene}
              className="rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              Next scene →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
