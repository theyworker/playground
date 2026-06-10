"use client";

import { useEffect, useRef } from "react";

export default function ThreeDWorldPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./beer-scene").then(({ createBeerScene }) => {
      if (!cancelled) cleanup = createBeerScene(container);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0d0a07]">
      <div ref={containerRef} className="absolute inset-0" />
      <h1 className="pointer-events-none absolute left-6 top-6 text-sm font-medium uppercase tracking-[0.3em] text-amber-100/60">
        3D World &mdash; Fizzy Beer
      </h1>
    </main>
  );
}
