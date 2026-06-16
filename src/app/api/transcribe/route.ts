import { NextRequest, NextResponse } from "next/server";

// Speech-to-text for the "Describe the Scene" drill. The browser records the
// mic to a blob and POSTs it here as multipart/form-data; we forward it to
// OpenAI's transcription endpoint and return the text. The API key lives only
// on the server and is never shipped to the client.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OpenAI rejects audio uploads larger than 25MB; a 60s opus clip is far under,
// but we reject early with a clear message rather than relaying their error.
const MAX_BYTES = 25 * 1024 * 1024;

// Favour accuracy over cost here: a mis-transcription unfairly penalises the
// learner. gpt-4o-mini-transcribe is the cheaper fallback.
const DEFAULT_MODEL = "gpt-4o-transcribe";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Transcription is not configured (missing OPENAI_API_KEY)." },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an audio file." },
      { status: 400 },
    );
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "No audio was received. Please record and try again." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Recording is too large (limit 25MB)." },
      { status: 413 },
    );
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_MODEL;
  const upstream = new FormData();
  upstream.append("file", file, file.name || "audio.webm");
  upstream.append("model", model);

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the transcription service." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[transcribe] OpenAI ${response.status}: ${detail}`);
    return NextResponse.json(
      { error: "Transcription failed. Please try again." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { text?: string };
  return NextResponse.json({ transcript: data.text ?? "" });
}
