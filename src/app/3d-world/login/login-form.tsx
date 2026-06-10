"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "authenticating" | "granted";

const STATUS_LINE: Record<Status, string> = {
  idle: "AWAITING CREDENTIALS",
  authenticating: "VERIFYING BIOSIGN",
  granted: "ACCESS GRANTED — WELCOME, OPERATOR",
};

const BUTTON_LABEL: Record<Status, string> = {
  idle: "INITIATE LINK",
  authenticating: "LINKING…",
  granted: "LINK ESTABLISHED",
};

function CornerBrackets() {
  const edge = "absolute h-4 w-4 border-cyan-300";
  return (
    <>
      <span className={`${edge} -left-px -top-px border-l-2 border-t-2`} />
      <span className={`${edge} -right-px -top-px border-r-2 border-t-2`} />
      <span className={`${edge} -bottom-px -left-px border-b-2 border-l-2`} />
      <span className={`${edge} -bottom-px -right-px border-b-2 border-r-2`} />
    </>
  );
}

export default function LoginForm({ titleFont }: { titleFont: string }) {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    setStatus("authenticating");
    setTimeout(() => setStatus("granted"), 2000);
  };

  const fieldClass =
    "w-full border-b border-cyan-400/40 bg-transparent py-2 text-sm tracking-[0.2em] " +
    "text-cyan-100 outline-none transition-colors placeholder:text-cyan-800 " +
    "focus:border-cyan-300 focus:[box-shadow:0_8px_16px_-12px_rgba(54,229,255,0.8)]";
  const labelClass = "mb-1 block text-[10px] tracking-[0.35em] text-cyan-400/80";

  return (
    <form
      onSubmit={handleSubmit}
      className="group relative w-[min(92vw,26rem)] border border-cyan-300/30
        bg-[#020409]/40 px-8 py-10 backdrop-blur-[2px]
        shadow-[0_0_60px_rgba(54,229,255,0.15),inset_0_0_30px_rgba(54,229,255,0.06)]
        transition-all duration-300 [animation:holo-flicker_5s_infinite]
        hover:border-cyan-300/70 hover:bg-[#020409]/85 hover:backdrop-blur-md
        hover:shadow-[0_0_80px_rgba(54,229,255,0.25),inset_0_0_30px_rgba(54,229,255,0.04)]
        hover:[animation-play-state:paused] focus-within:border-cyan-300/70
        focus-within:bg-[#020409]/85 focus-within:backdrop-blur-md
        focus-within:[animation-play-state:paused]"
    >
      <CornerBrackets />

      <p className="text-[10px] tracking-[0.5em] text-cyan-500/70">
        ORBITAL GATE v9.4.1
      </p>
      <h1
        className={`${titleFont} mt-2 text-2xl font-semibold leading-tight tracking-[0.18em]
          text-cyan-100 [text-shadow:0_0_18px_rgba(54,229,255,0.7)]`}
      >
        IDENTITY
        <br />
        VERIFICATION
      </h1>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="operator-id" className={labelClass}>
            OPERATOR ID
          </label>
          <input
            id="operator-id"
            name="operatorId"
            type="text"
            autoComplete="username"
            placeholder="OP-0000-XX"
            required
            disabled={status !== "idle"}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="passkey" className={labelClass}>
            PASSKEY
          </label>
          <input
            id="passkey"
            name="passkey"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            required
            disabled={status !== "idle"}
            className={fieldClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status !== "idle"}
        className={`mt-10 w-full border py-3 text-xs tracking-[0.45em] transition-all duration-300
          ${
            status === "granted"
              ? "border-emerald-300/70 text-emerald-200 shadow-[0_0_30px_rgba(52,255,180,0.35)]"
              : "border-cyan-300/60 text-cyan-100 hover:bg-cyan-400/10 hover:shadow-[0_0_30px_rgba(54,229,255,0.35)]"
          }`}
      >
        {BUTTON_LABEL[status]}
      </button>

      <p
        className={`mt-6 text-[11px] tracking-[0.25em]
          ${status === "granted" ? "text-emerald-300/90" : "text-cyan-300/70"}`}
      >
        &gt; {STATUS_LINE[status]}
        <span className="animate-pulse">▍</span>
      </p>
    </form>
  );
}
