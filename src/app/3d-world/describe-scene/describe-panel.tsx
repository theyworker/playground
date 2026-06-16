"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneSpec } from "./types";
import { computeWeightedScore, type ScoreResult } from "./scoring";

// Audio-capture + scoring panel for the drill. Flow: record the mic with
// MediaRecorder -> POST the clip to /api/transcribe -> POST the transcript to
// /api/score -> compute a weighted 0-100 from the manifest weights. The
// authoritative transcript is Whisper's; an optional Web Speech preview runs
// purely for live on-screen text and never feeds scoring.

const MAX_SECONDS = 60;

type Phase = "idle" | "recording" | "transcribing" | "scoring" | "done" | "error";

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

export default function DescribePanel({ scene }: { scene: SceneSpec }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [preview, setPreview] = useState("");
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
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

  const runPipeline = useCallback(async (blob: Blob, fileName: string) => {
    const sceneId = scene.id;
    try {
      setPhase("transcribing");
      const form = new FormData();
      form.append("audio", blob, fileName);
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      const tData = await tRes.json();
      if (!tRes.ok) throw new Error(tData.error || "Transcription failed.");
      const text: string = tData.transcript ?? "";
      setTranscript(text);

      setPhase("scoring");
      const sRes = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, sceneId }),
      });
      const sData = await sRes.json();
      if (!sRes.ok) throw new Error(sData.error || "Scoring failed.");
      setResult(sData as ScoreResult);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }, [scene.id]);

  const stopRecording = useCallback(() => {
    clearTick();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    setError("");
    setTranscript("");
    setResult(null);
    setPreview("");

    if (pickMimeType() === undefined && typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
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
          ? "Microphone access was denied. Enable it in your browser to record."
          : "No microphone was found, or it could not be opened.",
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
      setError("Audio recording is not supported in this browser.");
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
        setError("The recording was empty. Please try again.");
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
  }, [cleanupCapture, runPipeline, stopRecording]);

  const weighted =
    result !== null ? computeWeightedScore(scene, result) : null;
  const busy = phase === "transcribing" || phase === "scoring";

  return (
    <section className="pointer-events-auto absolute bottom-16 left-1/2 z-10 w-[min(92vw,30rem)] -translate-x-1/2 rounded-xl border border-slate-600/60 bg-black/65 p-4 text-sm text-slate-100 backdrop-blur">
      <div className="flex items-center gap-3">
        {phase === "recording" ? (
          <button
            onClick={stopRecording}
            className="rounded-full bg-red-500 px-5 py-2 font-medium text-white transition-colors hover:bg-red-400"
          >
            ◼ Stop
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={busy}
            className="rounded-full bg-amber-400 px-5 py-2 font-medium text-slate-900 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ● Describe
          </button>
        )}

        {phase === "recording" && (
          <span className="flex items-center gap-2 text-red-300">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            Recording… {secondsLeft}s
          </span>
        )}
        {phase === "transcribing" && (
          <span className="text-amber-200">Transcribing…</span>
        )}
        {phase === "scoring" && (
          <span className="text-amber-200">Scoring…</span>
        )}
      </div>

      {phase === "recording" && preview && (
        <p className="mt-3 max-h-20 overflow-y-auto text-xs italic text-slate-400">
          {preview}
        </p>
      )}

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

      {phase === "done" && weighted && (
        <div className="mt-3 space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-amber-300">
              {weighted.score}
            </span>
            <span className="text-xs text-slate-400">
              / 100 ({weighted.earned.toFixed(1)} of {weighted.possible.toFixed(1)} pts)
            </span>
          </div>
          {scene.anomaly && (
            <p className="text-xs text-slate-300">
              Anomaly — noticed:{" "}
              <strong>{result?.anomaly?.noticed ? "yes" : "no"}</strong>, explained:{" "}
              <strong>{result?.anomaly?.explained ? "yes" : "no"}</strong>
            </p>
          )}
          <details className="text-xs text-slate-300">
            <summary className="cursor-pointer text-slate-400">Transcript</summary>
            <p className="mt-1 whitespace-pre-wrap">{transcript || "(empty)"}</p>
          </details>
        </div>
      )}
    </section>
  );
}
