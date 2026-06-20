import { NextRequest, NextResponse } from "next/server";
import { DRINKS_COLLECTION, getDb } from "@/lib/mongodb";
import { validateDrinkInput } from "@/app/alcohol-tracker/validation";
import type { DrinkEntry } from "@/app/alcohol-tracker/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DrinkDoc {
  consumedAt: string;
  type: DrinkEntry["type"];
  quantity: number;
  setting: string;
  category: DrinkEntry["category"];
  note?: string;
  createdAt: string;
}

function toEntry(id: string, doc: DrinkDoc): DrinkEntry {
  return {
    id,
    consumedAt: doc.consumedAt,
    type: doc.type,
    quantity: doc.quantity,
    setting: doc.setting,
    category: doc.category,
    note: doc.note,
    createdAt: doc.createdAt,
  };
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
    const docs = await db
      .collection<DrinkDoc>(DRINKS_COLLECTION)
      .find({})
      .sort({ consumedAt: -1 })
      .toArray();
    const entries = docs.map((d) => toEntry(d._id.toString(), d));
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[alcohol] GET failed:", err);
    return NextResponse.json({ error: "Could not load entries." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.MONGODB_URI) return configError();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const result = validateDrinkInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const db = await getDb();
    const doc: DrinkDoc = { ...result.value, createdAt: new Date().toISOString() };
    const inserted = await db.collection<DrinkDoc>(DRINKS_COLLECTION).insertOne(doc);
    return NextResponse.json(
      { entry: toEntry(inserted.insertedId.toString(), doc) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[alcohol] POST failed:", err);
    return NextResponse.json({ error: "Could not save entry." }, { status: 500 });
  }
}
