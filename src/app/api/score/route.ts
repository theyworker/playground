import { NextRequest, NextResponse } from "next/server";
import { loadScenes } from "../../3d-world/describe-scene/types";
import { buildScorables } from "../../3d-world/describe-scene/scoring";

// Grades a transcript against a scene. Uses OpenAI Chat Completions with STRICT
// structured outputs (response_format json_schema, strict: true) so the JSON
// is guaranteed valid and keyed by the manifest ids — no fence-stripping or
// retry. The API key stays server-side. The numeric score is computed on the
// client from these matched booleans (see scoring.ts).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A current general model with strong judgment that supports strict json_schema
// outputs; this grades a language exam, so favour quality over cost.
const DEFAULT_MODEL = "gpt-4o";

const scenes = loadScenes();

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Scoring is not configured (missing OPENAI_API_KEY)." },
      { status: 500 },
    );
  }

  let body: { transcript?: unknown; sceneId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const transcript = typeof body.transcript === "string" ? body.transcript : "";
  const sceneId = typeof body.sceneId === "string" ? body.sceneId : "";
  const scene = scenes.find((s) => s.id === sceneId);
  if (!scene) {
    return NextResponse.json(
      { error: `Unknown sceneId "${sceneId}".` },
      { status: 400 },
    );
  }

  const scorables = buildScorables(scene);
  const ids = scorables.map((item) => item.id);

  // Strict structured output schema. `id` is constrained to the scene's exact
  // scorable ids so the model can only report on real items; anomaly is a
  // nullable object scored on noticed + explained separately.
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["matches", "anomaly", "notes"],
    properties: {
      matches: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "matched", "evidence"],
          properties: {
            id: { type: "string", enum: ids },
            matched: { type: "boolean" },
            evidence: {
              type: "string",
              description:
                "Short quote/paraphrase from the transcript that supports the decision, or why it was not credited.",
            },
          },
        },
      },
      anomaly: {
        type: ["object", "null"],
        additionalProperties: false,
        required: ["noticed", "explained", "evidence"],
        properties: {
          noticed: { type: "boolean" },
          explained: { type: "boolean" },
          evidence: { type: "string" },
        },
      },
      notes: { type: "string" },
    },
  };

  const itemLines = scorables
    .map((item) => `- ${item.id} [${item.kind}]: ${item.text}`)
    .join("\n");

  const anomalyBlock = scene.anomaly
    ? `This scene contains an ANOMALY (Task 8). Judge it separately from the items above:\n` +
      `- The anomaly: ${scene.anomaly.description} (located ${scene.anomaly.position}).\n` +
      `- Why it is unusual: ${scene.anomaly.why_unusual}\n` +
      `Set anomaly.noticed = true only if the learner pointed out this specific thing as present/odd. ` +
      `Set anomaly.explained = true only if they conveyed WHY it is out of place (the reason above, in their own words). ` +
      `These are independent: a learner can notice without explaining.`
    : `This scene has NO anomaly. Return anomaly: null.`;

  const systemPrompt =
    "You are a fair, experienced examiner for a spoken picture-description test. " +
    "You decide, for each listed scene element, whether the learner's spoken description expressed it. " +
    "Accept synonyms and paraphrase generously (man ≈ guy, sofa ≈ couch, kid ≈ child, jogging ≈ running). " +
    "Credit a [setting], [person], or [object] item if the learner clearly referred to it, even loosely. " +
    "Credit an [action] item only if the learner described what that person is doing. " +
    "Credit a [spatial] item ONLY if the learner actually expressed the spatial relationship between the two things " +
    "(e.g. 'the cup is ON the table') — naming both nouns separately is NOT enough. " +
    "Do not credit things the learner did not say, and do not penalise extra correct observations. " +
    "Return exactly one match entry for every id provided.";

  const userPrompt =
    `SCENE TITLE: ${scene.title}\n\n` +
    `ANSWER KEY (exhaustive prose description of the picture, for comprehension):\n${scene.ground_truth_description}\n\n` +
    `SCENE ELEMENTS TO SCORE (report matched true/false for every id):\n${itemLines}\n\n` +
    `${anomalyBlock}\n\n` +
    `LEARNER'S TRANSCRIPT:\n"""${transcript}"""`;

  const payload = {
    model: process.env.OPENAI_SCORING_MODEL || DEFAULT_MODEL,
    temperature: 0,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "scene_scoring", strict: true, schema },
    },
  };

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the scoring service." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[score] OpenAI ${response.status}: ${detail}`);
    return NextResponse.json(
      { error: "Scoring failed. Please try again." },
      { status: 502 },
    );
  }

  const completion = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "Scoring returned no result." },
      { status: 502 },
    );
  }

  // Guaranteed valid by strict structured outputs; parse straight through.
  const result = JSON.parse(content);
  return NextResponse.json(result);
}
