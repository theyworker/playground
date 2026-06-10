"use client";

import { useEffect, useState } from "react";

type Status = { invite: string; phase: string; players: number };

const PHASE_COLORS: Record<string, string> = {
  hosting: "bg-emerald-400",
  connected: "bg-emerald-400",
  connecting: "bg-amber-400",
};

export default function MultiplayerPanel() {
  const [status, setStatus] = useState<Status>({
    invite: "",
    phase: "connecting",
    players: 1,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onStatus = (event: Event) =>
      setStatus((event as CustomEvent<Status>).detail);
    window.addEventListener("pac-multiplayer", onStatus);
    return () => window.removeEventListener("pac-multiplayer", onStatus);
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(status.invite);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dotColor = PHASE_COLORS[status.phase] ?? "bg-rose-400";

  return (
    <div className="absolute right-6 top-6 z-10 flex items-center gap-3 rounded-md bg-black/45 px-4 py-2.5 text-xs text-slate-200 backdrop-blur-sm">
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColor} animate-pulse`} />
        <span className="uppercase tracking-[0.2em]">{status.phase}</span>
      </span>
      <span className="text-slate-400">
        {status.players} player{status.players === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        onClick={copy}
        disabled={!status.invite}
        className="rounded border border-slate-500/60 px-2.5 py-1 uppercase tracking-[0.15em] transition-colors hover:bg-slate-200/15 disabled:opacity-40"
      >
        {copied ? "Copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
