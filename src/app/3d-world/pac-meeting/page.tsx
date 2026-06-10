"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import AvControls from "./av-controls";
import MobileControls from "./mobile-controls";

export default function PacMeetingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./game-scene").then(({ createGameScene }) => {
      if (!cancelled) cleanup = createGameScene(container);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#10121f] text-slate-100">
      <div ref={containerRef} className="absolute inset-0" />

      <Link
        href="/3d-world"
        className="absolute bottom-6 left-6 z-10 text-xs uppercase tracking-[0.25em] text-slate-400 transition-colors hover:text-slate-100"
      >
        &larr; Back to 3D World
      </Link>

      <AvControls />

      <MobileControls />
    </main>
  );
}
