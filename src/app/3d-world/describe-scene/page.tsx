"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { loadScenes } from "./types";

// Validated at module load so a bad scenes.json fails the build, not the
// learner mid-drill.
const scenes = loadScenes();

export default function DescribeScenePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./stage-scene").then(({ createStageScene }) => {
      if (!cancelled) cleanup = createStageScene(container);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#10121f] text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />

      <h1 className="pointer-events-none absolute left-6 top-6 text-sm font-medium uppercase tracking-[0.3em] text-slate-300/70">
        Describe the Scene
      </h1>

      {/* Temporary Phase-1 check: confirms all scenes load and validate. */}
      <ul className="pointer-events-none absolute left-6 top-14 space-y-1 text-xs text-slate-400">
        {scenes.map((scene) => (
          <li key={scene.id}>
            Task {scene.task} &middot; {scene.title} ({scene.difficulty})
          </li>
        ))}
      </ul>

      <Link
        href="/3d-world"
        className="absolute bottom-6 left-6 z-10 text-xs uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-slate-100"
      >
        &larr; Back to 3D World
      </Link>
    </main>
  );
}
