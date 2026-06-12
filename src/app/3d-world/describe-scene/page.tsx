"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadScenes } from "./types";
import type { StageHandle } from "./stage-scene";

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
  const stageRef = useRef<StageHandle | null>(null);
  const sceneIndexRef = useRef(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([]);

  const applyScene = (index: number) => {
    sceneIndexRef.current = index;
    setSceneIndex(index);
    const stage = stageRef.current;
    if (!stage) return;
    const report = stage.setScene(scenes[index]);
    reportFallbacks(scenes[index].id, report.fallbacks);
    setFallbacks(report.fallbacks);
  };

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

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#10121f] text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />

      <h1 className="pointer-events-none absolute left-6 top-6 text-sm font-medium uppercase tracking-[0.3em] text-slate-300/70">
        Describe the Scene
      </h1>

      {/* Dev switcher: pages through the compiled scenes. */}
      <nav className="absolute right-6 top-6 z-10 flex flex-col items-end gap-2">
        {scenes.map((entry, index) => (
          <button
            key={entry.id}
            onClick={() => applyScene(index)}
            className={`rounded border px-3 py-1.5 text-xs transition-colors ${
              index === sceneIndex
                ? "border-amber-300/70 bg-amber-300/10 text-amber-100"
                : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-100"
            }`}
          >
            Task {entry.task} &middot; {entry.title}
          </button>
        ))}
      </nav>

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

      <p className="pointer-events-none absolute bottom-6 right-6 text-xs text-slate-400">
        {scene.title} &middot; Task {scene.task} &middot; {scene.difficulty}{" "}
        &middot; {scene.setting.location} &middot; {scene.setting.time_of_day},{" "}
        {scene.setting.weather}
      </p>

      <Link
        href="/3d-world"
        className="absolute bottom-6 left-6 z-10 text-xs uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-slate-100"
      >
        &larr; Back to 3D World
      </Link>
    </main>
  );
}
