"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Orbitron, Share_Tech_Mono } from "next/font/google";
import LoginForm from "./login-form";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["600", "800"] });
const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });

const KEYFRAMES = `
  @keyframes holo-scan {
    0% { transform: translateY(-120%); }
    100% { transform: translateY(110vh); }
  }
  @keyframes holo-flicker {
    0%, 91%, 94%, 97%, 100% { opacity: 1; }
    92% { opacity: 0.72; }
    95% { opacity: 0.86; }
    96% { opacity: 0.65; }
  }
`;

export default function HologramLoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("./hologram-scene").then(({ createHologramScene }) => {
      if (!cancelled) cleanup = createHologramScene(container);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main
      className={`${shareTechMono.className} relative h-dvh w-full overflow-hidden
        bg-[#020409] text-cyan-200`}
    >
      <style>{KEYFRAMES}</style>

      <div ref={containerRef} className="absolute inset-0" />

      {/* CRT scanlines over everything, moving scan bar beneath the form. */}
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(2,4,9,0.5) 0px, rgba(2,4,9,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        className="pointer-events-none absolute left-0 top-0 z-20 h-36 w-full
          bg-gradient-to-b from-transparent via-cyan-300/[0.08] to-transparent"
        style={{ animation: "holo-scan 8s linear infinite" }}
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-6">
        <p className="text-[11px] tracking-[0.45em] text-cyan-400/70">
          ◤ ORBITAL GATE // AUTH NODE 07
        </p>
        <p className="text-[11px] tracking-[0.3em] text-cyan-300/80">
          <span className="animate-pulse text-cyan-300">●</span> UPLINK STABLE
        </p>
      </header>

      <div className="relative z-10 flex h-full items-center justify-center">
        <LoginForm titleFont={orbitron.className} />
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-6">
        <Link
          href="/3d-world"
          className="text-[11px] tracking-[0.35em] text-cyan-400/70 transition-colors
            hover:text-cyan-200 hover:[text-shadow:0_0_12px_rgba(54,229,255,0.8)]"
        >
          ← RETURN TO 3D WORLD
        </Link>
        <p className="text-[11px] tracking-[0.3em] text-cyan-500/50">
          SECTOR 9 RELAY · SIGNAL 98.2%
        </p>
      </footer>
    </main>
  );
}
