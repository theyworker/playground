"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadScenes } from "./types";
import { compileScene } from "./compile";
import type { StageHandle } from "./stage-scene";

// Validated at module load so a bad scenes.json fails the build, not the
// learner mid-drill.
const scenes = loadScenes();

export default function DescribeScenePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageHandle | null>(null);
  const [stageReady, setStageReady] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let handle: StageHandle | undefined;

    import("./stage-scene").then(({ createStageScene }) => {
      if (cancelled) return;
      handle = createStageScene(container);
      stageRef.current = handle;
      setStageReady(true);
    });

    return () => {
      cancelled = true;
      stageRef.current = null;
      handle?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!stageReady) return;
    stageRef.current?.setScene(compileScene(scenes[sceneIndex]));
  }, [stageReady, sceneIndex]);

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
            onClick={() => setSceneIndex(index)}
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

      <p className="pointer-events-none absolute bottom-6 right-6 text-xs text-slate-400">
        {scene.title} &middot; Task {scene.task} &middot; {scene.difficulty}{" "}
        &middot; {scene.setting.location}
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
