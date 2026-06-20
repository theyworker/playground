import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { DRINKS_COLLECTION, getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      { error: "Storage is not configured (missing MONGODB_URI)." },
      { status: 500 },
    );
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const res = await db
      .collection(DRINKS_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[alcohol] DELETE failed:", err);
    return NextResponse.json({ error: "Could not delete entry." }, { status: 500 });
  }
}
