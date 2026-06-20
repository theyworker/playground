import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  DEFAULT_STATE,
  sanitizeGameState,
  type GameState,
} from "@/app/dini-water-game/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The game is single-user, so the whole state lives in one document.
const WATER_COLLECTION = "water_state";
const DOC_ID = "dini";

interface WaterDoc {
  _id: string;
  goal: number;
  logs: GameState["logs"];
}

function configError() {
  return NextResponse.json(
    { error: "Storage is not configured (missing MONGODB_URI)." },
    { status: 500 },
  );
}

export async function GET() {
  if (!process.env.MONGODB_URI) return configError();
  try {
    const db = await getDb();
    const doc = await db
      .collection<WaterDoc>(WATER_COLLECTION)
      .findOne({ _id: DOC_ID });
    const state: GameState = doc
      ? { goal: doc.goal, logs: doc.logs }
      : { ...DEFAULT_STATE };
    return NextResponse.json({ state: sanitizeGameState(state) });
  } catch (err) {
    console.error("[water] GET failed:", err);
    return NextResponse.json(
      { error: "Could not load game state." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!process.env.MONGODB_URI) return configError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const state = sanitizeGameState(body);
  try {
    const db = await getDb();
    await db.collection<WaterDoc>(WATER_COLLECTION).updateOne(
      { _id: DOC_ID },
      { $set: { goal: state.goal, logs: state.logs } },
      { upsert: true },
    );
    return NextResponse.json({ state });
  } catch (err) {
    console.error("[water] PUT failed:", err);
    return NextResponse.json(
      { error: "Could not save game state." },
      { status: 500 },
    );
  }
}
