"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneSpec } from "./types";
import type { ScoreResult } from "./scoring";

// Capture surface for the drill. Records the mic with MediaRecorder, POSTs the
// clip to /api/transcribe, then POSTs the transcript to /api/score, and bubbles
// the result up so the page can light up the meshes and render the breakdown.
// Whisper's transcript is authoritative; an optional Web Speech preview is shown
// live but never scored.

const MAX_SECONDS = 60;

type Phase = "idle" | "recording" | "transcribing" | "scoring" | "error";

interface DescribePanelProps {
  scene: SceneSpec;
  /** Fired when a new recording starts, so prior feedback can be cleared. */
  onRecordingStart: () => void;
  onScored: (result: ScoreResult, transcript: string) => void;
}

// Prefer opus-in-webm; fall back through what the browser actually supports.
// Safari often only offers mp4/m4a, so we name the file to match.
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg;codecs=opus",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

function fileNameFor(mimeType: string | undefined): string {
  if (!mimeType) return "recording.webm";
  if (mimeType.includes("webm")) return "recording.webm";
  if (mimeType.includes("ogg")) return "recording.ogg";
  if (mimeType.includes("mp4")) return "recording.mp4";
  if (mimeType.includes("m4a")) return "recording.m4a";
  return "recording.webm";
}

// Minimal shape of the non-standard Web Speech API we touch (preview only).
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  start(): void;
  stop(): void;
}

function startSpeechPreview(
  onText: (text: string) => void,
): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  try {
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: unknown) => {
      const results = (event as { results: ArrayLike<ArrayLike<{ transcript: string }>> }).results;
      let text = "";
      for (let i = 0; i < results.length; i++) text += results[i][0].transcript;
      onText(text);
    };
    recognition.start();
    return recognition;
  } catch {
    return null;
  }
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 focus-visible:ring-amber-300";

export default function DescribePanel({
  scene,
  onRecordingStart,
  onScored,
}: DescribePanelProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const cleanupCapture = useCallback(() => {
    clearTick();
    speechRef.current?.stop();
    speechRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => cleanupCapture, [cleanupCapture]);

  const runPipeline = useCallback(
    async (blob: Blob, fileName: string) => {
      const sceneId = scene.id;
      try {
        setPhase("transcribing");
        const form = new FormData();
        form.append("audio", blob, fileName);
        const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
        const tData = await tRes.json().catch(() => ({}));
        if (!tRes.ok) {
          throw new Error(
            tData.error || "We couldn't transcribe your recording. Please try again.",
          );
        }
        const text: string = tData.transcript ?? "";

        setPhase("scoring");
        const sRes = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text, sceneId }),
        });
        const sData = await sRes.json().catch(() => ({}));
        if (!sRes.ok) {
          throw new Error(
            sData.error || "We couldn't score your description. Please try again.",
          );
        }
        onScored(sData as ScoreResult, text);
        setPhase("idle");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setPhase("error");
      }
    },
    [scene.id, onScored],
  );

  const stopRecording = useCallback(() => {
    clearTick();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setPreview("");
    onRecordingStart();

    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording isn't supported in this browser. Try Chrome, Edge, or Safari.");
      setPhase("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow the mic in your browser's site settings, then try again."
          : "We couldn't open a microphone. Check that one is connected and not in use, then try again.",
      );
      setPhase("error");
      return;
    }
    streamRef.current = stream;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      cleanupCapture();
      setError("Audio recording isn't supported in this browser. Try Chrome, Edge, or Safari.");
      setPhase("error");
      return;
    }
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      cleanupCapture();
      if (blob.size === 0) {
        setError("That recording was empty — no audio was captured. Please try again.");
        setPhase("error");
        return;
      }
      void runPipeline(blob, fileNameFor(type));
    };

    speechRef.current = startSpeechPreview(setPreview);

    recorder.start();
    setPhase("recording");
    setSecondsLeft(MAX_SECONDS);
    tickRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cleanupCapture, onRecordingStart, runPipeline, stopRecording]);

  const busy = phase === "transcribing" || phase === "scoring";

  return (
    <section
      aria-label="Record your description"
      className="pointer-events-auto absolute bottom-16 left-1/2 z-10 w-[min(92vw,30rem)] -translate-x-1/2 rounded-xl border border-slate-600/60 bg-black/70 p-4 text-sm text-slate-100 shadow-xl backdrop-blur"
    >
      <div className="flex items-center gap-3">
        {phase === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className={`rounded-full bg-red-500 px-5 py-2 font-medium text-white transition-colors hover:bg-red-400 ${FOCUS_RING}`}
          >
            <span aria-hidden="true">◼</span> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            className={`rounded-full bg-amber-400 px-5 py-2 font-medium text-slate-900 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`}
          >
            <span aria-hidden="true">●</span>{" "}
            {phase === "error" ? "Try again" : "Describe"}
          </button>
        )}

        <span aria-live="polite" className="flex items-center gap-2">
          {phase === "recording" && (
            <span className="flex items-center gap-2 text-red-300">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              Recording… {secondsLeft}s left
            </span>
          )}
          {phase === "transcribing" && (
            <span className="text-amber-200">Transcribing your description…</span>
          )}
          {phase === "scoring" && (
            <span className="text-amber-200">Scoring against the scene…</span>
          )}
        </span>
      </div>

      {phase === "idle" && (
        <p className="mt-2 text-xs text-slate-400">
          Press Describe and speak for up to {MAX_SECONDS}s. We&apos;ll transcribe and score it.
        </p>
      )}

      {phase === "recording" && preview && (
        <p className="mt-3 max-h-20 overflow-y-auto text-xs italic text-slate-400">
          {preview}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
