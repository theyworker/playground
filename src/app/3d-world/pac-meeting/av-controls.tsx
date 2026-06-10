"use client";

import { useEffect, useState } from "react";

function MicIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      {muted && <path d="M4 4l16 16" />}
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5z" />
      {muted ? (
        <path d="M16 9l5 6m0-6-5 6" />
      ) : (
        <>
          <path d="M15.5 9.5a4 4 0 0 1 0 5" />
          <path d="M18 7a8 8 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

function ToggleButton({
  muted,
  onClick,
  label,
  children,
}: {
  muted: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full border
        backdrop-blur-sm transition-colors
        ${
          muted
            ? "border-rose-400/60 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
            : "border-slate-500/50 bg-black/40 text-slate-200 hover:bg-black/60"
        }`}
    >
      {children}
    </button>
  );
}

export default function AvControls() {
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  // The game scene listens for this to gate the world-music volume.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("pac-speaker", { detail: { muted: speakerMuted } }),
    );
  }, [speakerMuted]);

  return (
    <div className="absolute bottom-6 right-6 z-10 flex gap-3">
      <ToggleButton
        muted={micMuted}
        onClick={() => setMicMuted((m) => !m)}
        label={micMuted ? "Unmute microphone" : "Mute microphone"}
      >
        <MicIcon muted={micMuted} />
      </ToggleButton>
      <ToggleButton
        muted={speakerMuted}
        onClick={() => setSpeakerMuted((m) => !m)}
        label={speakerMuted ? "Unmute speaker" : "Mute speaker"}
      >
        <SpeakerIcon muted={speakerMuted} />
      </ToggleButton>
    </div>
  );
}
